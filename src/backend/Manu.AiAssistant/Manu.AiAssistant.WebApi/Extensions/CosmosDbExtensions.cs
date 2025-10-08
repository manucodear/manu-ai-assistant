using Manu.AiAssistant.WebApi.Options;
using Microsoft.Extensions.DependencyInjection;

namespace Manu.AiAssistant.WebApi.Extensions
{
    public static class CosmosDbExtensions
    {
        public static void AddCosmosDb(this IServiceCollection services, IConfiguration configuration)
        {
            services.Configure<CosmosDbOptions>(configuration.GetSection("CosmosDb"));
            services.AddSingleton(s =>
            {
                var opts = s.GetRequiredService<Microsoft.Extensions.Options.IOptions<CosmosDbOptions>>().Value;
                var client = new Microsoft.Azure.Cosmos.CosmosClient(opts.AccountEndpoint, opts.AccountKey);
                var container = client.GetContainer(opts.DatabaseName, opts.ContainerName);
                return container;
            });
        }
    }
}
