namespace Manu.AiAssistant.WebApi.Models.Api
{
    public class ImagePromptResponse
    {
        public string Id { get; set; } = string.Empty;
        public string OriginalPrompt { get; set; } = string.Empty;
        public string ImprovedPrompt { get; set; } = string.Empty;
        public string MainDifferences { get; set; } = string.Empty;
        public ImagePromptTags Tags { get; set; } = new();
        public List<string> PointOfViews { get; set; } = new();
        public string PointOfView { get; set; } = string.Empty;
        public List<string> ImageStyles { get; set; } = new();
        public string ImageStyle { get; set; } = string.Empty;
        public string? ConversationId { get; set; }
        public string? ImageId { get; set; }
    }

    public class ImagePromptTags
    {
        public List<string> Included { get; set; } = new();
        public List<string> NotIncluded { get; set; } = new();
    }
}
