using System.Collections.Generic;

namespace Manu.AiAssistant.WebApi.Models.ImagePrompt
{
    public class PromptRevisionResult
    {
        public string RevisedPrompt { get; set; } = string.Empty;
        public SummaryOfChanges SummaryOfChanges { get; set; } = new SummaryOfChanges();
    }

    public class SummaryOfChanges
    {
        public string PointOfViewAdjustment { get; set; } = string.Empty;
        public string Clarity { get; set; } = string.Empty;
        public string GrammarAndStyle { get; set; } = string.Empty;
        public string ConceptsAdded { get; set; } = string.Empty;
        public string ConceptsRemoved { get; set; } = string.Empty;
    }
}
