using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Manu.AiAssistant.WebApi.Options;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Manu.AiAssistant.WebApi.Models.Image;
using Manu.AiAssistant.WebApi.Models.Entities;
using Azure.Storage.Blobs;
using System.Net;
using Microsoft.Extensions.Logging;
using Manu.AiAssistant.WebApi.Data;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Processing;
using SixLabors.ImageSharp.Formats.Png;
using Manu.AiAssistant.WebApi.Services;

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
        private readonly IDalleProvider _dalleProvider;
        private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
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
            // Build payload for logging
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
            List<Dictionary<string, string>> imageUrlObjects = new();
            List<string> smallThumbUrls = new();
            List<string> mediumThumbUrls = new();
            object dalleResponseObj = null;

            if (isError)
            {
                _logger.LogError("DALL-E generation failed. Response: {Response}", responseContent);
                dalleResponseObj = TryParseJson(responseContent);
            }
            // Parse DALL-E response and replace image URLs
            using var doc = JsonDocument.Parse(responseContent);
            var root = doc.RootElement.Clone();
            if (root.TryGetProperty("data", out var dataArray) && dataArray.ValueKind == JsonValueKind.Array)
            {
                var newData = new List<JsonElement>();
                foreach (var item in dataArray.EnumerateArray())
                {
                    if (item.TryGetProperty("url", out var urlProp))
                    {
                        var originalUrl = urlProp.GetString();
                        if (!string.IsNullOrWhiteSpace(originalUrl))
                        {
                            // Download image
                            using var imageResponse = await _httpClient.GetAsync(originalUrl, cancellationToken);
                            if (!imageResponse.IsSuccessStatusCode)
                            {
                                newData.Add(item); // fallback: keep original if download fails
                                continue;
                            }
                            using var imageStream = await imageResponse.Content.ReadAsStreamAsync(cancellationToken);
                            var uploadResult = await _imageStorageProvider.UploadAndProcessAsync(imageStream, "dalle.png", cancellationToken);
                            // Build new item with replaced URLs
                            using var itemDoc = JsonDocument.Parse(item.GetRawText());
                            var itemObj = itemDoc.RootElement.EnumerateObject().ToDictionary(p => p.Name, p => p.Value);
                            itemObj["url"] = JsonDocument.Parse(JsonSerializer.Serialize(uploadResult.OriginalUrl)).RootElement;
                            itemObj["thumbnailSmallUrl"] = JsonDocument.Parse(JsonSerializer.Serialize(uploadResult.SmallThumbUrl)).RootElement;
                            itemObj["thumbnailMediumUrl"] = JsonDocument.Parse(JsonSerializer.Serialize(uploadResult.MediumThumbUrl)).RootElement;
                            var newItemJson = JsonSerializer.Serialize(itemObj.ToDictionary(kv => kv.Key, kv => kv.Value));
                            newData.Add(JsonDocument.Parse(newItemJson).RootElement);
                            // Collect thumb urls for logging
                            smallThumbUrls.Add(uploadResult.SmallThumbUrl);
                            mediumThumbUrls.Add(uploadResult.MediumThumbUrl);
                            imageUrlObjects.Add(new Dictionary<string, string> {
                                { "Original", uploadResult.OriginalUrl },
                                { "Small", uploadResult.SmallThumbUrl },
                                { "Medium", uploadResult.MediumThumbUrl }
                            });
                        }
                        else
                        {
                            newData.Add(item);
                        }
                    }
                    else
                    {
                        newData.Add(item);
                    }
                }
                // Build new response JSON
                var responseDict = root.EnumerateObject().ToDictionary(p => p.Name, p => p.Value);
                responseDict["data"] = JsonDocument.Parse(JsonSerializer.Serialize(newData, CamelCaseOptions)).RootElement;
                var newResponseJson = JsonSerializer.Serialize(responseDict.ToDictionary(kv => kv.Key, kv => kv.Value), CamelCaseOptions);
                dalleResponseObj ??= TryParseJson(newResponseJson);
                // Store log in CosmosDB
                await StoreImageGenerationLogAsync(request, payload, dalleResponseObj, isError, imageUrlObjects, cancellationToken, smallThumbUrls, mediumThumbUrls);
                return Content(newResponseJson, "application/json", Encoding.UTF8);
            }

            dalleResponseObj ??= TryParseJson(responseContent);
            await StoreImageGenerationLogAsync(request, payload, dalleResponseObj, isError, imageUrlObjects, cancellationToken);
            return Content(responseContent, "application/json", Encoding.UTF8);
        }

        private async Task StoreImageGenerationLogAsync(GenerateRequest request, object dalleRequest, object dalleResponse, bool error, List<Dictionary<string, string>> imageUrls, CancellationToken cancellationToken, List<string>? smallThumbUrls = null, List<string>? mediumThumbUrls = null)
        {
            var username = User?.Identity?.IsAuthenticated == true ? User.Identity.Name : "anonymous";
            var generation = new ImageGeneration
            {
                Username = username,
                TimestampUtc = DateTime.UtcNow,
                DalleRequest = dalleRequest,
                DalleResponse = dalleResponse,
                Error = error,
                ImageUrls = null // Not used anymore, but keep for compatibility if needed
            };
            // Store the new structure in DalleResponse for now
            var extra = new Dictionary<string, object>();
            extra["ImageUrls"] = imageUrls;
            if (smallThumbUrls != null) extra["ThumbnailSmall"] = smallThumbUrls;
            if (mediumThumbUrls != null) extra["ThumbnailMedium"] = mediumThumbUrls;
            generation.DalleResponse = new { dalleResponse, extra };
            await _imageGenerationRepository.AddAsync(generation, cancellationToken);
        }

        private static object? TryParseJson(string content)
        {
            try
            {
                return JsonSerializer.Deserialize<JsonElement>(content);
            }
            catch
            {
                return new { error = content };
            }
        }

        [HttpPost("Upload")]
        [AllowAnonymous]
        public async Task<IActionResult> UploadImage([FromForm] IFormFile image, CancellationToken cancellationToken)
        {
            if (image == null || image.Length == 0)
                return BadRequest("No file uploaded.");

            using var stream = image.OpenReadStream();
            var result = await _imageStorageProvider.UploadAndProcessAsync(stream, image.FileName, cancellationToken);

            return Ok(new {
                url = result.OriginalUrl,
                thumbnailSmall = result.SmallThumbUrl,
                thumbnailMedium = result.MediumThumbUrl
            });
        }

        private static string MaskApiKey(string apiKey)
        {
            if (string.IsNullOrEmpty(apiKey)) return string.Empty;
            var visible = Math.Min(4, apiKey.Length);
            return new string('*', Math.Max(0, apiKey.Length - visible)) + apiKey[^visible..];
        }

        private static string SafeSnippet(string content, int max)
        {
            if (string.IsNullOrEmpty(content)) return string.Empty;
            return content.Length <= max ? content : content.Substring(0, max) + "...";
        }
    }
}
