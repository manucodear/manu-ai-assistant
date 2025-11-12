namespace Manu.AiAssistant.WebApi.Models.Chat
{
    public enum PromptRole
    {
        System,
        User,
        File,
        Assistant // Added Assistant role
    }

    public class PromptMessage
    {
        public PromptRole Role { get; set; }
        public string Content { get; set; } = string.Empty;
    }
}