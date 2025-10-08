using System;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using Azure.Storage.Blobs;
using Microsoft.Extensions.Options;
using Manu.AiAssistant.WebApi.Options;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Processing;
using SixLabors.ImageSharp.Formats.Png;

namespace Manu.AiAssistant.WebApi.Services
{
    public class AzureBlobImageStorageProvider : IImageStorageProvider
    {
        private readonly BlobServiceClient _blobServiceClient;
        private readonly AzureStorageOptions _storageOptions;
        private readonly AppOptions _appOptions;

        public AzureBlobImageStorageProvider(
            BlobServiceClient blobServiceClient,
            IOptions<AzureStorageOptions> storageOptions,
            IOptions<AppOptions> appOptions)
        {
            _blobServiceClient = blobServiceClient;
            _storageOptions = storageOptions.Value;
            _appOptions = appOptions.Value;
        }

        public async Task<ImageUploadResult> UploadAndProcessAsync(Stream imageStream, string fileName, CancellationToken cancellationToken)
        {
            var containerClient = _blobServiceClient.GetBlobContainerClient(_storageOptions.ContainerName);
            await containerClient.CreateIfNotExistsAsync(cancellationToken: cancellationToken);

            var baseName = Path.GetFileNameWithoutExtension(fileName);
            var ext = Path.GetExtension(fileName);
            var guid = Guid.NewGuid().ToString();
            var originalBlobName = guid + ext;
            var smallThumbName = guid + ".small.png";
            var mediumThumbName = guid + ".medium.png";

            var blobClient = containerClient.GetBlobClient(originalBlobName);
            var smallThumbClient = containerClient.GetBlobClient(smallThumbName);
            var mediumThumbClient = containerClient.GetBlobClient(mediumThumbName);

            // Upload original
            imageStream.Position = 0;
            await blobClient.UploadAsync(imageStream, overwrite: false, cancellationToken);

            // Generate and upload thumbnails
            imageStream.Position = 0;
            using (var img = await Image.LoadAsync(imageStream, cancellationToken))
            {
                // Small thumb (32x32)
                using (var msSmall = new MemoryStream())
                {
                    img.Clone(ctx => ctx.Resize(new ResizeOptions
                    {
                        Size = new Size(32, 32),
                        Mode = ResizeMode.Max
                    })).Save(msSmall, PngFormat.Instance);
                    msSmall.Position = 0;
                    await smallThumbClient.UploadAsync(msSmall, overwrite: true, cancellationToken);
                }
                // Medium thumb (64x64)
                using (var msMedium = new MemoryStream())
                {
                    img.Clone(ctx => ctx.Resize(new ResizeOptions
                    {
                        Size = new Size(64, 64),
                        Mode = ResizeMode.Max
                    })).Save(msMedium, PngFormat.Instance);
                    msMedium.Position = 0;
                    await mediumThumbClient.UploadAsync(msMedium, overwrite: true, cancellationToken);
                }
            }

            var publicDomain = _appOptions.PublicImageDomain?.TrimEnd('/');
            var controller = "image"; // fallback, can be parameterized
            return new ImageUploadResult
            {
                OriginalUrl = $"{publicDomain}/api/{controller}/{originalBlobName}".ToLower(),
                SmallThumbUrl = $"{publicDomain}/api/{controller}/{smallThumbName}".ToLower(),
                MediumThumbUrl = $"{publicDomain}/api/{controller}/{mediumThumbName}".ToLower()
            };
        }
    }
}
