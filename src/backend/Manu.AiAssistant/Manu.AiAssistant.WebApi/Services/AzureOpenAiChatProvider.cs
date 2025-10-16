using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Options;
using Azure;
using Azure.AI.OpenAI;
using Manu.AiAssistant.WebApi.Models.Chat;
using Manu.AiAssistant.WebApi.Options;

namespace Manu.AiAssistant.WebApi.Services
{
    public class AzureOpenAiChatProvider : IChatProvider
    {
        private readonly ChatOptions _options;
        public AzureOpenAiChatProvider(IOptions<ChatOptions> options)
        {
            _options = options.Value;
        }
        public async Task<ChatResult> CompleteChatAsync(string prompt, CancellationToken cancellationToken)
        {
            try
            {
                var client = new OpenAIClient(
                    new Uri(_options.Endpoint),
                    new AzureKeyCredential(_options.ApiKey)
                );

                var chatOptions = new ChatCompletionsOptions();
                chatOptions.Messages.Add(new ChatMessage(ChatRole.System, "You are a helpful assistant."));
                chatOptions.Messages.Add(new ChatMessage(ChatRole.User, prompt));

                var response = await client.GetChatCompletionsAsync(
                    _options.DeploymentName,
                    chatOptions,
                    cancellationToken
                );

                var content = response.Value.Choices[0].Message.Content;
                return new ChatResult { ResponseContent = content, IsError = false };
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
                var client = new OpenAIClient(
                    new Uri(_options.Endpoint),
                    new AzureKeyCredential(_options.ApiKey)
                );

                var chatOptions = new ChatCompletionsOptions();
                foreach (var prompt in prompts)
                {
                    ChatRole role = prompt.Role switch
                    {
                        PromptRole.System => ChatRole.System,
                        PromptRole.Assistant => ChatRole.Assistant,
                        _ => ChatRole.User
                    };
                    chatOptions.Messages.Add(new ChatMessage(role, prompt.Prompt));
                }

                var response = await client.GetChatCompletionsAsync(
                    _options.DeploymentName,
                    chatOptions,
                    cancellationToken
                );

                var content = response.Value.Choices[0].Message.Content;
                return new ChatResult { ResponseContent = content, IsError = false };
            }
            catch (Exception ex)
            {
                return new ChatResult { ResponseContent = ex.Message, IsError = true };
            }
        }
    }
}
