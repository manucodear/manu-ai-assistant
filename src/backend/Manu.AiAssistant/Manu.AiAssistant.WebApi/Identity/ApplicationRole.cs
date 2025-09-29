using Microsoft.AspNetCore.Identity;

namespace Manu.AiAssistant.WebApi.Identity
{
    public class ApplicationRole : IdentityRole
    {
        public string ETag { get; set; }
    }
}