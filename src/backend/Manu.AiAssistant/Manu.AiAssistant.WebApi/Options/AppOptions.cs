namespace Manu.AiAssistant.WebApi.Options
{
    public class AppOptions
    {
        public string PublicImageDomain { get; set; } = string.Empty; // legacy external URL (api gateway)
        public string ImagePath { get; set; } = string.Empty;         // e.g. https://domain/api/images (no trailing slash)
    }
}