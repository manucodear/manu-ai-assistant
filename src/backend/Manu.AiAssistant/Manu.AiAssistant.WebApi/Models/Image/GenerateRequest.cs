using Manu.AiAssistant.WebApi.Models.ImagePrompt;

namespace Manu.AiAssistant.WebApi.Models.Image
{
    public class GenerateRequest
    {
        public List<ImageData> ImageDataList { get; set; } = new();
        // Added properties for DALL-E payload
        public string Model { get; set; } = "dall-e-3";
        public string Size { get; set; } = "1024x1024";
        public string Style { get; set; } = "vivid";
        public string Quality { get; set; } = "standard";
        public int N { get; set; } = 1;
        public ImagePromptResult ImagePrompt { get; set; } = new();
    }
}
