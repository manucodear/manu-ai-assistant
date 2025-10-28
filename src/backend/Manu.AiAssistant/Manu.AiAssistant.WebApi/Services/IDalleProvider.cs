using Manu.AiAssistant.WebApi.Models.Entities;

namespace Manu.AiAssistant.WebApi.Services
{
    public class DalleResult
    {
        public string ResponseContent { get; set; } = string.Empty;
        public bool IsError { get; set; }
        public object DalleRequest { get; set; } = new { };
    }

    public interface IDalleProvider
    {
        Task<DalleResult> GenerateImageAsync(Prompt prompt, CancellationToken cancellationToken);
    }
}
