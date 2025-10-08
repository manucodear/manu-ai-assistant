using System.IO;
using System.Threading;
using System.Threading.Tasks;

namespace Manu.AiAssistant.WebApi.Services
{
    public class ImageUploadResult
    {
        public string OriginalUrl { get; set; }
        public string SmallThumbUrl { get; set; }
        public string MediumThumbUrl { get; set; }
    }

    public interface IImageStorageProvider
    {
        Task<ImageUploadResult> UploadAndProcessAsync(Stream imageStream, string fileName, CancellationToken cancellationToken);
    }
}
