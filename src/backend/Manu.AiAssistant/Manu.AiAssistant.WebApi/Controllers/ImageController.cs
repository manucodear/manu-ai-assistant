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
        private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

        public ImageController(
            IHttpClientFactory httpClientFactory,
            IOptions<DalleOptions> options,
            BlobServiceClient blobServiceClient,
            IOptions<AzureStorageOptions> storageOptions,
            ILogger<ImageController> logger,
            CosmosRepository<ImageGeneration> imageGenerationRepository,
            IOptions<AppOptions> appOptions)
        {
            _httpClient = httpClientFactory.CreateClient("external");
            _options = options.Value;
            _blobServiceClient = blobServiceClient;
            _storageOptions = storageOptions.Value;
            _logger = logger;
            _imageGenerationRepository = imageGenerationRepository;
            _appOptions = appOptions.Value;
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
            if (string.IsNullOrWhiteSpace(_options.Endpoint) || string.IsNullOrWhiteSpace(_options.ApiKey))
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new { error = "Dalle endpoint or key not configured" });
            }

            // Use enums for size, style, and quality
            var sizeEnum = DalleImageSize.Size1024x1024;
            var styleEnum = DalleImageStyle.Vivid;
            var qualityEnum = DalleImageQuality.Standard;

            string sizeString = sizeEnum.ToApiString();
            string styleString = styleEnum.ToString().ToLowerInvariant();
            string qualityString = qualityEnum.ToString().ToLowerInvariant();

            // Prepare request payload according to required structure
            var payload = new
            {
                model = request.Model,
                prompt = request.Prompt,
                size = sizeString,
                style = styleString,
                quality = qualityString,
                n = 1
            };

            var json = JsonSerializer.Serialize(payload, JsonOptions);
            using var httpRequest = new HttpRequestMessage(HttpMethod.Post, _options.Endpoint)
            {
                Content = new StringContent(json, Encoding.UTF8, "application/json")
            };

            httpRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _options.ApiKey);

            using var response = await _httpClient.SendAsync(httpRequest, HttpCompletionOption.ResponseHeadersRead, cancellationToken);

            var responseContent = await response.Content.ReadAsStringAsync(cancellationToken);

            bool isError = !response.IsSuccessStatusCode;
            List<string> finalImageUrls = new();
            object dalleResponseObj = null;

            if (isError)
            {
                // Collect diagnostics without exposing secrets
                response.Headers.TryGetValues("x-ms-request-id", out var reqIdValues);
                var requestId = reqIdValues?.FirstOrDefault();

                var requestDiagnostics = new
                {
                    Endpoint = _options.Endpoint,
                    Payload = payload,
                    Headers = new
                    {
                        Authorization = MaskApiKey(_options.ApiKey)
                    },
                    Response = new
                    {
                        StatusCode = (int)response.StatusCode,
                        Reason = response.ReasonPhrase,
                        RequestId = requestId,
                        ContentSnippet = SafeSnippet(responseContent, 2000)
                    }
                };

                _logger.LogError("DALL-E generation failed. {@Diagnostics}", requestDiagnostics);
                dalleResponseObj = TryParseJson(responseContent);
            }
            else
            {
                // Optional: log success at Debug level
                response.Headers.TryGetValues("x-ms-request-id", out var reqIdValues);
                var requestId = reqIdValues?.FirstOrDefault();
                _logger.LogDebug("DALL-E generation succeeded. Status: {Status} RequestId: {ReqId}", (int)response.StatusCode, requestId);
            }

            // Parse DALL-E response and replace image URLs
            using var doc = JsonDocument.Parse(responseContent);
            var root = doc.RootElement.Clone();
            if (root.TryGetProperty("data", out var dataArray) && dataArray.ValueKind == JsonValueKind.Array)
            {
                var containerClient = _blobServiceClient.GetBlobContainerClient(_storageOptions.ContainerName);
                await containerClient.CreateIfNotExistsAsync(cancellationToken: cancellationToken);
                var newData = new List<JsonElement>();
                foreach (var item in dataArray.EnumerateArray())
                {
                    if (item.TryGetProperty("url", out var urlProp))
                    {
                        var originalUrl = urlProp.GetString();
                        if (!string.IsNullOrWhiteSpace(originalUrl))
                        {
                            // Use HttpClient instead of WebClient
                            using var imageResponse = await _httpClient.GetAsync(originalUrl, cancellationToken);
                            if (!imageResponse.IsSuccessStatusCode)
                            {
                                newData.Add(item); // fallback: keep original if download fails
                                continue;
                            }
                            byte[] imageBytes = await imageResponse.Content.ReadAsByteArrayAsync(cancellationToken);
                            var guid = Guid.NewGuid().ToString();
                            var blobName = guid + ".png";
                            var blobClient = containerClient.GetBlobClient(blobName);
                            using var ms = new MemoryStream(imageBytes);
                            await blobClient.UploadAsync(ms, overwrite: false, cancellationToken);
                            var publicDomain = _appOptions.PublicImageDomain?.TrimEnd('/');
                            var newUrl = $"{publicDomain}/api/{this.ControllerContext.RouteData.Values["controller"]}/{blobName}";
                            finalImageUrls.Add(newUrl.ToLower());
                            // Create a new object with the replaced url
                            using var itemDoc = JsonDocument.Parse(item.GetRawText());
                            var itemObj = itemDoc.RootElement.EnumerateObject().ToDictionary(p => p.Name, p => p.Value);
                            itemObj["url"] = JsonDocument.Parse(JsonSerializer.Serialize(newUrl)).RootElement;
                            var newItemJson = JsonSerializer.Serialize(itemObj.ToDictionary(kv => kv.Key, kv => kv.Value));
                            newData.Add(JsonDocument.Parse(newItemJson).RootElement);
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
                responseDict["data"] = JsonDocument.Parse(JsonSerializer.Serialize(newData)).RootElement;
                var newResponseJson = JsonSerializer.Serialize(responseDict.ToDictionary(kv => kv.Key, kv => kv.Value));
                dalleResponseObj ??= TryParseJson(newResponseJson);
                // Store log in CosmosDB
                await StoreImageGenerationLogAsync(request, payload, dalleResponseObj, isError, finalImageUrls, cancellationToken);
                return Content(newResponseJson, "application/json", Encoding.UTF8);
            }

            dalleResponseObj ??= TryParseJson(responseContent);
            await StoreImageGenerationLogAsync(request, payload, dalleResponseObj, isError, finalImageUrls, cancellationToken);
            return Content(responseContent, "application/json", Encoding.UTF8);
        }

        private async Task StoreImageGenerationLogAsync(GenerateRequest request, object dalleRequest, object dalleResponse, bool error, List<string> imageUrls, CancellationToken cancellationToken, List<string>? smallThumbUrls = null, List<string>? mediumThumbUrls = null)
        {
            var username = User?.Identity?.IsAuthenticated == true ? User.Identity.Name : "anonymous";
            var generation = new ImageGeneration
            {
                Username = username,
                TimestampUtc = DateTime.UtcNow,
                DalleRequest = dalleRequest,
                DalleResponse = dalleResponse,
                Error = error,
                ImageUrls = imageUrls,
                // Add thumbnail URLs to the log if provided
                // You may want to extend ImageGeneration to support these fields if not present
            };
            // Optionally, add thumbnail URLs to a dictionary or extend the model
            if (smallThumbUrls != null || mediumThumbUrls != null)
            {
                var extra = new Dictionary<string, object>();
                if (smallThumbUrls != null) extra["ThumbnailSmall"] = smallThumbUrls;
                if (mediumThumbUrls != null) extra["ThumbnailMedium"] = mediumThumbUrls;
                generation.DalleResponse = new { dalleResponse, extra };
            }
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

            var containerClient = _blobServiceClient.GetBlobContainerClient(_storageOptions.ContainerName);
            await containerClient.CreateIfNotExistsAsync(cancellationToken: cancellationToken);

            var originalExtension = Path.GetExtension(image.FileName);
            var baseName = Guid.NewGuid().ToString();
            var originalBlobName = baseName + originalExtension;
            var smallThumbName = baseName + ".small.png";
            var mediumThumbName = baseName + ".medium.png";

            var blobClient = containerClient.GetBlobClient(originalBlobName);
            var smallThumbClient = containerClient.GetBlobClient(smallThumbName);
            var mediumThumbClient = containerClient.GetBlobClient(mediumThumbName);

            // Upload original
            using (var stream = image.OpenReadStream())
            {
                await blobClient.UploadAsync(stream, overwrite: false, cancellationToken);
            }

            // Generate and upload thumbnails
            using (var imageStream = image.OpenReadStream())
            using (var img = await Image.LoadAsync(imageStream, cancellationToken))
            {
                // Small thumb (32x32)
                using (var msSmall = new MemoryStream())
                {
                    img.Clone(ctx => ctx.Resize(new ResizeOptions
                    {
                        Size = new Size(32, 32),
                        Mode = ResizeMode.Max
                    })).Save(msSmall, PngFormat.Instance);
                    msSmall.Position = 0;
                    await smallThumbClient.UploadAsync(msSmall, overwrite: true, cancellationToken);
                }
                // Medium thumb (64x64)
                using (var msMedium = new MemoryStream())
                {
                    img.Clone(ctx => ctx.Resize(new ResizeOptions
                    {
                        Size = new Size(64, 64),
                        Mode = ResizeMode.Max
                    })).Save(msMedium, PngFormat.Instance);
                    msMedium.Position = 0;
                    await mediumThumbClient.UploadAsync(msMedium, overwrite: true, cancellationToken);
                }
            }

            var publicDomain = _appOptions.PublicImageDomain?.TrimEnd('/');
            var controllerName = this.ControllerContext.RouteData.Values["controller"];
            var originalUrl = $"{publicDomain}/api/{controllerName}/{originalBlobName}".ToLower();
            var smallThumbUrl = $"{publicDomain}/api/{controllerName}/{smallThumbName}".ToLower();
            var mediumThumbUrl = $"{publicDomain}/api/{controllerName}/{mediumThumbName}".ToLower();

            return Ok(new {
                url = originalUrl,
                thumbnailSmall = smallThumbUrl,
                thumbnailMedium = mediumThumbUrl
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
