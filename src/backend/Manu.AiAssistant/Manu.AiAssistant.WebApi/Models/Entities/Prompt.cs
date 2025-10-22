using Newtonsoft.Json;

namespace Manu.AiAssistant.WebApi.Models.Entities
{
    public class Prompt : CosmosEntityBase
    {
        [JsonProperty("username")]
        public string Username { get; set; } = string.Empty;

        [JsonProperty("originalPrompt")]
        public string OriginalPrompt { get; set; } = string.Empty;

        [JsonProperty("improvedPrompt")]
        public string ImprovedPrompt{ get; set; } = string.Empty;

        [JsonProperty("mainDifferences")]
        public string MainDifferences { get; set; } = string.Empty;

        [JsonProperty("tags")]
        public Tag Tags { get; set; } = new();

        [JsonProperty("pointOfView")]
        public string PointOfView { get; set; } = string.Empty;

        [JsonProperty("pointOfViews")]
        public List<string> PointOfViews { get; set; } = new();

        [JsonProperty("imageStyle")]
        public string ImageStyle { get; set; } = string.Empty;

        [JsonProperty("imageStyles")]
        public List<string> ImageStyles { get; set; } = new();

        [JsonProperty("conversationId")]
        public string ConversationId { get; set; } = string.Empty;
    }

    public class Tag
    {
        [JsonProperty("included")]
        public List<string> Included { get; set; } = new();

        [JsonProperty("notIncluded")]
        public List<string> NotIncluded { get; set; } = new();
    }
}
