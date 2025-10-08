using System;
using System.Collections.Generic;

namespace Manu.AiAssistant.WebApi.Models.Entities
{
    public class ImageGeneration : CosmosEntityBase
    {
        public string Username { get; set; } = string.Empty;
        public DateTime TimestampUtc { get; set; }
        public object DalleRequest { get; set; } = new();
        public object DalleResponse { get; set; } = new();
        public bool Error { get; set; }
        public List<string> ImageUrls { get; set; } = new();
    }
}
