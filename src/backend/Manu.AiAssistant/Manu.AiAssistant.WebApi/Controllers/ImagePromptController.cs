using Manu.AiAssistant.WebApi.Models.ImagePrompt;
using Manu.AiAssistant.WebApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Manu.AiAssistant.WebApi.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class ImagePromptController : ControllerBase
    {
        private readonly IImagePromptProvider _imagePromptProvider;

        public ImagePromptController(IImagePromptProvider imagePromptProvider)
        {
            _imagePromptProvider = imagePromptProvider;
        }

        [HttpPost]
        public async Task<IActionResult> Post([FromBody] ImagePromptRequest request, CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(request.Prompt))
            {
                return BadRequest("Prompt is required.");
            }

            var result = await _imagePromptProvider.GetImagePromptResponseAsync(request.Prompt, cancellationToken);
            if (result == null || string.IsNullOrWhiteSpace(result.ImprovedPrompt))
            {
                return StatusCode(500, "Failed to parse image prompt result.");
            }
            return Ok(result);
        }

        [HttpPut]
        public async Task<IActionResult> PromptRevision([FromBody] PromptRevisionRequest request, CancellationToken cancellationToken)
        {
            var result = await _imagePromptProvider.PromptRevisionAsync(request, cancellationToken);
            if (result == null || string.IsNullOrWhiteSpace(result.RevisedPrompt))
            {
                return StatusCode(500, "Failed to parse prompt revision result.");
            }
            return Ok(result);
        }
    }
}
