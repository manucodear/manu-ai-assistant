using System.Threading;
using System.Threading.Tasks;
using Manu.AiAssistant.WebApi.Models.Api;
using Manu.AiAssistant.WebApi.Models.Chat;

namespace Manu.AiAssistant.WebApi.Services
{
    public interface IImagePromptProvider
    {
        Task<ImagePromptResponse> GetImagePromptResponseAsync(string userPrompt, string? conversationId, CancellationToken cancellationToken);
        Task<ImagePromptRevisionResponse> PromptRevisionAsync(ImagePromptRevisionRequest request, CancellationToken cancellationToken);
        Task<object?> ImageAnalisysAsync(string prompt, string improvedPrompt, string imageUrl, CancellationToken cancellationToken);
    }
}
