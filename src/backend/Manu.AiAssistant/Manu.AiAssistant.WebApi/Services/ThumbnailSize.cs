namespace Manu.AiAssistant.WebApi.Services
{
    public enum ThumbnailSize
    {
        Small,  // 64x64 -> .small.png
        Medium, // 128x128 -> .medium.png
        Large   // 256x256 -> .large.png
    }

    public static class ThumbnailSizeExtensions
    {
        public static string ToFileSuffix(this ThumbnailSize size) => size switch
        {
            ThumbnailSize.Small => ".small.png",
            ThumbnailSize.Medium => ".medium.png",
            ThumbnailSize.Large => ".large.png",
            _ => ".small.png"
        };

        public static (int Width, int Height) ToDimensions(this ThumbnailSize size) => size switch
        {
            ThumbnailSize.Small => (64, 64),
            ThumbnailSize.Medium => (128, 128),
            ThumbnailSize.Large => (256, 256),
            _ => (64, 64)
        };
    }
}
