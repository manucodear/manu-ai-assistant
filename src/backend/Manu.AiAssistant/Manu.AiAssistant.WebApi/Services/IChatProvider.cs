using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Manu.AiAssistant.WebApi.Models.Chat;

namespace Manu.AiAssistant.WebApi.Services
{
    public interface IChatProvider
    {
        Task<ChatResult> CompleteChatAsync(string prompt, CancellationToken cancellationToken);
        Task<ChatResult> CompleteChatAsync(IList<PromptMessage> prompts, CancellationToken cancellationToken);
    }
}