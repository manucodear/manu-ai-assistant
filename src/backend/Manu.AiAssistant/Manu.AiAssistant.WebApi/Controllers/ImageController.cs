using System.IO;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Manu.AiAssistant.WebApi.Options;
using Manu.AiAssistant.WebApi.Models.Image;
using Manu.AiAssistant.WebApi.Models.Entities;
using Azure.Storage.Blobs;
using Microsoft.Extensions.Logging;
using Manu.AiAssistant.WebApi.Data;
using Manu.AiAssistant.WebApi.Services;
using Manu.AiAssistant.WebApi.Extensions;
using AutoMapper;

namespace Manu.AiAssistant.WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    // [Authorize(AuthenticationSchemes = "Identity.Application,Bearer")]
    [Authorize]
    public class ImageController : Controller
    {
        private readonly HttpClient _httpClient;
        private readonly DalleOptions _options;
        private readonly BlobServiceClient _blobServiceClient;
        private readonly AzureStorageOptions _storageOptions;
        private readonly ILogger<ImageController> _logger;
        private readonly CosmosRepository<Image> _imageRepository;
        private readonly AppOptions _appOptions;
        private readonly IImageStorageProvider _imageStorageProvider;
        private readonly IImageProcessingProvider _imageProcessingProvider;
        private readonly IDalleProvider _dalleProvider;
        private readonly IMapper _mapper;

        public ImageController(
            IHttpClientFactory httpClientFactory,
            IOptions<DalleOptions> options,
            BlobServiceClient blobServiceClient,
            IOptions<AzureStorageOptions> storageOptions,
            ILogger<ImageController> logger,
            CosmosRepository<Image> imageRepository,
            IOptions<AppOptions> appOptions,
            IImageStorageProvider imageStorageProvider,
            IImageProcessingProvider imageProcessingProvider,
            IDalleProvider dalleProvider,
            IMapper mapper)
        {
            _httpClient = httpClientFactory.CreateClient("external");
            _options = options.Value;
            _blobServiceClient = blobServiceClient;
            _storageOptions = storageOptions.Value;
            _logger = logger;
            _imageRepository = imageRepository;
            _appOptions = appOptions.Value;
            _imageStorageProvider = imageStorageProvider;
            _imageProcessingProvider = imageProcessingProvider;
            _dalleProvider = dalleProvider;
            _mapper = mapper;
        }

        [HttpGet("{filename}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetImage(string filename, CancellationToken cancellationToken)
        {
            var containerClient = _blobServiceClient.GetBlobContainerClient(_storageOptions.Containers.Image);
            var blobClient = containerClient.GetBlobClient(filename);
            if (!await blobClient.ExistsAsync(cancellationToken))
                return NotFound();

            var downloadInfo = await blobClient.DownloadAsync(cancellationToken);
            return File(downloadInfo.Value.Content, "image/png");
        }

        [HttpPost]
        [Route("Generate")]
        public async Task<IActionResult> Generate([FromBody] GenerateRequest request, CancellationToken cancellationToken)
        {
            var payload = new
            {
                model = request.Model,
                prompt = request.ImagePrompt.ImprovedPrompt,
                size = request.Size,
                style = request.Style,
                quality = request.Quality,
                n = request.N > 0 ? request.N : 1
            };
            var dalleResult = await _dalleProvider.GenerateImageAsync(request, cancellationToken);
            var responseContent = dalleResult.ResponseContent;
            bool isError = dalleResult.IsError;
            Manu.AiAssistant.WebApi.Models.Entities.ImageData? imageData = null;
            string? generatedId = null;
            var promptEntity = _mapper.Map<Prompt>(request.ImagePrompt);
            promptEntity.Id = request.ImagePrompt.Id;
            promptEntity.Username = User?.Identity?.IsAuthenticated == true ? User.Identity.Name! : "anonymous";

            if (isError)
            {
                var imageEntity = new Image
                {
                    Id = Guid.NewGuid().ToString(),
                    Username = User?.Identity?.IsAuthenticated == true ? User.Identity.Name! : "anonymous",
                    Timestamp = DateTime.UtcNow,
                    DalleRequest = payload,
                    DalleResponse = responseContent.ParseJsonToPlainObject() ?? new { error = responseContent },
                    ImagePrompt = promptEntity,
                    Prompt = request.ImagePrompt.ImprovedPrompt,
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
                    var id = Guid.NewGuid().ToString();
                    generatedId = id;
                    var basePath = _appOptions.ImagePath.TrimEnd('/');
                    string originalFileName = id + ".png";

                    originalMemory.Position = 0;
                    await _imageStorageProvider.UploadImageAsync(originalMemory, originalFileName, cancellationToken);
                    foreach (var (size, tuple) in thumbResults)
                    {
                        var (stream, ext) = tuple;
                        stream.Position = 0;
                        await _imageStorageProvider.UploadImageAsync(stream, id + ext, cancellationToken);
                        stream.Dispose();
                    }
                    originalMemory.Dispose();

                    var originalStoredUrl = $"{basePath}/{originalFileName}".ToLower();
                    var smallUrl = $"{basePath}/{id}{ThumbnailSize.Small.ToFileSuffix()}".ToLower();
                    var mediumUrl = $"{basePath}/{id}{ThumbnailSize.Medium.ToFileSuffix()}".ToLower();
                    var largeUrl = $"{basePath}/{id}{ThumbnailSize.Large.ToFileSuffix()}".ToLower();

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
                DalleRequest = payload,
                DalleResponse = responseContent.ParseJsonToPlainObject() ?? responseContent,
                ImagePrompt = promptEntity,
                Prompt = request.ImagePrompt.ImprovedPrompt,
                HasError = false,
                ImageData = imageData!
            };
            await _imageRepository.AddAsync(entity, cancellationToken);
            return Ok(new
            {
                id = entity.Id,
                image = entity.ImageData,
                prompt = request.ImagePrompt
            });
        }

        [HttpGet]
        public async Task<IActionResult> GetImages(CancellationToken cancellationToken)
        {
            var username = User?.Identity?.IsAuthenticated == true ? User.Identity!.Name : null;
            if (string.IsNullOrEmpty(username)) return Unauthorized();

            var userItems = await _imageRepository.GetByUsernameAndNoErrorAsync(username, cancellationToken);
            var ordered = userItems.OrderByDescending(g => g.Timestamp).ToList();

            var images = new List<object>();
            foreach (var imageItem in ordered)
            {
                images.Add(new {
                    image = new {
                        id = imageItem.Id,
                        timestamp = imageItem.Timestamp,
                        prompt = imageItem.Prompt ?? string.Empty,
                        url = imageItem.ImageData?.Url,
                        smallUrl = imageItem.ImageData?.SmallUrl,
                        mediumUrl = imageItem.ImageData?.MediumUrl,
                        largeUrl = imageItem.ImageData?.LargeUrl
                    },
                    imagePromptId = !string.IsNullOrEmpty(imageItem.ImagePrompt.ConversationId) ? imageItem.ImagePrompt.Id : string.Empty
                });
            }

            return Ok(new { images });
        }
    }
}
