namespace Manu.AiAssistant.WebApi.Models.Image
{
    public static class DalleImageSizeExtensions
    {
        public static string ToApiString(this DalleImageSize size)
        {
            return size switch
            {
                DalleImageSize.Size256x256 => "256x256",
                DalleImageSize.Size512x512 => "512x512",
                DalleImageSize.Size1024x1024 => "1024x1024",
                DalleImageSize.Size1792x1024 => "1792x1024",
                DalleImageSize.Size1024x1792 => "1024x1792",
                _ => "1024x1024"
            };
        }
    }
}