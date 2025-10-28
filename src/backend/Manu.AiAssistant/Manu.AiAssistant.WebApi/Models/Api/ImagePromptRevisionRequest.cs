using System.Collections.Generic;

namespace Manu.AiAssistant.WebApi.Models.Api
{
    public class ImagePromptRevisionRequest
    {
        public string Prompt { get; set; } = string.Empty;
        public RevisionTagsRequest Tags { get; set; } = new();
        public string? PointOfView { get; set; }
        public string? ImageStyle { get; set; }
    }

    public class RevisionTagsRequest
    {
        public List<string> ToInclude { get; set; } = new();
        public List<string> ToExclude { get; set; } = new();
    }
}
