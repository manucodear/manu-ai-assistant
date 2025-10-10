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
    [Authorize(AuthenticationSchemes = "Identity.Application,Bearer")]
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
            IDalleProvider dalleProvider)
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
            Manu.AiAssistant.WebApi.Models.Entities.ImageData? imageData = null;
            string? generatedId = null;

            if (isError)
            {
                var imageEntity = new Image
                {
                    Id = Guid.NewGuid().ToString(),
                    Username = User?.Identity?.IsAuthenticated == true ? User.Identity.Name! : "anonymous",
                    Timestamp = DateTime.UtcNow,
                    DalleRequest = payload,
                    DalleResponse = responseContent.ParseJsonToPlainObject() ?? new { error = responseContent },
                    HasError = true,
                    ImageData = null
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
                HasError = false,
                Prompt = request.Prompt,
                ImageData = imageData
            };
            await _imageRepository.AddAsync(entity, cancellationToken);
            return Ok(new
            {
                id = entity.Id,
                image = entity.ImageData,
                prompt = request.Prompt
            });
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
            // Optionally also log upload events similarly (not requested now)
            // If you want to log uploads, call StoreImageLogAsync(request, ..., ..., ..., ..., cancellationToken, id)
            return Ok(resultObj);
        }

        [HttpGet]
        public async Task<IActionResult> GetUserImages(CancellationToken cancellationToken)
        {
            var username = User?.Identity?.IsAuthenticated == true ? User.Identity!.Name : null;
            if (string.IsNullOrEmpty(username)) return Unauthorized();

            var userItems = await _imageRepository.GetByUsernameAndNoErrorAsync(username, cancellationToken);
            var ordered = userItems.OrderByDescending(g => g.Timestamp).ToList();

            var images = new List<object>();
            foreach (var g in ordered)
            {
                images.Add(new {
                    image = new {
                        id = g.Id,
                        timestamp = g.Timestamp,
                        prompt = g.Prompt ?? string.Empty,
                        url = g.ImageData?.Url,
                        smallUrl = g.ImageData?.SmallUrl,
                        mediumUrl = g.ImageData?.MediumUrl,
                        largeUrl = g.ImageData?.LargeUrl
                    }
                });
            }

            return Ok(new { images });
        }
    }
}
