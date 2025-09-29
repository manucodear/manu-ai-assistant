using Microsoft.AspNetCore.Identity;
using System;

namespace Manu.AiAssistant.WebApi.Identity
{
    public class ApplicationUser : IdentityUser
    {
        public string AccessToken { get; set; }
        public string RefreshToken { get; set; }
        public DateTime? ExpiresAt { get; set; }
        public string ETag { get; set; } // For Cosmos DB concurrency
    }
}