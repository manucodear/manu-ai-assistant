using System.Collections.Generic;
using Manu.AiAssistant.WebApi.Models.Chat;

namespace Manu.AiAssistant.WebApi.Options
{
    public class PromptSettingsOptions
    {
        public ImagePromptOptions Image { get; set; } = new();
        public string RevisionPrompt { get; set; } = string.Empty;
        public List<PromptMessage> ImageAnalysis { get; set; } = new();
        public List<PromptMessage> ImageGeneration { get; set; } = new();
    }

    public class ImagePromptOptions
    {
        public List<PromptMessage> Short { get; set; } = new();
        public List<PromptMessage> Long { get; set; } = new();
    }
}
