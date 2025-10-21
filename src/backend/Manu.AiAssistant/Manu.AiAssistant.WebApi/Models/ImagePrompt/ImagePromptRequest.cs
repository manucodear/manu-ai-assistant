namespace Manu.AiAssistant.WebApi.Models.ImagePrompt
{
    public class ImagePromptRequest
    {
        public string Prompt { get; set; } = string.Empty;
        public string ConversationId { get; set; } = string.Empty;
    }
}