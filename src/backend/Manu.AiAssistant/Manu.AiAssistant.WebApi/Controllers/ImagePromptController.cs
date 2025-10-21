using Manu.AiAssistant.WebApi.Data;
using Manu.AiAssistant.WebApi.Models.Entities;
using AutoMapper;
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
        private readonly CosmosRepository<Prompt> _promptRepository;
        private readonly IMapper _mapper;

        public ImagePromptController(
            IImagePromptProvider imagePromptProvider,
            CosmosRepository<Prompt> promptRepository,
            IMapper mapper)
        {
            _imagePromptProvider = imagePromptProvider;
            _promptRepository = promptRepository;
            _mapper = mapper;
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

            // Map and persist from ImagePromptResult
            var promptEntity = _mapper.Map<Prompt>(result);
            promptEntity.Id = Guid.NewGuid().ToString();
            result.Id = promptEntity.Id;
            promptEntity.ConversationId = string.IsNullOrEmpty(request.ConversationId) ? promptEntity.Id : request.ConversationId;
            result.ConversationId = promptEntity.ConversationId;

            promptEntity.Username = User?.Identity?.IsAuthenticated == true ? User.Identity.Name! : "anonymous";

            await _promptRepository.AddAsync(promptEntity, cancellationToken);

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
