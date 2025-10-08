using System;
using Newtonsoft.Json;

namespace Manu.AiAssistant.WebApi.Models.Entities
{
    public abstract class CosmosEntityBase : ICosmosEntity
    {
        [JsonProperty("id")]
        public string Id { get; set; } = Guid.NewGuid().ToString();
    }
}
