using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Microsoft.Extensions.Options;
using Manu.AiAssistant.WebApi.Options;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Identity;
using Manu.AiAssistant.WebApi.Identity;

namespace Manu.AiAssistant.WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class TokenController : ControllerBase
    {
        private readonly IHostEnvironment _env;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IConfiguration _configuration;
        private readonly AzureAdOptions _azureAdOptions;

        public TokenController(
            IHostEnvironment env,
            UserManager<ApplicationUser> userManager,
            IConfiguration configuration,
            IOptions<AzureAdOptions> azureAdOptions)
        {
            _env = env;
            _userManager = userManager;
            _configuration = configuration;
            _azureAdOptions = azureAdOptions.Value;
        }

        [HttpGet]
        public async Task<IActionResult> Get()
        {
            if (!_env.IsDevelopment())
                return NotFound();

            var userName = User?.Identity?.Name;
            if (string.IsNullOrEmpty(userName))
                return Unauthorized();

            var user = await _userManager.FindByNameAsync(userName);
            if (user == null)
                return NotFound();

            // Generate JWT
            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id),
                new Claim(JwtRegisteredClaimNames.UniqueName, user.UserName ?? ""),
                new Claim(ClaimTypes.Name, user.UserName ?? "")
            };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["App:JwtKey"]));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            // Use AzureAdOptions for issuer and audience
            var issuer = $"https://login.microsoftonline.com/{_azureAdOptions.TenantId}/v2.0";
            var audience = _azureAdOptions.ClientId;

            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                expires: DateTime.UtcNow.AddHours(1),
                signingCredentials: creds);

            var jwt = new JwtSecurityTokenHandler().WriteToken(token);

            return Ok(new { token = jwt });
        }
    }
}
