using Manu.AiAssistant.WebApi.Options;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Azure.Cosmos;
using Microsoft.Extensions.Options;

namespace Manu.AiAssistant.WebApi.Extensions
{
    public static class CosmosDbExtensions
    {
        public static void AddCosmosDb(this IServiceCollection services, IConfiguration configuration)
        {
            services.Configure<CosmosDbOptions>(configuration.GetSection("CosmosDb"));
            services.AddSingleton(s =>
            {
                var opts = s.GetRequiredService<IOptions<CosmosDbOptions>>().Value;
                var clientOptions = new CosmosClientOptions
                {
                    SerializerOptions = new CosmosSerializationOptions
                    {
                        PropertyNamingPolicy = CosmosPropertyNamingPolicy.CamelCase,
                        IgnoreNullValues = true
                    }
                };
                var client = new CosmosClient(opts.AccountEndpoint, opts.AccountKey, clientOptions);
                // Example: get the 'Image' container
                var container = client.GetContainer(opts.DatabaseName, opts.Containers["Image"]);
                return container;
            });
        }
    }
}
