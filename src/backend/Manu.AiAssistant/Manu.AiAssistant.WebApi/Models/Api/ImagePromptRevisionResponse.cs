using System.Collections.Generic;

namespace Manu.AiAssistant.WebApi.Models.Api
{
    public class ImagePromptRevisionResponse
    {
        public string RevisedPrompt { get; set; } = string.Empty;
        public SummaryOfChangesResponse SummaryOfChanges { get; set; } = new SummaryOfChangesResponse();
    }

    public class SummaryOfChangesResponse
    {
        public string PointOfViewAdjustment { get; set; } = string.Empty;
        public string Clarity { get; set; } = string.Empty;
        public string GrammarAndStyle { get; set; } = string.Empty;
        public string ConceptsAdded { get; set; } = string.Empty;
        public string ConceptsRemoved { get; set; } = string.Empty;
    }
}
