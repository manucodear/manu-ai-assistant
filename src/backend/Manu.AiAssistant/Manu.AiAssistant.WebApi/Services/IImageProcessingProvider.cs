using System.Collections.Generic;
using System.IO;
using System.Threading;
using System.Threading.Tasks;

namespace Manu.AiAssistant.WebApi.Services
{
    public interface IImageProcessingProvider
    {
        /// <summary>
        /// Generates resized PNG thumbnail streams keyed by size.
        /// Each entry returns the MemoryStream and the file suffix (extension) to be used when saving.
        /// Streams are positioned at 0 and must be disposed by caller.
        /// </summary>
        Task<Dictionary<ThumbnailSize, (MemoryStream Stream, string Extension)>> GenerateThumbnailsAsync(Stream originalImageStream, IEnumerable<ThumbnailSize> sizes, CancellationToken cancellationToken);
    }
}
