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
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly SignInManager<ApplicationUser> _signInManager;
        private readonly ILogger<AuthenticationController> _logger;

        public AuthenticationController(
            IHttpClientFactory httpClientFactory,
            IOptions<AzureAdOptions> azureAdOptions,
            UserManager<ApplicationUser> userManager,
            SignInManager<ApplicationUser> signInManager,
            ILogger<AuthenticationController> logger)
        {
            _httpClientFactory = httpClientFactory;
            _azureAdOptions = azureAdOptions.Value;
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

            var httpClient = _httpClientFactory.CreateClient();
            var content = new FormUrlEncodedContent(parameters);

            HttpResponseMessage response;
            try
            {
                response = await httpClient.PostAsync(tokenEndpoint, content);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Exception while calling Microsoft token endpoint {Endpoint}", tokenEndpoint);
                return StatusCode(500, "Token endpoint call failed");
            }

            var responseContent = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning(
                    "Microsoft token endpoint returned non-success. Status={StatusCode} BodySnippet={BodySnippet} CodePresent={CodePresent} RedirectUri={RedirectUri} ClientIdSuffix={ClientIdSuffix}",
                    (int)response.StatusCode,
                    SafeSnippet(responseContent, 600),
                    !string.IsNullOrWhiteSpace(request.Code),
                    redirectUri,
                    clientIdSuffix);
                return StatusCode((int)response.StatusCode, responseContent);
            }

            JsonDocument json;
            try
            {
                json = JsonDocument.Parse(responseContent);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to parse token endpoint JSON response. BodySnippet={BodySnippet}", SafeSnippet(responseContent, 600));
                return StatusCode(502, "Invalid token response");
            }

            var accessToken = json.RootElement.GetProperty("access_token").GetString();
            var refreshToken = json.RootElement.GetProperty("refresh_token").GetString();
            var expiresIn = json.RootElement.GetProperty("expires_in").GetInt32();
            var expiresAt = DateTime.UtcNow.AddSeconds(expiresIn);

            // Extract username from id_token
            var idToken = json.RootElement.GetProperty("id_token").GetString();
            var handler = new JwtSecurityTokenHandler();
            var jwtToken = handler.ReadJwtToken(idToken);
            var userName = jwtToken.Claims.First(c => c.Type == "preferred_username").Value;

            var user = await _userManager.FindByNameAsync(userName);
            if (user == null)
            {
                user = new ApplicationUser
                {
                    UserName = userName,
                    AccessToken = accessToken!,
                    RefreshToken = refreshToken!,
                    ExpiresAt = expiresAt
                };
                var createResult = await _userManager.CreateAsync(user);
                if (!createResult.Succeeded)
                {
                    _logger.LogError("Failed creating user {UserName}. Errors={Errors}", userName, string.Join(";", createResult.Errors.Select(e => e.Code)));
                    return StatusCode(500, "User creation failed");
                }
            }
            else
            {
                user.AccessToken = accessToken!;
                user.RefreshToken = refreshToken!;
                user.ExpiresAt = expiresAt;
                var updateResult = await _userManager.UpdateAsync(user);
                if (!updateResult.Succeeded)
                {
                    _logger.LogError("Failed updating user {UserName}. Errors={Errors}", userName, string.Join(";", updateResult.Errors.Select(e => e.Code)));
                    return StatusCode(500, "User update failed");
                }
            }

            await _signInManager.SignInAsync(user, isPersistent: true);

            _logger.LogInformation("Microsoft OAuth sign-in succeeded for {UserName}. ExpiresInSeconds={ExpiresIn}", userName, expiresIn);

            return Ok(new { success = true });
        }

        private static string SafeSnippet(string? value, int max)
        {
            if (string.IsNullOrEmpty(value)) return string.Empty;
            return value.Length <= max ? value : value.Substring(0, max) + "...";
        }
    }
}
