using AutoMapper;
using Manu.AiAssistant.WebApi.Data;
using Manu.AiAssistant.WebApi.Extensions;
using Manu.AiAssistant.WebApi.Models.Api;
using Manu.AiAssistant.WebApi.Models.Entities;
using Manu.AiAssistant.WebApi.Options;
using Manu.AiAssistant.WebApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using System.Net.Http;
using System.Security.Claims;
using System.Text.Json;

namespace Manu.AiAssistant.WebApi.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class ImagePromptController : ControllerBase
    {
        private readonly IImagePromptProvider _imagePromptProvider;
        private readonly IDalleProvider _dalleProvider;
        private readonly CosmosRepository<Prompt> _promptRepository;
        private readonly CosmosRepository<Image> _imageRepository;
        private readonly IMapper _mapper;
        private readonly HttpClient _httpClient;
        private readonly IImageProcessingProvider _imageProcessingProvider;
        private readonly IImageStorageProvider _imageStorageProvider;
        private readonly AppOptions _appOptions;

        public ImagePromptController(
            IHttpClientFactory httpClientFactory,
            IImagePromptProvider imagePromptProvider,
            IDalleProvider dalleProvider,
            CosmosRepository<Prompt> promptRepository,
            CosmosRepository<Image> imageRepository,
            IImageProcessingProvider imageProcessingProvider,
            IImageStorageProvider imageStorageProvider,
            IOptions<AppOptions> appOptions,
            IMapper mapper)
        {
            _httpClient = httpClientFactory.CreateClient("external");
            _imagePromptProvider = imagePromptProvider;
            _dalleProvider = dalleProvider;
            _promptRepository = promptRepository;
            _imageRepository = imageRepository;
            _imageProcessingProvider = imageProcessingProvider;
            _imageStorageProvider = imageStorageProvider;
            _appOptions = appOptions.Value;
            _mapper = mapper;
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> Get(string id, CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(id))
            {
                return BadRequest("Id is required.");
            }

            var prompt = await _promptRepository.GetAsync(id, cancellationToken);
            if (prompt == null)
            {
                return NotFound();
            }

            var result = _mapper.Map<ImagePromptResponse>(prompt);
            return Ok(result);
        }

        [HttpPost]
        public async Task<IActionResult> Post([FromBody] ImagePromptGenerateRequest request, CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(request.Prompt))
            {
                return BadRequest("Prompt is required.");
            }
            // TODO: use long / short parameter
            try
            {
                var result = await _imagePromptProvider.GetImagePromptResponseAsync(request.Prompt, request.ConversationId, cancellationToken);
                // Map and persist from ImagePromptResult
                var promptEntity = _mapper.Map<Prompt>(result);
                promptEntity.Username = User?.Identity?.IsAuthenticated == true ? User.Identity.Name! : "anonymous";
                promptEntity.Timestamp = DateTime.UtcNow;
                if (!string.IsNullOrEmpty(request.UserImageUrl))
                {
                    promptEntity.UserImageUrl = request.UserImageUrl;
                    var userId = User!.FindFirstValue(ClaimTypes.NameIdentifier) ?? User!.FindFirstValue("sub");
                    var userImageUrl = userId + "/" + request.UserImageUrl;
                    promptEntity.UserImageAnalysis = await _imagePromptProvider.ImageAnalisysAsync(promptEntity.OriginalPrompt, promptEntity.ImprovedPrompt, userImageUrl, cancellationToken);
                }
                await _promptRepository.AddAsync(promptEntity, cancellationToken);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Failed to generate image prompt: {ex.Message}");
            }
        }

        [HttpPost("{id}/image")]
        public async Task<IActionResult> Generate(string id, CancellationToken cancellationToken)
        {
            var imagePrompt = await _promptRepository.GetAsync(id, cancellationToken);
            if (imagePrompt == null)
            {
                return NotFound();
            }

            // Early return: if the prompt already has an associated ImageId, fetch and return it instead of generating again.
            if (!string.IsNullOrWhiteSpace(imagePrompt.ImageId))
            {
                var existingImage = await _imageRepository.GetAsync(imagePrompt.ImageId, cancellationToken);
                if (existingImage != null && existingImage.ImageData != null)
                {
                    var existingPromptResponse = _mapper.Map<ImagePromptResponse>(imagePrompt);
                    return Ok(new ImageResponse
                    {
                        Id = existingImage.Id,
                        Timestamp = existingImage.Timestamp,
                        ImageData = new ImageDataResponse
                        {
                            Url = existingImage.ImageData.Url,
                            SmallUrl = existingImage.ImageData.SmallUrl,
                            MediumUrl = existingImage.ImageData.MediumUrl,
                            LargeUrl = existingImage.ImageData.LargeUrl
                        },
                        ImagePrompt = existingPromptResponse
                    });
                }
            }

            var dalleResult = await _dalleProvider.GenerateImageAsync(imagePrompt, cancellationToken);
            var responseContent = dalleResult.ResponseContent;
            bool isError = dalleResult.IsError;
            ImageData? imageData = null;
            string? generatedId = null;

            if (isError)
            {
                var imageEntity = new Image
                {
                    Id = Guid.NewGuid().ToString(),
                    Username = User?.Identity?.IsAuthenticated == true ? User.Identity.Name! : "anonymous",
                    Timestamp = DateTime.UtcNow,
                    DalleRequest = dalleResult.DalleRequest,
                    DalleResponse = responseContent.ParseJsonToPlainObject() ?? new { error = responseContent },
                    ImagePrompt = imagePrompt,
                    Prompt = imagePrompt.ImprovedPrompt,
                    HasError = true,
                    ImageData = new()
                };
                await _imageRepository.AddAsync(imageEntity, cancellationToken);
                return BadRequest(imageEntity.DalleResponse);
            }

            using var doc = JsonDocument.Parse(responseContent);
            var root = doc.RootElement.Clone();
            if (root.TryGetProperty("data", out var dataArray) && dataArray.ValueKind == JsonValueKind.Array)
            {
                foreach (var item in dataArray.EnumerateArray())
                {
                    if (!item.TryGetProperty("url", out var urlProp)) continue;
                    var originalUrl = urlProp.GetString();
                    if (string.IsNullOrWhiteSpace(originalUrl)) continue;

                    using var imageResponse = await _httpClient.GetAsync(originalUrl, cancellationToken);
                    if (!imageResponse.IsSuccessStatusCode) break;

                    using var remoteStream = await imageResponse.Content.ReadAsStreamAsync(cancellationToken);
                    var originalMemory = new MemoryStream();
                    await remoteStream.CopyToAsync(originalMemory, cancellationToken);
                    originalMemory.Position = 0;

                    var thumbResults = await _imageProcessingProvider.GenerateThumbnailsAsync(originalMemory, [ThumbnailSize.Small, ThumbnailSize.Medium, ThumbnailSize.Large], cancellationToken);
                    var newId = Guid.NewGuid().ToString();
                    generatedId = newId;
                    var basePath = _appOptions.ImagePath.TrimEnd('/');
                    string originalFileName = newId + ".png";

                    originalMemory.Position = 0;
                    await _imageStorageProvider.UploadImageAsync(originalMemory, originalFileName, cancellationToken);
                    foreach (var (size, tuple) in thumbResults)
                    {
                        var (stream, ext) = tuple;
                        stream.Position = 0;
                        await _imageStorageProvider.UploadImageAsync(stream, newId + ext, cancellationToken);
                        stream.Dispose();
                    }
                    originalMemory.Dispose();

                    var originalStoredUrl = $"{basePath}/{originalFileName}".ToLower();
                    var smallUrl = $"{basePath}/{newId}{ThumbnailSize.Small.ToFileSuffix()}".ToLower();
                    var mediumUrl = $"{basePath}/{newId}{ThumbnailSize.Medium.ToFileSuffix()}".ToLower();
                    var largeUrl = $"{basePath}/{newId}{ThumbnailSize.Large.ToFileSuffix()}".ToLower();

                    imageData = new Models.Entities.ImageData
                    {
                        Url = originalStoredUrl,
                        SmallUrl = smallUrl,
                        MediumUrl = mediumUrl,
                        LargeUrl = largeUrl
                    };
                    break; // Only process the first image
                }
            }

            var entity = new Image
            {
                Id = generatedId ?? Guid.NewGuid().ToString(),
                Username = User?.Identity?.IsAuthenticated == true ? User.Identity.Name! : "anonymous",
                Timestamp = DateTime.UtcNow,
                DalleRequest = dalleResult.DalleRequest,
                DalleResponse = responseContent.ParseJsonToPlainObject() ?? responseContent,
                ImagePrompt = imagePrompt,
                Prompt = imagePrompt.ImprovedPrompt,
                HasError = false,
                ImageData = imageData!
            };
            await _imageRepository.AddAsync(entity, cancellationToken);
            imagePrompt.ImageId = entity.Id;
            await _promptRepository.UpdateAsync(imagePrompt, cancellationToken);
            var imagePromptResponse = _mapper.Map<ImagePromptResponse>(imagePrompt);
            return Ok(new ImageResponse
            {
                Id = entity.Id,
                Timestamp = entity.Timestamp,
                ImageData = new ImageDataResponse
                {
                    Url = entity.ImageData.Url,
                    SmallUrl = entity.ImageData.SmallUrl,
                    MediumUrl = entity.ImageData.MediumUrl,
                    LargeUrl = entity.ImageData.LargeUrl
                },
                ImagePrompt = imagePromptResponse
            });
        }

        [HttpPut]
        public async Task<IActionResult> PromptRevision([FromBody] ImagePromptRevisionRequest request, CancellationToken cancellationToken)
        {
            var result = await _imagePromptProvider.PromptRevisionAsync(request, cancellationToken);
            if (result == null || string.IsNullOrWhiteSpace(result.RevisedPrompt))
            {
                return StatusCode(500, "Failed to parse prompt revision result.");
            }
            return Ok(result);
        }
    }
}
