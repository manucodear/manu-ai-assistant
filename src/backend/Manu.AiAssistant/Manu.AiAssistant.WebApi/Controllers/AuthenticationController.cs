using Manu.AiAssistant.WebApi.Models.Authentication;
using Microsoft.AspNetCore.Mvc;
using System.Net.Http;
using System.Threading.Tasks;
using Microsoft.Extensions.Options;
using Manu.AiAssistant.WebApi.Options;
using System.Text.Json;
using System.Text;
using Manu.AiAssistant.WebApi.Identity;
using Microsoft.AspNetCore.Identity;
using System;

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

        public AuthenticationController(
            IHttpClientFactory httpClientFactory,
            IOptions<AzureAdOptions> azureAdOptions,
            UserManager<ApplicationUser> userManager,
            SignInManager<ApplicationUser> signInManager)
        {
            _httpClientFactory = httpClientFactory;
            _azureAdOptions = azureAdOptions.Value;
            _userManager = userManager;
            _signInManager = signInManager;
        }

        [HttpPost]
        [Route("Microsoft")]
        public async Task<IActionResult> Microsoft([FromBody] AuthenticationRequest request)
        {
            var clientId = _azureAdOptions.ClientId;
            var tenantId = _azureAdOptions.TenantId;
            var clientSecret = _azureAdOptions.ClientSecret;
            var redirectUri = _azureAdOptions.RedirectUri;

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
            var response = await httpClient.PostAsync(tokenEndpoint, content);
            var responseContent = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                return StatusCode((int)response.StatusCode, responseContent);
            }

            var json = JsonDocument.Parse(responseContent);
            var accessToken = json.RootElement.GetProperty("access_token").GetString();
            var refreshToken = json.RootElement.GetProperty("refresh_token").GetString();
            var expiresIn = json.RootElement.GetProperty("expires_in").GetInt32();
            var expiresAt = DateTime.UtcNow.AddSeconds(expiresIn);

            // For demo: use sub or email from id_token or user info as username
            var userName = "microsoft-user"; // TODO: parse from id_token or userinfo
            var user = await _userManager.FindByNameAsync(userName);
            if (user == null)
            {
                user = new ApplicationUser { UserName = userName };
                await _userManager.CreateAsync(user);
            }
            user.AccessToken = accessToken;
            user.RefreshToken = refreshToken;
            user.ExpiresAt = expiresAt;
            await _userManager.UpdateAsync(user);

            await _signInManager.SignInAsync(user, isPersistent: true);

            return Ok(new { success = true });
        }
    }
}
