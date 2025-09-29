namespace Manu.AiAssistant.WebApi.Options
{
    public class CosmosDbOptions
    {
        public string AccountEndpoint { get; set; }
        public string AccountKey { get; set; }
        public string DatabaseName { get; set; }
        public string ContainerName { get; set; }
        public string ContainerPrefix { get; set; }
        public string EventContainerName { get; set; }
        public string IsRateLimited { get; set; }
        public int MaxItemsToReturn { get; set; }
        public int RequestTimeout { get; set; }
    }
}
