namespace Manu.AiAssistant.WebApi.Options
{
    public class DalleOptions
    {
        public string Endpoint { get; set; } = string.Empty; // Base URL of the DALL-E deployment
        public string ApiKey { get; set; } = string.Empty; // API key/ token
    }
}
