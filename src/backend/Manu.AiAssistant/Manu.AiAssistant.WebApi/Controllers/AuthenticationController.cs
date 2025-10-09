    using Manu.AiAssistant.WebApi.Models.Authentication;
using Microsoft.AspNetCore.Mvc;
using System.Net.Http;
using System.Threading.Tasks;
using Microsoft.Extensions.Options;
using Manu.AiAssistant.WebApi.Options;
using System.Text.Json;
using Manu.AiAssistant.WebApi.Identity;
using Microsoft.AspNetCore.Identity;
using System;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using Microsoft.Extensions.Logging;

namespace Manu.AiAssistant.WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthenticationController : ControllerBase
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly AzureAdOptions _azureAdOptions;
        private readonly GoogleOptions _googleOptions;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly SignInManager<ApplicationUser> _signInManager;
        private readonly ILogger<AuthenticationController> _logger;

        public AuthenticationController(
            IHttpClientFactory httpClientFactory,
            IOptions<AzureAdOptions> azureAdOptions,
            IOptions<GoogleOptions> googleOptions,
            UserManager<ApplicationUser> userManager,
            SignInManager<ApplicationUser> signInManager,
            ILogger<AuthenticationController> logger)
        {
            _httpClientFactory = httpClientFactory;
            _azureAdOptions = azureAdOptions.Value;
            _googleOptions = googleOptions.Value;
            _userManager = userManager;
            _signInManager = signInManager;
            _logger = logger;
        }

        [HttpPost]
        [Route("Microsoft")]
        public async Task<IActionResult> Microsoft([FromBody] AuthenticationRequest request)
        {
            var clientId = _azureAdOptions.ClientId;
            var clientSecret = _azureAdOptions.ClientSecret; // will not be logged
            var redirectUri = _azureAdOptions.RedirectUri;

            var codeLength = request?.Code?.Length ?? 0;
            var clientIdSuffix = clientId.Length > 6 ? clientId[^6..] : clientId;
            _logger.LogInformation("Starting Microsoft OAuth token exchange. CodeLength={CodeLength} RedirectUri={RedirectUri} ClientIdSuffix={ClientIdSuffix}", codeLength, redirectUri, clientIdSuffix);

            var tokenEndpoint = $"https://login.microsoftonline.com/common/oauth2/v2.0/token";
            var parameters = new[]
            {
                new KeyValuePair<string, string>("client_id", clientId),
                new KeyValuePair<string, string>("scope", "openid profile email offline_access"),
                new KeyValuePair<string, string>("code", request.Code),
                new KeyValuePair<string, string>("redirect_uri", redirectUri),
                new KeyValuePair<string, string>("grant_type", "authorization_code"),
                new KeyValuePair<string, string>("client_secret", clientSecret),
            };

            if (!string.IsNullOrEmpty(request.State))
            {
                _logger.LogDebug("Microsoft OAuth state received length={Len}", request.State.Length);
            }

            return await ExchangeAndSignInAsync(tokenEndpoint, parameters, request, provider:"Microsoft");
        }

        [HttpPost]
        [Route("Google")]
        public async Task<IActionResult> Google([FromBody] AuthenticationRequest request)
        {
            var clientId = _googleOptions.ClientId;
            var clientSecret = _googleOptions.ClientSecret; // do not log
            var redirectUri = _googleOptions.RedirectUri;
            var codeLength = request?.Code?.Length ?? 0;
            var clientIdSuffix = clientId.Length > 6 ? clientId[^6..] : clientId;
            _logger.LogInformation("Starting Google OAuth token exchange. CodeLength={CodeLength} RedirectUri={RedirectUri} ClientIdSuffix={ClientIdSuffix}", codeLength, redirectUri, clientIdSuffix);

            var tokenEndpoint = "https://oauth2.googleapis.com/token";
            var parameters = new[]
            {
                new KeyValuePair<string, string>("client_id", clientId),
                new KeyValuePair<string, string>("client_secret", clientSecret),
                new KeyValuePair<string, string>("code", request.Code),
                new KeyValuePair<string, string>("redirect_uri", redirectUri),
                new KeyValuePair<string, string>("grant_type", "authorization_code"),
            };

            if (!string.IsNullOrEmpty(request.State))
            {
                _logger.LogDebug("Google OAuth state received length={Len}", request.State.Length);
            }

            return await ExchangeAndSignInAsync(tokenEndpoint, parameters, request, provider:"Google");
        }

        private async Task<IActionResult> ExchangeAndSignInAsync(string tokenEndpoint, KeyValuePair<string,string>[] parameters, AuthenticationRequest request, string provider)
        {
            var httpClient = _httpClientFactory.CreateClient();
            var content = new FormUrlEncodedContent(parameters);
            HttpResponseMessage response;
            try
            {
                response = await httpClient.PostAsync(tokenEndpoint, content);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Exception while calling {Provider} token endpoint {Endpoint}", provider, tokenEndpoint);
                return StatusCode(500, "Token endpoint call failed");
            }

            var responseContent = await response.Content.ReadAsStringAsync();
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning(
                    "{Provider} token endpoint returned non-success. Status={StatusCode} BodySnippet={BodySnippet} CodePresent={CodePresent}",
                    provider,
                    (int)response.StatusCode,
                    SafeSnippet(responseContent, 600),
                    !string.IsNullOrWhiteSpace(request.Code));
                return StatusCode((int)response.StatusCode, responseContent);
            }

            JsonDocument json;
            try
            {
                json = JsonDocument.Parse(responseContent);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to parse {Provider} token endpoint JSON response. BodySnippet={BodySnippet}", provider, SafeSnippet(responseContent, 600));
                return StatusCode(502, "Invalid token response");
            }

            string? accessToken = json.RootElement.TryGetProperty("access_token", out var at) ? at.GetString() : null;
            string? refreshToken = json.RootElement.TryGetProperty("refresh_token", out var rt) ? rt.GetString() : null;
            int expiresIn = json.RootElement.TryGetProperty("expires_in", out var ei) ? (ei.ValueKind == JsonValueKind.Number ? ei.GetInt32() : 3600) : 3600;
            var expiresAt = DateTime.UtcNow.AddSeconds(expiresIn);

            string? idToken = json.RootElement.TryGetProperty("id_token", out var idt) ? idt.GetString() : null;
            if (string.IsNullOrWhiteSpace(idToken))
            {
                _logger.LogError("{Provider} token response missing id_token", provider);
                return StatusCode(502, "id_token missing");
            }
            var handler = new JwtSecurityTokenHandler();
            JwtSecurityToken jwtToken;
            try
            {
                jwtToken = handler.ReadJwtToken(idToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to read {Provider} id_token", provider);
                return StatusCode(502, "Invalid id_token");
            }

            // Username/email claim differences between providers
            string userName = jwtToken.Claims.FirstOrDefault(c => c.Type == "preferred_username")?.Value
                              ?? jwtToken.Claims.FirstOrDefault(c => c.Type == "email")?.Value
                              ?? jwtToken.Claims.FirstOrDefault(c => c.Type == "upn")?.Value
                              ?? "unknown";
            if (userName == "unknown")
            {
                _logger.LogWarning("{Provider} id_token did not contain an identifiable username/email claim", provider);
                return StatusCode(502, "User claim missing");
            }

            var user = await _userManager.FindByNameAsync(userName);
            if (user == null)
            {
                user = new ApplicationUser
                {
                    UserName = userName,
                    AccessToken = accessToken ?? string.Empty,
                    RefreshToken = refreshToken ?? string.Empty,
                    ExpiresAt = expiresAt
                };
                var createResult = await _userManager.CreateAsync(user);
                if (!createResult.Succeeded)
                {
                    _logger.LogError("Failed creating user {UserName} via {Provider}. Errors={Errors}", userName, provider, string.Join(";", createResult.Errors.Select(e => e.Code)));
                    return StatusCode(500, "User creation failed");
                }
            }
            else
            {
                user.AccessToken = accessToken ?? string.Empty;
                user.RefreshToken = refreshToken ?? string.Empty;
                user.ExpiresAt = expiresAt;
                var updateResult = await _userManager.UpdateAsync(user);
                if (!updateResult.Succeeded)
                {
                    _logger.LogError("Failed updating user {UserName} via {Provider}. Errors={Errors}", userName, provider, string.Join(";", updateResult.Errors.Select(e => e.Code)));
                    return StatusCode(500, "User update failed");
                }
            }

            await _signInManager.SignInAsync(user, isPersistent: true);
            _logger.LogInformation("{Provider} OAuth sign-in succeeded for {UserName}. ExpiresInSeconds={ExpiresIn}", provider, userName, expiresIn);
            return Ok(new { success = true });
        }

        private static string SafeSnippet(string? value, int max)
        {
            if (string.IsNullOrEmpty(value)) return string.Empty;
            return value.Length <= max ? value : value.Substring(0, max) + "...";
        }
    }
}
