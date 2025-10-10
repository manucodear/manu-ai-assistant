using System;
using Newtonsoft.Json;
using Manu.AiAssistant.WebApi.Models.Entities;

namespace Manu.AiAssistant.WebApi.Models.Entities
{
    public class Chat : CosmosEntityBase
    {
        [JsonProperty("username")]
        public string Username { get; set; } = string.Empty;

        [JsonProperty("timestampUtc")]
        public DateTime TimestampUtc { get; set; }

        [JsonProperty("chatRequest")]
        public object ChatRequest { get; set; } = new();

        [JsonProperty("chatResponse")]
        public object ChatResponse { get; set; } = new();

        [JsonProperty("error")]
        public bool Error { get; set; }
    }
}