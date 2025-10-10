using System.Collections.Generic;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Manu.AiAssistant.WebApi.Options
{
    public class CosmosDbOptions
    {
        public string AccountEndpoint { get; set; } = string.Empty;
        public string AccountKey { get; set; } = string.Empty;
        public string DatabaseName { get; set; } = string.Empty;
        public string IdentityDatabaseName { get; set; } = string.Empty;
        public Dictionary<string, string> Containers { get; set; } = new();
    }
}
