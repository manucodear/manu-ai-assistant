using Manu.AiAssistant.WebApi.Data;
using Manu.AiAssistant.WebApi.Models.Chat;
using Manu.AiAssistant.WebApi.Models.Entities;
using Manu.AiAssistant.WebApi.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace Manu.AiAssistant.WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(AuthenticationSchemes = "Identity.Application,Bearer")]
    public class ChatController : ControllerBase
    {
        private readonly IChatProvider _chatProvider;
        private readonly CosmosRepository<Chat> _chatRepository;

        public ChatController(IChatProvider chatProvider, CosmosRepository<Chat> chatRepository)
        {
            _chatProvider = chatProvider;
            _chatRepository = chatRepository;
        }

        [HttpPost]
        public async Task<IActionResult> Post([FromBody] ChatRequest request, CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(request.Prompt))
                return BadRequest("Prompt is required.");

            var username = User?.Identity?.IsAuthenticated == true ? User.Identity.Name : "anonymous";
            var chatResult = await _chatProvider.CompleteChatAsync(request.Prompt, cancellationToken);

            var chatEntity = new Chat
            {
                Username = username!,
                TimestampUtc = DateTime.UtcNow,
                ChatRequest = request,
                ChatResponse = chatResult.ResponseContent,
                Error = chatResult.IsError
            };
            await _chatRepository.AddAsync(chatEntity, cancellationToken);

            if (chatResult.IsError)
                return StatusCode(502, new { error = chatResult.ResponseContent });

            return Ok(new { response = chatResult.ResponseContent });
        }
    }
}
