namespace Manu.AiAssistant.WebApi.Options
{
    public class AzureStorageOptions
    {
        // e.g. https://<account>.blob.core.windows.net
        public string AccountUrl { get; set; } = string.Empty;
        public string ContainerName { get; set; } = string.Empty;
    }
}