namespace Manu.AiAssistant.WebApi.Models.Chat
{
    public enum PromptRole
    {
        System,
        User,
        Assistant // Added Assistant role
    }

    public class PromptMessage
    {
        public PromptRole Role { get; set; }
        public string Prompt { get; set; } = string.Empty;
    }
}