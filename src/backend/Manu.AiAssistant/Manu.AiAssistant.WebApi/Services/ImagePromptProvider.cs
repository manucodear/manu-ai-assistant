using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Manu.AiAssistant.WebApi.Models.Chat;
using Manu.AiAssistant.WebApi.Services;
using Microsoft.Extensions.Options;
using Manu.AiAssistant.WebApi.Options;

namespace Manu.AiAssistant.WebApi.Services
{
    public class ImagePromptProvider
    {
        private readonly IChatProvider _chatProvider;
        private readonly PromptSettingsOptions _promptSettings;

        public ImagePromptProvider(IChatProvider chatProvider, IOptions<PromptSettingsOptions> promptSettingsOptions)
        {
            _chatProvider = chatProvider;
            _promptSettings = promptSettingsOptions.Value;
        }

        public async Task<ChatResult> GetImagePromptResponseAsync(string userPrompt, CancellationToken cancellationToken, bool useLong = false)
        {
            // Use options pattern to get prompt messages
            var basePrompts = useLong ? _promptSettings.Image.Long : _promptSettings.Image.Short;
            var promptMessages = new List<PromptMessage>(basePrompts ?? new List<PromptMessage>());
            promptMessages.Add(new PromptMessage { Role = PromptRole.User, Prompt = userPrompt });
            return await _chatProvider.CompleteChatAsync(promptMessages, cancellationToken);
        }
    }
}
