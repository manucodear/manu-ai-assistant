namespace Manu.AIAssist.WebApi.Models.Authentication
{
    public class AuthenticationRequest
    {
        public string Code { get; set; } = string.Empty;
        public string CodeVerifier { get; set; } = string.Empty;
    }
}
