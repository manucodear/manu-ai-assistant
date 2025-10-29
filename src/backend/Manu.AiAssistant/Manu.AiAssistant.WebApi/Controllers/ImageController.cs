using System.IO;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Manu.AiAssistant.WebApi.Options;
using Manu.AiAssistant.WebApi.Models.Entities;
using Azure.Storage.Blobs;
using Microsoft.Extensions.Logging;
using Manu.AiAssistant.WebApi.Data;
using Manu.AiAssistant.WebApi.Services;
using Manu.AiAssistant.WebApi.Extensions;
using AutoMapper;
using Manu.AiAssistant.WebApi.Models.Api;

namespace Manu.AiAssistant.WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    // [Authorize(AuthenticationSchemes = "Identity.Application,Bearer")]
    [Authorize]
    public class ImageController : Controller
    {
        private readonly HttpClient _httpClient;
        private readonly DalleOptions _options;
        private readonly BlobServiceClient _blobServiceClient;
        private readonly AzureStorageOptions _storageOptions;
        private readonly ILogger<ImageController> _logger;
        private readonly CosmosRepository<Image> _imageRepository;
        private readonly CosmosRepository<Prompt> _promptRepository;
        private readonly AppOptions _appOptions;
        private readonly IImageStorageProvider _imageStorageProvider;
        private readonly IImageProcessingProvider _imageProcessingProvider;
        private readonly IDalleProvider _dalleProvider;
        private readonly IMapper _mapper;

        public ImageController(
            IHttpClientFactory httpClientFactory,
            IOptions<DalleOptions> options,
            BlobServiceClient blobServiceClient,
            IOptions<AzureStorageOptions> storageOptions,
            ILogger<ImageController> logger,
            CosmosRepository<Image> imageRepository,
            CosmosRepository<Prompt> promptRepository,
            IOptions<AppOptions> appOptions,
            IImageStorageProvider imageStorageProvider,
            IImageProcessingProvider imageProcessingProvider,
            IDalleProvider dalleProvider,
            IMapper mapper)
        {
            _httpClient = httpClientFactory.CreateClient("external");
            _options = options.Value;
            _blobServiceClient = blobServiceClient;
            _storageOptions = storageOptions.Value;
            _logger = logger;
            _imageRepository = imageRepository;
            _promptRepository = promptRepository;
            _appOptions = appOptions.Value;
            _imageStorageProvider = imageStorageProvider;
            _imageProcessingProvider = imageProcessingProvider;
            _dalleProvider = dalleProvider;
            _mapper = mapper;
        }

        [HttpGet("{filename}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetImage(string filename, CancellationToken cancellationToken)
        {
            var containerClient = _blobServiceClient.GetBlobContainerClient(_storageOptions.Containers.Image);
            var blobClient = containerClient.GetBlobClient(filename);
            if (!await blobClient.ExistsAsync(cancellationToken))
                return NotFound();

            var downloadInfo = await blobClient.DownloadAsync(cancellationToken);
            return File(downloadInfo.Value.Content, "image/png");
        }

        [HttpGet]
        public async Task<IActionResult> GetImages(CancellationToken cancellationToken)
        {
            var username = User?.Identity?.IsAuthenticated == true ? User.Identity!.Name : null;
            if (string.IsNullOrEmpty(username)) return Unauthorized();

            var userItems = await _imageRepository.GetByUsernameAndNoErrorAsync(username, cancellationToken);
            var ordered = userItems.OrderByDescending(g => g.Timestamp).ToList();

            var images = new List<ImageResponse>();
            foreach (var imageItem in ordered.Where(item => !item.HasError && item.ImagePrompt != null && !string.IsNullOrEmpty(item.ImagePrompt.Id)))
            {
                var imagePrompt = _mapper.Map<ImagePromptResponse>(imageItem.ImagePrompt);
                imagePrompt.ImageId = imageItem.Id;
                images.Add(new ImageResponse
                {
                    Id = imageItem.Id,
                    Timestamp = imageItem.Timestamp,
                    ImageData = new ImageDataResponse
                    {
                        Url = imageItem.ImageData.Url,
                        SmallUrl = imageItem.ImageData.SmallUrl,
                        MediumUrl = imageItem.ImageData.MediumUrl,
                        LargeUrl = imageItem.ImageData.LargeUrl
                    },
                    ImagePrompt = imagePrompt
                });
            }

            return Ok(new { images });
        }
    }
}
