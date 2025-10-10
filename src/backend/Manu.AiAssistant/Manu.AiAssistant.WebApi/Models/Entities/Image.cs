using System;
using System.Collections.Generic;
using Newtonsoft.Json;

namespace Manu.AiAssistant.WebApi.Models.Entities
{
    public class Image : CosmosEntityBase
    {
        [JsonProperty("username")]
        public string Username { get; set; } = string.Empty;

        [JsonProperty("prompt")]
        public string Prompt { get; set; } = string.Empty;

        [JsonProperty("timestamp")]
        public DateTime Timestamp { get; set; }

        [JsonProperty("dalleRequest")]
        public object DalleRequest { get; set; } = new();

        // Will store either a raw JSON string or an object containing { raw, extra }
        [JsonProperty("dalleResponse")]
        public object DalleResponse { get; set; } = new();

        [JsonProperty("hasError")]
        public bool HasError { get; set; }

        [JsonProperty("imageData")]
        public ImageData ImageData { get; set; } = new();
    }

    public class ImageData
    {
        [JsonProperty("url")]
        public string Url { get; set; } = string.Empty;

        [JsonProperty("smallUrl")]
        public string SmallUrl { get; set; } = string.Empty;

        [JsonProperty("mediumUrl")]
        public string MediumUrl { get; set; } = string.Empty;

        [JsonProperty("largeUrl")]
        public string LargeUrl { get; set; } = string.Empty;
    }
}
