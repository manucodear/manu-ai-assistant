using System.Linq;
using Microsoft.Extensions.Options;
using Azure;
using Azure.AI.OpenAI;
using Manu.AiAssistant.WebApi.Models.Chat;
using Manu.AiAssistant.WebApi.Options;
using OpenAI.Chat;

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
                var azureClient = new AzureOpenAIClient(
                    new Uri(_options.Endpoint),
                    new AzureKeyCredential(_options.ApiKey)
                );
                var chatClient = azureClient.GetChatClient(_options.DeploymentName);

                var messages = new List<ChatMessage>
                {
                    new SystemChatMessage("You are a helpful assistant."),
                    new UserChatMessage(prompt)
                };

                var completionResult = await chatClient.CompleteChatAsync(messages, null, cancellationToken);
                var completion = completionResult.Value;
                string response = string.Join("", completion.Content.Select(part => part.Text));
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
                var azureClient = new AzureOpenAIClient(
                    new Uri(_options.Endpoint),
                    new AzureKeyCredential(_options.ApiKey)
                );
                var chatClient = azureClient.GetChatClient(_options.DeploymentName);

                var messages = new List<ChatMessage>();
                foreach (var prompt in prompts)
                {
                    ChatMessage message;
                    switch (prompt.Role)
                    {
                        case PromptRole.System:
                            message = new SystemChatMessage(prompt.Content);
                            break;
                        case PromptRole.Assistant:
                            message = new AssistantChatMessage(prompt.Content);
                            break;
                        case PromptRole.File:
                            message = new UserChatMessage(new List<ChatMessageContentPart>
                            {
                                ChatMessageContentPart.CreateTextPart("Attached image for analysis."),
                                ChatMessageContentPart.CreateImagePart(new Uri(prompt.Content))
                            });
                            break;
                        default:
                            message = new UserChatMessage(prompt.Content);
                            break;
                    }
                    messages.Add(message);
                }

                var completionResult = await chatClient.CompleteChatAsync(messages, null, cancellationToken);
                var completion = completionResult.Value;
                string response = string.Join("", completion.Content.Select(part => part.Text));
                return new ChatResult { ResponseContent = response, IsError = false };
            }
            catch (Exception ex)
            {
                return new ChatResult { ResponseContent = ex.Message, IsError = true };
            }
        }
    }
}
