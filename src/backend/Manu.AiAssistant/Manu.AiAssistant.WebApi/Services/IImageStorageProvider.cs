using System.IO;
using System.Threading;
using System.Threading.Tasks;

namespace Manu.AiAssistant.WebApi.Services
{
    public interface IImageStorageProvider
    {
        /// <summary>
        /// Uploads a single image stream under the provided file name and returns the public URL.
        /// </summary>
        Task<string> UploadImageAsync(Stream imageStream, string fileName, CancellationToken cancellationToken);
    }
}
