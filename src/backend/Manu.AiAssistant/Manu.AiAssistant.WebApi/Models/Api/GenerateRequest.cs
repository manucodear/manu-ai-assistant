namespace Manu.AiAssistant.WebApi.Models.Api
{
    public class GenerateRequest
    {
        // Added properties for DALL-E payload
        public string Model { get; set; } = "dall-e-3";
        public string Size { get; set; } = "1024x1024";
        public string Style { get; set; } = "vivid";
        public string Quality { get; set; } = "standard";
        public int N { get; set; } = 1;
        public string ImagePromptId { get; set; } = string.Empty;
    }
}
