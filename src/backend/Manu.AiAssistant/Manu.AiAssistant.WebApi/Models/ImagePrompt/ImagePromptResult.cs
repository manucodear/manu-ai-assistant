namespace Manu.AiAssistant.WebApi.Models.ImagePrompt
{
    public class ImagePromptResult
    {
        public string OriginalPrompt { get; set; } = string.Empty;
        public string ImprovedPrompt { get; set; } = string.Empty;
        public string MainDifferences { get; set; } = string.Empty;
        public ImagePromptTags Tags { get; set; } = new();
        public List<string> PointOfViews { get; set; } = new();
        public string PointOfView { get; set; } = string.Empty;
    }

    public class ImagePromptTags
    {
        public List<string> Included { get; set; } = new();
        public List<string> NotIncluded { get; set; } = new();
    }
}
