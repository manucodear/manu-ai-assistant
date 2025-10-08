using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Manu.AiAssistant.WebApi.Options
{
    public class CosmosDbOptions
    {
        public string AccountEndpoint { get; set; } = string.Empty;
        public string AccountKey { get; set; } = string.Empty;
        public string DatabaseName { get; set; } = string.Empty;
        public string ContainerName { get; set; } = string.Empty;
    }
}
