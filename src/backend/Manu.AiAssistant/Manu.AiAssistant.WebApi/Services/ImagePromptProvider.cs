using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Manu.AiAssistant.WebApi.Models.Chat;
using Manu.AiAssistant.WebApi.Services;
using Microsoft.Extensions.Options;
using Manu.AiAssistant.WebApi.Options;
using System.Linq;

namespace Manu.AiAssistant.WebApi.Services
{
    public class ImagePromptProvider
    {
        private readonly IChatProvider _chatProvider;
        private readonly PromptSettingsOptions _promptSettings;
        private const string RevisionPrompt = "You are an expert text reviser. Your task is to improve grammar, clarity, and style while preserving the original meaning. Provide a concise summary of the main changes made. Always respond with a valid JSON object, not a code block or plain text.";

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

        public async Task<ChatResult> PromptRevisionAsync(PromptRevisionRequest request, CancellationToken cancellationToken)
        {
            var conversation = new List<PromptMessage>
            {
                new PromptMessage { Role = PromptRole.System, Prompt = RevisionPrompt }
            };

            var userMessage = $"Original prompt: \"{request.Prompt}\".\n";
            if (request.Tags.ToInclude.Any())
                userMessage += $"Add these concepts/tags: {string.Join(", ", request.Tags.ToInclude)}.\n";
            if (request.Tags.ToExclude.Any())
                userMessage += $"Remove these concepts/tags: {string.Join(", ", request.Tags.ToExclude)}.\n";
            if (!string.IsNullOrWhiteSpace(request.PointOfView))
                userMessage += $"Set the point of view to: {request.PointOfView} (override any existing one).\n";
            userMessage += "Improve the prompt accordingly, preserving the original meaning as much as possible.";

            conversation.Add(new PromptMessage { Role = PromptRole.User, Prompt = userMessage });
            return await _chatProvider.CompleteChatAsync(conversation, cancellationToken);
        }
    }
}
