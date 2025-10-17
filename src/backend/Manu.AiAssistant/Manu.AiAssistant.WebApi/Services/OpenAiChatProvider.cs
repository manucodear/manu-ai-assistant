using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Options;
using OpenAI;
using OpenAI.Chat;
using System.ClientModel;
using Manu.AiAssistant.WebApi.Models.Chat;
using Manu.AiAssistant.WebApi.Options;

namespace Manu.AiAssistant.WebApi.Services
{
    public class OpenAiChatProvider : IChatProvider
    {
        private readonly ChatOptions _options;
        public OpenAiChatProvider(IOptions<ChatOptions> options)
        {
            _options = options.Value;
        }
        public async Task<ChatResult> CompleteChatAsync(string prompt, CancellationToken cancellationToken)
        {
            try
            {
                ChatClient client = new(
                    credential: new ApiKeyCredential(_options.ApiKey),
                    model: _options.DeploymentName,
                    options: new OpenAIClientOptions()
                    {
                        Endpoint = new Uri(_options.Endpoint),
                    });

                var messages = new ChatMessage[]
                {
                    new SystemChatMessage("You are a helpful assistant."),
                    new UserChatMessage(prompt)
                };

                ChatCompletion completion = await client.CompleteChatAsync(messages, cancellationToken: cancellationToken);
                string response = string.Join("\n", completion.Content.Select(c => c.Text));
                return new ChatResult { ResponseContent = response, IsError = false };
            }
            catch (Exception ex)
            {
                return new ChatResult { ResponseContent = ex.Message, IsError = true };
            }
        }

        public async Task<ChatResult> CompleteChatAsync(IList<PromptMessage> prompts, CancellationToken cancellationToken)
        {
            try
            {
                ChatClient client = new(
                    credential: new ApiKeyCredential(_options.ApiKey),
                    model: _options.DeploymentName,
                    options: new OpenAIClientOptions()
                    {
                        Endpoint = new Uri(_options.Endpoint),
                    });

                var messages = prompts.Select(p =>
                    p.Role == PromptRole.System
                        ? new SystemChatMessage(p.Prompt) as ChatMessage
                        : p.Role == PromptRole.Assistant
                            ? new AssistantChatMessage(p.Prompt) as ChatMessage
                            : new UserChatMessage(p.Prompt) as ChatMessage
                ).ToArray();

                ChatCompletion completion = await client.CompleteChatAsync(messages, cancellationToken: cancellationToken);
                string response = string.Join("\n", completion.Content.Select(c => c.Text));
                return new ChatResult { ResponseContent = response, IsError = false };
            }
            catch (Exception ex)
            {
                return new ChatResult { ResponseContent = ex.Message, IsError = true };
            }
        }
    }
}
