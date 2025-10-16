using Manu.AiAssistant.WebApi.Models.Chat;
using Manu.AiAssistant.WebApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Threading;
using System.Threading.Tasks;

namespace Manu.AiAssistant.WebApi.Controllers
{
    //[Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class ImagePromptController : ControllerBase
    {
        private readonly ImagePromptProvider _imagePromptProvider;

        public ImagePromptController(ImagePromptProvider imagePromptProvider)
        {
            _imagePromptProvider = imagePromptProvider;
        }

        [HttpPost]
        public async Task<IActionResult> Post([FromBody] ChatRequest request, CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(request.Prompt))
            {
                return BadRequest("Prompt is required.");
            }

            var result = await _imagePromptProvider.GetImagePromptResponseAsync(request.Prompt, cancellationToken);
            if (result.IsError)
            {
                return StatusCode(500, result.ResponseContent);
            }
            return Ok(result.ResponseContent);
        }
    }
}
