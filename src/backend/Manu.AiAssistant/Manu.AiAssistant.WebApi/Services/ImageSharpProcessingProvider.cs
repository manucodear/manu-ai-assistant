using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Png;
using SixLabors.ImageSharp.Processing;

namespace Manu.AiAssistant.WebApi.Services
{
    public class ImageSharpProcessingProvider : IImageProcessingProvider
    {
        public async Task<Dictionary<ThumbnailSize, (MemoryStream Stream, string Extension)>> GenerateThumbnailsAsync(Stream originalImageStream, IEnumerable<ThumbnailSize> sizes, CancellationToken cancellationToken)
        {
            var distinctSizes = sizes.Distinct().ToList();
            originalImageStream.Position = 0;
            using var image = await Image.LoadAsync(originalImageStream, cancellationToken);
            var dict = new Dictionary<ThumbnailSize, (MemoryStream, string)>();
            foreach (var size in distinctSizes)
            {
                var (w, h) = size.ToDimensions();
                var ms = new MemoryStream();
                image.Clone(ctx => ctx.Resize(new ResizeOptions
                {
                    Size = new Size(w, h),
                    Mode = ResizeMode.Max
                })).Save(ms, PngFormat.Instance);
                ms.Position = 0;
                dict[size] = (ms, size.ToFileSuffix());
            }
            return dict;
        }
    }
}
