using System.Threading;
using System.Threading.Tasks;
using OpenAI.Chat;

namespace Manu.AiAssistant.WebApi.Services
{
    public class ChatResult
    {
        public string ResponseContent { get; set; } = string.Empty;
        public bool IsError { get; set; }
    }

    public interface IChatProvider
    {
        Task<ChatResult> CompleteChatAsync(string prompt, string username, CancellationToken cancellationToken);
    }
}