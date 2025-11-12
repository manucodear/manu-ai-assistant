using Manu.AiAssistant.WebApi.Models.Api;
using Manu.AiAssistant.WebApi.Models.Entities;
using Manu.AiAssistant.WebApi.Options;
using Microsoft.Extensions.Options;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;

namespace Manu.AiAssistant.WebApi.Services
{
    public class DalleApiProvider : IDalleProvider
    {
        private readonly HttpClient _httpClient;
        private readonly DalleOptions _options;
        private readonly string _model = "dall-e-3";
        private readonly string _size = "1024x1024";
        private readonly string _style = "vivid";
        private readonly string _quality = "standard";
        private readonly int _n = 1;

        public DalleApiProvider(IHttpClientFactory httpClientFactory, IOptions<DalleOptions> options)
        {
            _httpClient = httpClientFactory.CreateClient("external");
            _options = options.Value;
        }

        public async Task<DalleResult> GenerateImageAsync(Prompt prompt, CancellationToken cancellationToken)
        {
            string fullPrompt = prompt.ImprovedPrompt;

            if (!string.IsNullOrEmpty(prompt.UserImageUrl) && prompt.UserImageAnalysis != null)
            {
                fullPrompt = $@"
                    Generate a new image based on the following analysis. Only modify the main subject by adding a stylish winter hat.
                    Preserve all other scene elements, lighting, color palette, and composition.

                    Image Analysis:
                    {Newtonsoft.Json.JsonConvert.SerializeObject(prompt.UserImageAnalysis, Newtonsoft.Json.Formatting.Indented)}

                    Instructions:
                    {prompt.ImprovedPrompt}";
            }

            var payload = new
            {
                model = _model,
                prompt = fullPrompt,
                size = _size,
                style = _style,
                quality = _quality,
                n = _n > 0 ? _n : 1
            };
            var json = JsonSerializer.Serialize(payload, new JsonSerializerOptions(JsonSerializerDefaults.Web));
            using var httpRequest = new HttpRequestMessage(HttpMethod.Post, _options.Endpoint)
            {
                Content = new StringContent(json, Encoding.UTF8, "application/json")
            };
            httpRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _options.ApiKey);
            using var response = await _httpClient.SendAsync(httpRequest, HttpCompletionOption.ResponseHeadersRead, cancellationToken);
            var responseContent = await response.Content.ReadAsStringAsync(cancellationToken);

            var isError = !response.IsSuccessStatusCode;
            if (!isError && !string.IsNullOrWhiteSpace(responseContent))
            {
                try
                {
                    using var doc = JsonDocument.Parse(responseContent);
                    var root = doc.RootElement;
                    if (root.TryGetProperty("error", out var errorElem))
                    {
                        // If provider wraps error inside success HTTP status, surface it.
                        isError = true;
                        if (errorElem.ValueKind == JsonValueKind.String)
                        {
                            responseContent = errorElem.GetString()!; // simple string message
                        }
                        else
                        {
                            responseContent = errorElem.GetRawText(); // object/array etc.
                        }
                    }
                }
                catch
                {
                    // Ignore JSON parse errors here; keep original content.
                }
            }

            return new DalleResult
            {
                ResponseContent = responseContent,
                DalleRequest = payload,
                IsError = isError
            };
        }
    }
}
