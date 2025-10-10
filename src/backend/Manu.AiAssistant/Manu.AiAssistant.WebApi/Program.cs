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
using Microsoft.AspNetCore.HttpOverrides; // forwarded headers

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

            // Health checks
            builder.Services.AddHealthChecks();

            // Data Protection (required for Identity token providers)
            builder.Services.AddDataProtection();

            // Forwarded headers (Front Door / reverse proxy) so Request.Scheme becomes https
            builder.Services.Configure<ForwardedHeadersOptions>(options =>
            {
                options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto | ForwardedHeaders.XForwardedHost;
                // Optionally clear known networks/proxies to accept forwarded headers from Front Door / Container Apps ingress
                options.KnownNetworks.Clear();
                options.KnownProxies.Clear();
            });

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
                // Avoid HTTP redirect for API clients: return 401/403 instead
                o.Events = new CookieAuthenticationEvents
                {
                    OnRedirectToLogin = ctx => { ctx.Response.StatusCode = StatusCodes.Status401Unauthorized; return Task.CompletedTask; },
                    OnRedirectToAccessDenied = ctx => { ctx.Response.StatusCode = StatusCodes.Status403Forbidden; return Task.CompletedTask; }
                };
            });

            // Optional secondary configuration (kept minimal now)
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

            var app = builder.Build();

            if (app.Environment.IsDevelopment())
            {
                app.MapOpenApi();
            }

            // MUST be before authentication so scheme/host are corrected
            app.UseForwardedHeaders();

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
