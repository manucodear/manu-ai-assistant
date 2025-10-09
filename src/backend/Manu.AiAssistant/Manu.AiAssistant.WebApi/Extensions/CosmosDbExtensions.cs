using Manu.AiAssistant.WebApi.Options;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Azure.Cosmos; // added

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
                var clientOptions = new CosmosClientOptions
                {
                    SerializerOptions = new CosmosSerializationOptions
                    {
                        PropertyNamingPolicy = CosmosPropertyNamingPolicy.CamelCase,
                        IgnoreNullValues = true
                    }
                };
                var client = new CosmosClient(opts.AccountEndpoint, opts.AccountKey, clientOptions);
                var container = client.GetContainer(opts.DatabaseName, opts.ContainerName);
                return container;
            });
        }
    }
}
