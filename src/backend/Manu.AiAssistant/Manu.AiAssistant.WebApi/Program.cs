using Azure.Security.KeyVault.Secrets;
using Azure.Identity;
using Manu.AiAssistant.WebApi.Options;
using Manu.AiAssistant.WebApi.Identity;
using Microsoft.AspNetCore.Identity;
using Azure.Extensions.AspNetCore.Configuration.Secrets;
using Manu.AiAssistant.WebApi.KeyVault;
using Manu.AiAssistant.WebApi.Http;
using Manu.AiAssistant.WebApi.Models.Image;
using Manu.AiAssistant.WebApi.Models.Entities;
using Manu.AiAssistant.WebApi.Data;
using Manu.AiAssistant.WebApi.Services;
using Microsoft.Azure.Cosmos;
using Manu.AiAssistant.WebApi.Identity; // ensure CosmosUserStore is visible
using Azure.Storage.Blobs; // added for BlobServiceClient
using Microsoft.AspNetCore.Authentication.Cookies; // for cookie options
using Manu.AiAssistant.WebApi.Models.Chat;
using Manu.AiAssistant.WebApi.Options;
using Manu.AiAssistant.WebApi.Models.Entities;
using Manu.AiAssistant.WebApi.Services;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace Manu.AiAssistant.WebApi
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            var keyVaultUrl = builder.Configuration["AzureKeyVault:Url"];
            if (!string.IsNullOrEmpty(keyVaultUrl))
            {
                var secretClient = new SecretClient(new Uri(keyVaultUrl), new DefaultAzureCredential());
                builder.Configuration.AddAzureKeyVault(secretClient, new CustomKeyVaultSecretManager());
            }

            builder.Services.AddControllers();
            builder.Services.AddOpenApi();

            const string FrontendCorsPolicy = "Frontend";
            builder.Services.AddCors(options =>
            {
                options.AddPolicy(FrontendCorsPolicy, policy =>
                {
                    policy.WithOrigins("https://localhost:3001")
                          .AllowAnyHeader()
                          .AllowAnyMethod()
                          .AllowCredentials();
                });
            });

            builder.Services.AddTransient<ExternalRequestLoggingHandler>();
            builder.Services.AddHttpClient("external")
                            .AddHttpMessageHandler<ExternalRequestLoggingHandler>();

            if (!string.IsNullOrWhiteSpace(keyVaultUrl))
            {
                builder.Services.AddSingleton(_ => new SecretClient(new Uri(keyVaultUrl), new DefaultAzureCredential()));
            }

            builder.Services.Configure<AzureAdOptions>(builder.Configuration.GetSection("AzureAd"));
            builder.Services.Configure<DalleOptions>(builder.Configuration.GetSection("Dalle"));
            builder.Services.Configure<GoogleOptions>(builder.Configuration.GetSection("Google"));
            builder.Services.Configure<AzureStorageOptions>(builder.Configuration.GetSection("AzureStorage"));
            builder.Services.Configure<AppOptions>(builder.Configuration.GetSection("App"));
            builder.Services.Configure<ChatOptions>(builder.Configuration.GetSection("Chat"));
            builder.Services.AddScoped<IChatProvider, ChatApiProvider>();

            // Health checks
            builder.Services.AddHealthChecks();

            // Data Protection (required for Identity token providers)
            builder.Services.AddDataProtection();

            // BlobServiceClient for image storage & controller
            builder.Services.AddSingleton(provider =>
            {
                var storageOptions = provider.GetRequiredService<Microsoft.Extensions.Options.IOptions<AzureStorageOptions>>().Value;
                return new BlobServiceClient(new Uri(storageOptions.AccountUrl), new DefaultAzureCredential());
            });

            // Cosmos Client singleton (shared)
            builder.Services.AddSingleton(provider => {
                var config = provider.GetRequiredService<IConfiguration>();
                var cosmosSection = config.GetSection("CosmosDb");
                var accountEndpoint = cosmosSection["AccountEndpoint"];
                var accountKey = cosmosSection["AccountKey"];
                var clientOptions = new CosmosClientOptions
                {
                    SerializerOptions = new CosmosSerializationOptions
                    {
                        PropertyNamingPolicy = CosmosPropertyNamingPolicy.CamelCase,
                        IgnoreNullValues = true
                    }
                };
                return new CosmosClient(accountEndpoint, accountKey, clientOptions);
            });

            // Identity (custom Cosmos user store). We only need basic user operations (external login).
            builder.Services.AddIdentityCore<ApplicationUser>(o =>
            {
                o.User.RequireUniqueEmail = false;
            })
            .AddSignInManager()
            .AddDefaultTokenProviders();
            builder.Services.AddScoped<IUserStore<ApplicationUser>, CosmosUserStore>();

            // Authentication & Cookie scheme (required for SignInManager)
            builder.Services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = IdentityConstants.ApplicationScheme;
                options.DefaultSignInScheme = IdentityConstants.ApplicationScheme;
                options.DefaultChallengeScheme = IdentityConstants.ApplicationScheme;
            })
            .AddCookie(IdentityConstants.ApplicationScheme, o =>
            {
                o.Cookie.SameSite = SameSiteMode.None;
                o.Cookie.SecurePolicy = CookieSecurePolicy.Always;
                o.Cookie.HttpOnly = true;
                o.SlidingExpiration = true;
            })
            .AddJwtBearer("Bearer", options =>
            {
                options.TokenValidationParameters = new Microsoft.IdentityModel.Tokens.TokenValidationParameters
                {
                    ValidateIssuer = false,
                    ValidateAudience = false,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = false
                    // Configure as needed for your JWT
                };
            });

            // (Optional) additional configuration hook retained
            builder.Services.ConfigureApplicationCookie(o =>
            {
                o.Cookie.SameSite = SameSiteMode.None;
                o.Cookie.SecurePolicy = CookieSecurePolicy.Always;
                o.Cookie.HttpOnly = true;
            });

            // ImageGeneration repository
            builder.Services.AddSingleton(provider => {
                var config = provider.GetRequiredService<IConfiguration>();
                var cosmosSection = config.GetSection("CosmosDb");
                var databaseName = cosmosSection["DatabaseName"];
                var containerName = cosmosSection.GetSection("ImageGeneration")["ContainerName"];
                var client = provider.GetRequiredService<CosmosClient>();
                var container = client.GetContainer(databaseName, containerName);
                return new CosmosRepository<ImageGeneration>(container);
            });

            builder.Services.AddScoped<IImageProcessingProvider, ImageSharpProcessingProvider>();
            builder.Services.AddScoped<IImageStorageProvider, AzureBlobImageStorageProvider>();
            builder.Services.AddScoped<IDalleProvider, DalleApiProvider>();
            builder.Services.AddScoped<IChatProvider, ChatApiProvider>();

            // Register Chat repository
            builder.Services.AddSingleton(provider => {
                var config = provider.GetRequiredService<IConfiguration>();
                var cosmosSection = config.GetSection("CosmosDb");
                var databaseName = cosmosSection["DatabaseName"];
                var containerName = "Chat"; // Container for chat completions
                var client = provider.GetRequiredService<CosmosClient>();
                var container = client.GetContainer(databaseName, containerName);
                return new CosmosRepository<Chat>(container);
            });

            var app = builder.Build();

            if (app.Environment.IsDevelopment())
            {
                app.MapOpenApi();
            }

            app.UseHttpsRedirection();
            app.UseCors(FrontendCorsPolicy);
            app.UseAuthentication();
            app.UseAuthorization();
            app.MapControllers();
            app.MapHealthChecks("/health");
            app.Run();
        }
    }
}
