using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Manu.AiAssistant.WebApi.Models.Chat;
using Manu.AiAssistant.WebApi.Services;
using Microsoft.Extensions.Options;
using Manu.AiAssistant.WebApi.Options;
using System.Linq;
using Newtonsoft.Json;
using Manu.AiAssistant.WebApi.Extensions;
using Manu.AiAssistant.WebApi.Models.Api;

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

        public async Task<ImagePromptResponse> GetImagePromptResponseAsync(string userPrompt, string? conversationId, CancellationToken cancellationToken)
        {
            bool useLong = userPrompt.CountWords() > 25;
            var basePrompts = useLong ? _promptSettings.Image.Long : _promptSettings.Image.Short;
            var promptMessages = new List<PromptMessage>(basePrompts ?? new List<PromptMessage>());
            promptMessages.Add(new PromptMessage { Role = PromptRole.User, Content = userPrompt });
            ChatResult chatResult = await _chatProvider.CompleteChatAsync(promptMessages, cancellationToken);
            var json = chatResult.ResponseContent.ExtractJson();
            // TODO: improve exception handling
            try
            {
                var result = JsonConvert.DeserializeObject<ImagePromptResponse>(json);
                if (result == null)
                {
                    return new ImagePromptResponse();
                }
                result.Id = Guid.NewGuid().ToString();
                result.ConversationId = string.IsNullOrWhiteSpace(conversationId) ? result.Id : conversationId;
                return result;
            }
            catch
            {
                throw new Exception(chatResult.ResponseContent);
            }
        }

        public async Task<ImagePromptRevisionResponse> PromptRevisionAsync(ImagePromptRevisionRequest request, CancellationToken cancellationToken)
        {
            var conversation = new List<PromptMessage>
            {
                new PromptMessage { Role = PromptRole.System, Content = _promptSettings.RevisionPrompt }
            };

            var userMessage = $"Original prompt: \"{request.Prompt}\".\n";
            if (request.Tags.ToInclude.Any())
                userMessage += $"Add these concepts/tags: {string.Join(", ", request.Tags.ToInclude)}.\n";
            if (request.Tags.ToExclude.Any())
                userMessage += $"Remove these concepts/tags: {string.Join(", ", request.Tags.ToExclude)}.\n";
            if (!string.IsNullOrWhiteSpace(request.PointOfView))
            {
                //userMessage += $"Set the point of view to: {request.PointOfView} (override any existing one).\n";
                userMessage += $"Rewrite the prompt explicitly describing the scene from this camera perspective: '{request.PointOfView}'. Use clear photographic or visual composition language (e.g. 'seen from', 'wide-angle view from', 'over-the-shoulder shot'). Override any existing viewpoint.\n";
            }
            if (!string.IsNullOrWhiteSpace(request.ImageStyle))
            {
                userMessage += $"Rewrite the prompt to use this image style: '{request.ImageStyle}'. Use clear descriptive language (e.g. 'in watercolor style', 'as a digital painting', 'in photorealistic style'). Override any existing style.\n";
            }
            userMessage += "Improve the prompt accordingly, preserving the original meaning as much as possible.";

            conversation.Add(new PromptMessage { Role = PromptRole.User, Content = userMessage });
            ChatResult chatResult = await _chatProvider.CompleteChatAsync(conversation, cancellationToken);
            var json = chatResult.ResponseContent.ExtractJson();
            try
            {
                var result = JsonConvert.DeserializeObject<ImagePromptRevisionResponse>(json);
                return result ?? new ImagePromptRevisionResponse();
            }
            catch
            {
                return new ImagePromptRevisionResponse();
            }
        }

        public async Task<object?> ImageAnalisysAsync(string prompt, string improvedPrompt, string imageUrl, CancellationToken cancellationToken)
        {
            var conversation = new List<PromptMessage>(_promptSettings.ImageAnalysis ?? new List<PromptMessage>());
            conversation[1].Content = prompt;
            conversation[3].Content = $"Improved prompt: \"{improvedPrompt}\"";
            if (!string.IsNullOrWhiteSpace(imageUrl))
            {
                conversation.Add(new PromptMessage { Role = PromptRole.File, Content = imageUrl });
            }
            //// Add text prompt message
            //conversation.Add(new PromptMessage { Role = PromptRole.User, Content = $"This is the user prompt: {prompt}"});
            ChatResult chatResult = await _chatProvider.CompleteChatAsync(conversation, cancellationToken);
            var json = chatResult.ResponseContent.ExtractJson();
            return json.ParseJsonToPlainObject();
        }
    }
}
