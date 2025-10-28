namespace Manu.AiAssistant.WebApi.Models.Api
{
    public class ImageResponse
    {
        public string Id { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; }
        public ImageDataResponse ImageData { get; set; } = new();
        public ImagePromptResponse ImagePrompt { get; set; } = new();

    }
}
