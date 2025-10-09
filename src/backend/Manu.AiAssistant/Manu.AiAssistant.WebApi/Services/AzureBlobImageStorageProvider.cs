using System;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using Azure.Storage.Blobs;
using Microsoft.Extensions.Options;
using Manu.AiAssistant.WebApi.Options;

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

        public async Task<string> UploadImageAsync(Stream imageStream, string fileName, CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(fileName)) throw new ArgumentException("fileName required", nameof(fileName));
            var containerClient = _blobServiceClient.GetBlobContainerClient(_storageOptions.ContainerName);
            await containerClient.CreateIfNotExistsAsync(cancellationToken: cancellationToken);

            // Ensure extension
            var ext = Path.GetExtension(fileName);
            if (string.IsNullOrWhiteSpace(ext)) fileName += ".png"; // default png extension

            var blobClient = containerClient.GetBlobClient(fileName);
            imageStream.Position = 0;
            await blobClient.UploadAsync(imageStream, overwrite: true, cancellationToken);
            return $"{_appOptions.ImagePath.TrimEnd('/')}/{fileName}".ToLower();
        }
    }
}
