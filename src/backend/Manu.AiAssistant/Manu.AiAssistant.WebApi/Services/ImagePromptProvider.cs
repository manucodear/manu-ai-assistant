using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Manu.AiAssistant.WebApi.Models.Chat;
using Manu.AiAssistant.WebApi.Services;
using Microsoft.Extensions.Options;
using Manu.AiAssistant.WebApi.Options;
using System.Linq;
using Newtonsoft.Json;
using Manu.AiAssistant.WebApi.Models.ImagePrompt;
using Manu.AiAssistant.WebApi.Extensions;

namespace Manu.AiAssistant.WebApi.Services
{
    public class ImagePromptProvider : IImagePromptProvider
    {
        private readonly IChatProvider _chatProvider;
        private readonly PromptSettingsOptions _promptSettings;

        public ImagePromptProvider(IChatProvider chatProvider, IOptions<PromptSettingsOptions> promptSettingsOptions)
        {
            _chatProvider = chatProvider;
            _promptSettings = promptSettingsOptions.Value;
        }

        public async Task<ImagePromptResult> GetImagePromptResponseAsync(string userPrompt, CancellationToken cancellationToken, bool useLong = false)
        {
            var basePrompts = useLong ? _promptSettings.Image.Long : _promptSettings.Image.Short;
            var promptMessages = new List<PromptMessage>(basePrompts ?? new List<PromptMessage>());
            promptMessages.Add(new PromptMessage { Role = PromptRole.User, Prompt = userPrompt });
            ChatResult chatResult = await _chatProvider.CompleteChatAsync(promptMessages, cancellationToken);
            var json = chatResult.ResponseContent.ExtractJson();
            try
            {
                var result = JsonConvert.DeserializeObject<ImagePromptResult>(json);
                return result ?? new ImagePromptResult();
            }
            catch
            {
                return new ImagePromptResult();
            }
        }

        public async Task<PromptRevisionResult> PromptRevisionAsync(PromptRevisionRequest request, CancellationToken cancellationToken)
        {
            var conversation = new List<PromptMessage>
            {
                new PromptMessage { Role = PromptRole.System, Prompt = _promptSettings.RevisionPrompt }
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
            ChatResult chatResult = await _chatProvider.CompleteChatAsync(conversation, cancellationToken);
            var json = chatResult.ResponseContent.ExtractJson();
            try
            {
                var result = JsonConvert.DeserializeObject<PromptRevisionResult>(json);
                return result ?? new PromptRevisionResult();
            }
            catch
            {
                return new PromptRevisionResult();
            }
        }
    }
}
