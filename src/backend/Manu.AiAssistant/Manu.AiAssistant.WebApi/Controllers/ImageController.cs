using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Manu.AiAssistant.WebApi.Options;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Manu.AiAssistant.WebApi.Models.Image;
using Azure.Storage.Blobs;
using System.Net;
using Microsoft.Extensions.Logging;

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
        private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

        public ImageController(
            IHttpClientFactory httpClientFactory,
            IOptions<DalleOptions> options,
            BlobServiceClient blobServiceClient,
            IOptions<AzureStorageOptions> storageOptions,
            ILogger<ImageController> logger)
        {
            _httpClient = httpClientFactory.CreateClient("external");
            _options = options.Value;
            _blobServiceClient = blobServiceClient;
            _storageOptions = storageOptions.Value;
            _logger = logger;
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

            if (!response.IsSuccessStatusCode)
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

                return StatusCode((int)response.StatusCode, TryParseJson(responseContent));
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
                            var newUrl = $"{Request.Scheme}://{Request.Host}/api/{this.ControllerContext.RouteData.Values["controller"]}/{blobName}";
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
                return Content(newResponseJson, "application/json", Encoding.UTF8);
            }

            return Content(responseContent, "application/json", Encoding.UTF8);
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

            var blobClient = containerClient.GetBlobClient(Guid.NewGuid() + Path.GetExtension(image.FileName));
            using (var stream = image.OpenReadStream())
            {
                await blobClient.UploadAsync(stream, overwrite: false, cancellationToken);
            }

            return Ok(new { url = blobClient.Uri.ToString() });
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
