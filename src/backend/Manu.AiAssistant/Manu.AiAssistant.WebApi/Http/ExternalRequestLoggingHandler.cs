using System.Diagnostics;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Logging;

namespace Manu.AiAssistant.WebApi.Http
{
    // Delegating handler that logs outgoing HTTP requests and responses.
    // On failure, logs request/response headers and body snippets with sensitive data masked.
    public class ExternalRequestLoggingHandler : DelegatingHandler
    {
        private readonly ILogger<ExternalRequestLoggingHandler> _logger;

        public ExternalRequestLoggingHandler(ILogger<ExternalRequestLoggingHandler> logger)
        {
            _logger = logger;
        }

        protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            var sw = Stopwatch.StartNew();

            // Capture request details
            var requestBody = await ReadContentAsync(request.Content, cancellationToken);
            var requestHeaders = CollectHeaders(request.Headers, request.Content?.Headers);
            MaskSensitive(requestHeaders);

            HttpResponseMessage response = await base.SendAsync(request, cancellationToken);
            sw.Stop();

            // Capture response details
            var responseBody = await ReadContentAsync(response.Content, cancellationToken);
            var responseHeaders = CollectHeaders(response.Headers, response.Content?.Headers);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError(
                    "External HTTP call failed. {Method} {Url} -> {StatusCode} in {ElapsedMs}ms | RequestHeaders={RequestHeaders} | ResponseHeaders={ResponseHeaders} | RequestBody={RequestBody} | ResponseBody={ResponseBody}",
                    request.Method,
                    request.RequestUri,
                    (int)response.StatusCode,
                    sw.ElapsedMilliseconds,
                    requestHeaders,
                    responseHeaders,
                    SafeSnippet(requestBody, 2000),
                    SafeSnippet(responseBody, 2000)
                );
            }
            else
            {
                _logger.LogDebug(
                    "External HTTP call succeeded. {Method} {Url} -> {StatusCode} in {ElapsedMs}ms",
                    request.Method,
                    request.RequestUri,
                    (int)response.StatusCode,
                    sw.ElapsedMilliseconds
                );
            }

            return response;
        }

        private static async Task<string> ReadContentAsync(HttpContent? content, CancellationToken ct)
        {
            if (content == null) return string.Empty;
            try
            {
                // Buffer content to string safely
                return await content.ReadAsStringAsync(ct);
            }
            catch
            {
                return string.Empty;
            }
        }

        private static Dictionary<string, string> CollectHeaders(params System.Net.Http.Headers.HttpHeaders?[] headersSets)
        {
            var dict = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
            foreach (var headers in headersSets)
            {
                if (headers == null) continue;
                foreach (var h in headers)
                {
                    var value = string.Join(",", h.Value ?? Array.Empty<string>());
                    dict[h.Key] = value;
                }
            }
            return dict;
        }

        private static void MaskSensitive(Dictionary<string, string> headers)
        {
            // Mask Authorization and any Bearer tokens
            if (headers.TryGetValue("Authorization", out var auth))
            {
                headers["Authorization"] = MaskToken(auth);
            }
            // Common Azure keys if ever present as headers
            if (headers.TryGetValue("api-key", out var apiKey))
            {
                headers["api-key"] = MaskToken(apiKey);
            }
        }

        private static string MaskToken(string value)
        {
            if (string.IsNullOrEmpty(value)) return value;
            // Keep header scheme if present
            var parts = value.Split(' ', 2, StringSplitOptions.RemoveEmptyEntries);
            if (parts.Length == 2)
            {
                return parts[0] + " " + Mask(parts[1]);
            }
            return Mask(value);
        }

        private static string Mask(string token)
        {
            if (string.IsNullOrEmpty(token)) return string.Empty;
            var visible = Math.Min(4, token.Length);
            return new string('*', Math.Max(0, token.Length - visible)) + token[^visible..];
        }

        private static string SafeSnippet(string content, int max)
        {
            if (string.IsNullOrEmpty(content)) return string.Empty;
            return content.Length <= max ? content : content.Substring(0, max) + "...";
        }
    }
}
