using System.Collections.Generic;

namespace Manu.AiAssistant.WebApi.Models.Chat
{
    public class PromptRevisionRequest
    {
        public string Prompt { get; set; } = string.Empty;
        public RevisionTags Tags { get; set; } = new();
        public string? PointOfView { get; set; }
    }

    public class RevisionTags
    {
        public List<string> ToInclude { get; set; } = new();
        public List<string> ToExclude { get; set; } = new();
    }
}
