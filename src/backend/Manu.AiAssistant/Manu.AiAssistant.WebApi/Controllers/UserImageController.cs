using Azure.Storage.Blobs.Models; // for blob listing
using Manu.AiAssistant.WebApi.Models.Api;
using Manu.AiAssistant.WebApi.Options;
using Manu.AiAssistant.WebApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System;
using System.Collections.Generic;
using System.IO;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;

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

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
            if (string.IsNullOrWhiteSpace(userId))
            {
                _logger.LogWarning("UploadImage called without user id claim");
                return Unauthorized();
            }

            var uploadedFiles = new List<string>();
            var id = Guid.NewGuid().ToString();
            var basePath = _appOptions.UserImagePath.TrimEnd('/');
            var ext = Path.GetExtension(image.FileName).ToLower();
            if (string.IsNullOrWhiteSpace(ext)) ext = ".png";

            var dirPrefix = userId + "/";

            try
            {
                using var original = new MemoryStream();
                await image.CopyToAsync(original, cancellationToken);
                original.Position = 0;
                var thumbSet = await _imageProcessingProvider.GenerateThumbnailsAsync(original, [ThumbnailSize.Small, ThumbnailSize.Medium, ThumbnailSize.Large], cancellationToken);

                var originalFileName = dirPrefix + id + ext; // stored path (with user directory)
                await _userImageStorageProvider.UploadImageAsync(original, originalFileName, cancellationToken);
                uploadedFiles.Add(originalFileName);

                foreach (var (size, tuple) in thumbSet)
                {
                    var (stream, suffix) = tuple;
                    stream.Position = 0;
                    var thumbFileName = dirPrefix + id + suffix;
                    await _userImageStorageProvider.UploadImageAsync(stream, thumbFileName, cancellationToken);
                    uploadedFiles.Add(thumbFileName);
                    stream.Dispose();
                }

                // Public URLs now expose only filename (without user directory) since GET will infer userId
                var resultObj = new ImageDataResponse
                {
                    Url = $"{basePath}/{id + ext}".ToLower(),
                    SmallUrl = $"{basePath}/{id}{ThumbnailSize.Small.ToFileSuffix()}".ToLower(),
                    MediumUrl = $"{basePath}/{id}{ThumbnailSize.Medium.ToFileSuffix()}".ToLower(),
                    LargeUrl = $"{basePath}/{id}{ThumbnailSize.Large.ToFileSuffix()}".ToLower()
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

        // GET only receives the file name (e.g. guid.png or guid.small.png) and we prepend userId internally
        [HttpGet("{filename}")]
        public async Task<IActionResult> GetImage(string filename, CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(filename))
                return BadRequest("Filename required.");

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
            if (string.IsNullOrWhiteSpace(userId))
            {
                _logger.LogWarning("GetImage called without user id claim");
                return Unauthorized();
            }

            var storedPath = userId + "/" + filename; // path in blob storage

            try
            {
                var containerClient = _userImageStorageProvider.GetContainerClient();
                var blobClient = containerClient.GetBlobClient(storedPath);
                if (!await blobClient.ExistsAsync(cancellationToken))
                    return NotFound();

                var downloadInfo = await blobClient.DownloadAsync(cancellationToken);
                return File(downloadInfo.Value.Content, "image/png");
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to retrieve user image: {Filename} (stored path {StoredPath})", filename, storedPath);
                return StatusCode(500, "Error retrieving image");
            }
        }

        [HttpDelete("{filename}")]
        [Authorize]
        public async Task<IActionResult> DeleteImage(string filename, CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(filename))
                return BadRequest("Filename required.");

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
            if (string.IsNullOrWhiteSpace(userId))
            {
                _logger.LogWarning("DeleteImage called without user id claim");
                return Unauthorized();
            }

            // Normalize filename to simple name (avoid path traversal attempts)
            var safeFileName = Path.GetFileName(filename);

            // Determine root id (strip thumbnail suffix if present)
            string rootId;
            if (safeFileName.EndsWith(ThumbnailSize.Small.ToFileSuffix(), StringComparison.OrdinalIgnoreCase))
                rootId = safeFileName[..^ThumbnailSize.Small.ToFileSuffix().Length];
            else if (safeFileName.EndsWith(ThumbnailSize.Medium.ToFileSuffix(), StringComparison.OrdinalIgnoreCase))
                rootId = safeFileName[..^ThumbnailSize.Medium.ToFileSuffix().Length];
            else if (safeFileName.EndsWith(ThumbnailSize.Large.ToFileSuffix(), StringComparison.OrdinalIgnoreCase))
                rootId = safeFileName[..^ThumbnailSize.Large.ToFileSuffix().Length];
            else
                rootId = Path.GetFileNameWithoutExtension(safeFileName);

            var userPrefix = userId + "/";
            var searchPrefix = userPrefix + rootId; // matches original and thumbnails

            var container = _userImageStorageProvider.GetContainerClient();
            var blobsToDelete = new List<string>();

            await foreach (var blob in container.GetBlobsAsync(prefix: searchPrefix, cancellationToken: cancellationToken))
            {
                blobsToDelete.Add(blob.Name);
            }

            if (blobsToDelete.Count == 0)
            {
                _logger.LogInformation("DeleteImage found no blobs for user {UserId} rootId {RootId}", userId, rootId);
                return NotFound();
            }

            await _userImageStorageProvider.DeleteImagesAsync(blobsToDelete, cancellationToken);
            _logger.LogInformation("Deleted {Count} user image blobs for user {UserId} rootId {RootId}", blobsToDelete.Count, userId, rootId);
            return NoContent();
        }
    }
}
