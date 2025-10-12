using System;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using System.Collections.Generic;
using Azure.Storage.Blobs;
using Microsoft.Extensions.Options;
using Manu.AiAssistant.WebApi.Options;

namespace Manu.AiAssistant.WebApi.Services
{
    public class UserImageBlobStorageProvider : IImageStorageProvider
    {
        private readonly BlobServiceClient _blobServiceClient;
        private readonly AzureStorageOptions _storageOptions;
        private readonly AppOptions _appOptions;

        public UserImageBlobStorageProvider(
            BlobServiceClient blobServiceClient,
            IOptions<AzureStorageOptions> storageOptions,
            IOptions<AppOptions> appOptions)
        {
            _blobServiceClient = blobServiceClient;
            _storageOptions = storageOptions.Value;
            _appOptions = appOptions.Value;
        }

        public BlobContainerClient GetContainerClient()
        {
            return _blobServiceClient.GetBlobContainerClient(_storageOptions.Containers.UserImage);
        }

        public async Task<string> UploadImageAsync(Stream imageStream, string fileName, CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(fileName)) throw new ArgumentException("fileName required", nameof(fileName));
            var containerClient = GetContainerClient();
            await containerClient.CreateIfNotExistsAsync(cancellationToken: cancellationToken);

            var ext = Path.GetExtension(fileName);
            if (string.IsNullOrWhiteSpace(ext)) fileName += ".png";

            var blobClient = containerClient.GetBlobClient(fileName);
            imageStream.Position = 0;
            await blobClient.UploadAsync(imageStream, overwrite: true, cancellationToken);
            return $"{_appOptions.ImagePath.TrimEnd('/')}/{fileName}".ToLower();
        }

        public async Task DeleteImagesAsync(IEnumerable<string> fileNames, CancellationToken cancellationToken)
        {
            var containerClient = GetContainerClient();
            await containerClient.CreateIfNotExistsAsync(cancellationToken: cancellationToken);
            foreach (var fileName in fileNames)
            {
                var blobClient = containerClient.GetBlobClient(fileName);
                try { await blobClient.DeleteIfExistsAsync(cancellationToken: cancellationToken); } catch { /* ignore */ }
            }
        }
    }
}
