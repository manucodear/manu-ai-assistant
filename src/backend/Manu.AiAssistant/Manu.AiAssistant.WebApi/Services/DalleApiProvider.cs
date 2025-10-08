using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Options;
using Manu.AiAssistant.WebApi.Options;
using Manu.AiAssistant.WebApi.Models.Image;

namespace Manu.AiAssistant.WebApi.Services
{
    public class DalleApiProvider : IDalleProvider
    {
        private readonly HttpClient _httpClient;
        private readonly DalleOptions _options;

        public DalleApiProvider(IHttpClientFactory httpClientFactory, IOptions<DalleOptions> options)
        {
            _httpClient = httpClientFactory.CreateClient("external");
            _options = options.Value;
        }

        public async Task<DalleResult> GenerateImageAsync(GenerateRequest request, CancellationToken cancellationToken)
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
            var json = JsonSerializer.Serialize(payload, new JsonSerializerOptions(JsonSerializerDefaults.Web));
            using var httpRequest = new HttpRequestMessage(HttpMethod.Post, _options.Endpoint)
            {
                Content = new StringContent(json, Encoding.UTF8, "application/json")
            };
            httpRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _options.ApiKey);
            using var response = await _httpClient.SendAsync(httpRequest, HttpCompletionOption.ResponseHeadersRead, cancellationToken);
            var responseContent = await response.Content.ReadAsStringAsync(cancellationToken);
            return new DalleResult
            {
                ResponseContent = responseContent,
                IsError = !response.IsSuccessStatusCode
            };
        }
    }
}
