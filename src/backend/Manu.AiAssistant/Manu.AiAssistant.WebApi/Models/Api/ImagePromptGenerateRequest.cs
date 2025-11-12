namespace Manu.AiAssistant.WebApi.Models.Api
{
    public class ImagePromptGenerateRequest
    {
        public string Prompt { get; set; } = string.Empty;
        public string? ConversationId { get; set; }
        public string? UserImageUrl { get; set; }
    }
}