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

namespace Manu.AiAssistant.WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ImageController : Controller
    {
        private readonly HttpClient _httpClient;
        private readonly DalleOptions _options;
        private readonly BlobServiceClient _blobServiceClient;
        private readonly AzureStorageOptions _storageOptions;
        private readonly ILogger<ImageController> _logger;
        private readonly CosmosRepository<ImageGeneration> _imageGenerationRepository;
        private readonly AppOptions _appOptions;
        private readonly IImageStorageProvider _imageStorageProvider;
        private readonly IImageProcessingProvider _imageProcessingProvider;
        private readonly IDalleProvider _dalleProvider;
        private static readonly JsonSerializerOptions CamelCaseOptions = new(JsonSerializerDefaults.Web)
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };

        public ImageController(
            IHttpClientFactory httpClientFactory,
            IOptions<DalleOptions> options,
            BlobServiceClient blobServiceClient,
            IOptions<AzureStorageOptions> storageOptions,
            ILogger<ImageController> logger,
            CosmosRepository<ImageGeneration> imageGenerationRepository,
            IOptions<AppOptions> appOptions,
            IImageStorageProvider imageStorageProvider,
            IImageProcessingProvider imageProcessingProvider,
            IDalleProvider dalleProvider)
        {
            _httpClient = httpClientFactory.CreateClient("external");
            _options = options.Value;
            _blobServiceClient = blobServiceClient;
            _storageOptions = storageOptions.Value;
            _logger = logger;
            _imageGenerationRepository = imageGenerationRepository;
            _appOptions = appOptions.Value;
            _imageStorageProvider = imageStorageProvider;
            _imageProcessingProvider = imageProcessingProvider;
            _dalleProvider = dalleProvider;
        }

        [HttpGet("{filename}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetImage(string filename, CancellationToken cancellationToken)
        {
            var containerClient = _blobServiceClient.GetBlobContainerClient(_storageOptions.ContainerName);
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
                prompt = request.Prompt,
                size = request.Size,
                style = request.Style,
                quality = request.Quality,
                n = request.N > 0 ? request.N : 1
            };
            var dalleResult = await _dalleProvider.GenerateImageAsync(request, cancellationToken);
            var responseContent = dalleResult.ResponseContent;
            bool isError = dalleResult.IsError;
            Dictionary<string, string>? imageUrlObject = null;
            object? storedResponseObject = null; // what we will persist

            if (isError)
            {
                _logger.LogError("DALL-E generation failed. Response: {Response}", responseContent);
                storedResponseObject = responseContent.ParseJsonToPlainObject() ?? new { error = responseContent };
                await StoreImageGenerationLogAsync(request, payload, storedResponseObject, true, imageUrlObject, cancellationToken);
                return BadRequest(storedResponseObject);
            }

            using var doc = JsonDocument.Parse(responseContent);
            var root = doc.RootElement.Clone();
            if (root.TryGetProperty("data", out var dataArray) && dataArray.ValueKind == JsonValueKind.Array)
            {
                // Process only the first element that contains a url; we no longer build a transformed JSON response.
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

                    imageUrlObject = new Dictionary<string, string>
                    {
                        { "url", originalStoredUrl },
                        { "smallUrl", smallUrl },
                        { "mediumUrl", mediumUrl },
                        { "largeUrl", largeUrl }
                    };
                    break; // stop after first processed image
                }

                storedResponseObject = responseContent.ParseJsonToPlainObject() ?? new { raw = responseContent }; // ensure object, not plain string
                var generationEntity = await StoreImageGenerationLogAsync(request, payload, storedResponseObject!, false, imageUrlObject, cancellationToken);
                return Ok(new {
                    id = generationEntity.Id,
                    image = imageUrlObject,
                    prompt = request.Prompt
                });
            }

            storedResponseObject = responseContent.ParseJsonToPlainObject() ?? new { raw = responseContent };
            var generationEntityFallback = await StoreImageGenerationLogAsync(request, payload, storedResponseObject, false, imageUrlObject, cancellationToken);
            return Ok(new
            {
                id = generationEntityFallback.Id,
                image = imageUrlObject,
                prompt = request.Prompt
            });
        }

        private async Task<ImageGeneration> StoreImageGenerationLogAsync(GenerateRequest request, object dalleRequest, object dalleResponse, bool error, Dictionary<string, string>? imageUrl, CancellationToken cancellationToken)
        {
            var username = User?.Identity?.IsAuthenticated == true ? User.Identity.Name : "anonymous";
            var generation = new ImageGeneration
            {
                Username = username!,
                TimestampUtc = DateTime.UtcNow,
                DalleRequest = dalleRequest,
                DalleResponse = dalleResponse,
                Error = error
            };
            var extra = new Dictionary<string, object>();
            if (imageUrl != null)
            {
                extra["image"] = imageUrl; // standardized shape
            }
            generation.DalleResponse = new { dalleResponse, extra };
            await _imageGenerationRepository.AddAsync(generation, cancellationToken);
            return generation;
        }

        [HttpPost("Upload")]
        [AllowAnonymous]
        public async Task<IActionResult> UploadImage([FromForm] IFormFile image, CancellationToken cancellationToken)
        {
            if (image == null || image.Length == 0)
                return BadRequest("No file uploaded.");

            using var original = new MemoryStream();
            await image.CopyToAsync(original, cancellationToken);
            original.Position = 0;
            var thumbSet = await _imageProcessingProvider.GenerateThumbnailsAsync(original, new[] { ThumbnailSize.Small, ThumbnailSize.Medium, ThumbnailSize.Large }, cancellationToken);
            var id = Guid.NewGuid().ToString();
            var basePath = _appOptions.ImagePath.TrimEnd('/');
            var ext = Path.GetExtension(image.FileName);
            if (string.IsNullOrWhiteSpace(ext)) ext = ".png";
            await _imageStorageProvider.UploadImageAsync(original, id + ext, cancellationToken);
            foreach (var (size, tuple) in thumbSet)
            {
                var (stream, suffix) = tuple;
                stream.Position = 0;
                await _imageStorageProvider.UploadImageAsync(stream, id + suffix, cancellationToken);
                stream.Dispose();
            }

            var resultObj = new
            {
                url = $"{basePath}/{id + ext}".ToLower(),
                thumbnailSmall = $"{basePath}/{id}{ThumbnailSize.Small.ToFileSuffix()}".ToLower(),
                thumbnailMedium = $"{basePath}/{id}{ThumbnailSize.Medium.ToFileSuffix()}".ToLower(),
                thumbnailLarge = $"{basePath}/{id}{ThumbnailSize.Large.ToFileSuffix()}".ToLower()
            };
            return Ok(resultObj);
        }
    }
}
