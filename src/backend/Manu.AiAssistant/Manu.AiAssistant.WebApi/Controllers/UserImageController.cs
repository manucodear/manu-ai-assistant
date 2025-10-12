using Manu.AiAssistant.WebApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Manu.AiAssistant.WebApi.Options;
using Microsoft.Extensions.Options;
using System.IO;
using System;
using System.Threading;
using System.Threading.Tasks;
using System.Collections.Generic;
using Microsoft.Extensions.Logging;

namespace Manu.AiAssistant.WebApi.Controllers
{
    [Route("api/[controller]")]
    public class UserImageController : ControllerBase
    {
        private readonly IImageProcessingProvider _imageProcessingProvider;
        private readonly AppOptions _appOptions;
        private readonly UserImageBlobStorageProvider _userImageStorageProvider;
        private readonly ILogger<UserImageController> _logger;

        public UserImageController(
            IImageProcessingProvider imageProcessingProvider,
            IOptions<AppOptions> appOptions,
            UserImageBlobStorageProvider userImageStorageProvider,
            ILogger<UserImageController> logger)
        {
            _imageProcessingProvider = imageProcessingProvider;
            _appOptions = appOptions.Value;
            _userImageStorageProvider = userImageStorageProvider;
            _logger = logger;
        }

        [HttpPost]
        [Authorize]
        public async Task<IActionResult> UploadImage([FromForm] IFormFile image, CancellationToken cancellationToken)
        {
            if (image == null || image.Length == 0)
                return BadRequest("No file uploaded.");

            var uploadedFiles = new List<string>();
            var id = Guid.NewGuid().ToString();
            var basePath = _appOptions.UserImagePath.TrimEnd('/');
            var ext = Path.GetExtension(image.FileName).ToLower();
            if (string.IsNullOrWhiteSpace(ext)) ext = ".png";

            try
            {
                using var original = new MemoryStream();
                await image.CopyToAsync(original, cancellationToken);
                original.Position = 0;
                var thumbSet = await _imageProcessingProvider.GenerateThumbnailsAsync(original, [ThumbnailSize.Small, ThumbnailSize.Medium, ThumbnailSize.Large], cancellationToken);
                await _userImageStorageProvider.UploadImageAsync(original, id + ext, cancellationToken);
                uploadedFiles.Add(id + ext);
                foreach (var (size, tuple) in thumbSet)
                {
                    var (stream, suffix) = tuple;
                    stream.Position = 0;
                    await _userImageStorageProvider.UploadImageAsync(stream, id + suffix, cancellationToken);
                    uploadedFiles.Add(id + suffix);
                    stream.Dispose();
                }

                var resultObj = new
                {
                    url = $"{basePath}/{id + ext}".ToLower(),
                    thumbnailSmall = $"{basePath}/{id}{ThumbnailSize.Small.ToFileSuffix()}".ToLower(),
                    thumbnailMedium = $"{basePath}/{id}{ThumbnailSize.Medium.ToFileSuffix()}".ToLower(),
                    thumbnailLarge = $"{basePath}/{id}{ThumbnailSize.Large.ToFileSuffix()}".ToLower()
                };
                return Ok(resultObj);
            }
            catch (OperationCanceledException ex)
            {
                _logger.LogWarning(ex, "UploadImage request cancelled. Cleaning up {Count} uploaded files: {Files}", uploadedFiles.Count, string.Join(", ", uploadedFiles));
                await _userImageStorageProvider.DeleteImagesAsync(uploadedFiles, cancellationToken);
                throw;
            }
        }

        [HttpGet("{filename}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetImage(string filename, CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(filename))
                return BadRequest("Filename required.");

            try
            {
                var containerClient = _userImageStorageProvider.GetContainerClient();
                var blobClient = containerClient.GetBlobClient(filename);
                if (!await blobClient.ExistsAsync(cancellationToken))
                    return NotFound();

                var downloadInfo = await blobClient.DownloadAsync(cancellationToken);
                return File(downloadInfo.Value.Content, "image/png");
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to retrieve user image: {Filename}", filename);
                return StatusCode(500, "Error retrieving image");
            }
        }
    }
}
