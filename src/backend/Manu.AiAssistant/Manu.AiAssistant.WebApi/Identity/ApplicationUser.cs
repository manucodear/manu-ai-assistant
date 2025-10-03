using Microsoft.AspNetCore.Identity;
using System;

namespace Manu.AiAssistant.WebApi.Identity
{
    public class ApplicationUser : IdentityUser
    {
        public string AccessToken { get; set; } = string.Empty;
        public string RefreshToken { get; set; } = string.Empty;
        public DateTime? ExpiresAt { get; set; }
    }
}