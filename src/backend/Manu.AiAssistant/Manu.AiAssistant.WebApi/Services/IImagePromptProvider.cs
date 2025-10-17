using System.Threading;
using System.Threading.Tasks;
using Manu.AiAssistant.WebApi.Models.Chat;
using Manu.AiAssistant.WebApi.Models.ImagePrompt;

namespace Manu.AiAssistant.WebApi.Services
{
    public interface IImagePromptProvider
    {
        Task<ImagePromptResult> GetImagePromptResponseAsync(string userPrompt, CancellationToken cancellationToken, bool useLong = false);
        Task<PromptRevisionResult> PromptRevisionAsync(PromptRevisionRequest request, CancellationToken cancellationToken);
    }
}
