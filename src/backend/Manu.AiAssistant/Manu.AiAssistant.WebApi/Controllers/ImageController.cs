using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Manu.AiAssistant.WebApi.Options;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace Manu.AiAssistant.WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ImageController : Controller
    {
        private readonly HttpClient _httpClient;
        private readonly DalleOptions _options;
        private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

        public ImageController(IHttpClientFactory httpClientFactory, IOptions<DalleOptions> options)
        {
            _httpClient = httpClientFactory.CreateClient();
            _options = options.Value;
        }

        public IActionResult Index()
        {
            return Ok();
        }

        public record ImageInput(string Url);
        public record GenerateImageRequest(string Prompt, List<ImageInput> Images);

        [HttpPost]
        public async Task<IActionResult> Generate([FromBody] GenerateImageRequest request, CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(_options.Endpoint) || string.IsNullOrWhiteSpace(_options.ApiKey))
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new { error = "Dalle endpoint or key not configured" });
            }

            // Prepare request payload (pass-through with expected property names). Adjust if remote API differs.
            var payload = new
            {
                prompt = request.Prompt,
                images = request.Images.Select(i => new { url = i.Url }).ToArray()
            };

            var json = JsonSerializer.Serialize(payload, JsonOptions);
            using var httpRequest = new HttpRequestMessage(HttpMethod.Post, _options.Endpoint)
            {
                Content = new StringContent(json, Encoding.UTF8, "application/json")
            };

            // Common header patterns; adapt names to your DALL-E deployment conventions.
            httpRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _options.ApiKey);

            using var response = await _httpClient.SendAsync(httpRequest, HttpCompletionOption.ResponseHeadersRead, cancellationToken);

            var responseContent = await response.Content.ReadAsStringAsync(cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                return StatusCode((int)response.StatusCode, TryParseJson(responseContent));
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
    }
}
