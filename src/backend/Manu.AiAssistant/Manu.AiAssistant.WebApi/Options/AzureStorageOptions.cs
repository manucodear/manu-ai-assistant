namespace Manu.AiAssistant.WebApi.Options
{
    public class AzureStorageOptions
    {
        // e.g. https://<account>.blob.core.windows.net
        public string AccountUrl { get; set; } = string.Empty;
        public ContainersOptions Containers { get; set; } = new ContainersOptions();
    }

    public class ContainersOptions
    {
        public string Image { get; set; } = string.Empty;
        public string UserImage { get; set; } = string.Empty;
    }
}