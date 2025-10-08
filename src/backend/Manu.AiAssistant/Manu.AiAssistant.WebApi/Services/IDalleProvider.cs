using System.IO;
using System.Threading;
using System.Threading.Tasks;
using Manu.AiAssistant.WebApi.Models.Image;

namespace Manu.AiAssistant.WebApi.Services
{
    public class DalleResult
    {
        public string ResponseContent { get; set; }
        public bool IsError { get; set; }
    }

    public interface IDalleProvider
    {
        Task<DalleResult> GenerateImageAsync(GenerateRequest request, CancellationToken cancellationToken);
    }
}
