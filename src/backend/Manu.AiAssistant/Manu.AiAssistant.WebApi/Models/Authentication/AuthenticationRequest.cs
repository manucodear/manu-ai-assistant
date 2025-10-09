namespace Manu.AiAssistant.WebApi.Models.Authentication
{
    public class AuthenticationRequest
    {
        public string Code { get; set; } = string.Empty;
        public string State { get; set; } = string.Empty; // OAuth state returned from provider
    }
}
