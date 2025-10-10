using System;
using System.Collections.Generic;
using Newtonsoft.Json;

namespace Manu.AiAssistant.WebApi.Models.Entities
{
    public class Image : CosmosEntityBase
    {
        [JsonProperty("username")]
        public string Username { get; set; } = string.Empty;

        [JsonProperty("timestampUtc")]
        public DateTime TimestampUtc { get; set; }

        [JsonProperty("dalleRequest")]
        public object DalleRequest { get; set; } = new();

        // Will store either a raw JSON string or an object containing { raw, extra }
        [JsonProperty("dalleResponse")]
        public object DalleResponse { get; set; } = new();

        [JsonProperty("error")]
        public bool Error { get; set; }
    }
}
