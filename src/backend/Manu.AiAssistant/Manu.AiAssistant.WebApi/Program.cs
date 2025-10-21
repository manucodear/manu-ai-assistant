using Azure.Security.KeyVault.Secrets;
using Azure.Identity;
using Manu.AiAssistant.WebApi.Options;
using Manu.AiAssistant.WebApi.Identity;
using Microsoft.AspNetCore.Identity;
using Manu.AiAssistant.WebApi.KeyVault;
using Manu.AiAssistant.WebApi.Http;
using Manu.AiAssistant.WebApi.Models.Entities;
using Manu.AiAssistant.WebApi.Data;
using Manu.AiAssistant.WebApi.Services;
using Microsoft.Azure.Cosmos;
using Azure.Storage.Blobs; // added for BlobServiceClient
using Microsoft.AspNetCore.Authentication.Cookies; // for cookie options
using Microsoft.AspNetCore.HttpOverrides; // ForwardedHeaders
using Microsoft.AspNetCore.DataProtection; // DataProtection extensions
using Azure.Security.KeyVault.Keys; // Key Vault key client
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Options;

namespace Manu.AiAssistant.WebApi
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            // Add promptSettings.json
            builder.Configuration.AddJsonFile("promptSettings.json", optional: true, reloadOnChange: true);

            // Add logging for configuration startup
            builder.Logging.AddConsole();
            var tempLogger = LoggerFactory.Create(logging => logging.AddConsole()).CreateLogger("Startup");
            tempLogger.LogInformation("Starting Manu.AiAssistant.WebApi startup sequence");

            var keyVaultUrl = builder.Configuration["AzureKeyVault:Url"];
            tempLogger.LogInformation("AzureKeyVault:Url = {KeyVaultUrl}", keyVaultUrl);
            if (!string.IsNullOrEmpty(keyVaultUrl))
            {
                var secretClient = new SecretClient(new Uri(keyVaultUrl), new DefaultAzureCredential());
                builder.Configuration.AddAzureKeyVault(secretClient, new CustomKeyVaultSecretManager());
                tempLogger.LogInformation("Azure Key Vault configuration added");
            }

            // Application Insights (requires connection string in configuration or env)
            builder.Services.AddApplicationInsightsTelemetry();

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
                builder.Services.AddSingleton(_ => new KeyClient(new Uri(keyVaultUrl), new DefaultAzureCredential()));
            }

            // Register AzureAdOptions
            tempLogger.LogInformation("Binding configuration sections to options...");
            builder.Services.Configure<AzureAdOptions>(builder.Configuration.GetSection("AzureAd"));
            builder.Services.Configure<DalleOptions>(builder.Configuration.GetSection("Dalle"));
            builder.Services.Configure<GoogleOptions>(builder.Configuration.GetSection("Google"));
            builder.Services.Configure<AzureStorageOptions>(builder.Configuration.GetSection("AzureStorage"));
            builder.Services.Configure<AppOptions>(builder.Configuration.GetSection("App"));
            builder.Services.Configure<ChatOptions>(builder.Configuration.GetSection("Chat"));
            builder.Services.Configure<CosmosDbOptions>(builder.Configuration.GetSection("CosmosDb"));
            builder.Services.Configure<PromptSettingsOptions>(builder.Configuration);

            builder.Services.AddScoped<IChatProvider, AzureOpenAiChatProvider>();
            // To use Azure OpenAI (default):
            builder.Services.AddScoped<IChatProvider, AzureOpenAiChatProvider>(); // Change to OpenAiChatProvider for OpenAI public API

            // Health checks
            // To use Azure OpenAI (default):
            builder.Services.AddScoped<IChatProvider, AzureOpenAiChatProvider>(); // Change to OpenAiChatProvider for OpenAI public API

            // Health checks
            // To use Azure OpenAI (default):
            builder.Services.AddScoped<IChatProvider, AzureOpenAiChatProvider>(); // Change to OpenAiChatProvider for OpenAI public API

            // Health checks
            // To use Azure OpenAI (default):
            builder.Services.AddScoped<IChatProvider, AzureOpenAiChatProvider>(); // Change to OpenAiChatProvider for OpenAI public API

            // Health checks
            builder.Services.AddHealthChecks();

            builder.Services.Configure<ForwardedHeadersOptions>(options =>
            {
                options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto | ForwardedHeaders.XForwardedHost;
                options.KnownNetworks.Clear();
                options.KnownProxies.Clear();
            });

            builder.Services.AddSingleton(provider =>
            {
                var storageOptions = provider.GetRequiredService<Microsoft.Extensions.Options.IOptions<AzureStorageOptions>>().Value;
                tempLogger.LogInformation("AzureStorageOptions.AccountUrl: {AccountUrl}", storageOptions.AccountUrl);
                return new BlobServiceClient(new Uri(storageOptions.AccountUrl), new DefaultAzureCredential());
            });

            var dataProtectionBuilder = builder.Services.AddDataProtection()
                .SetApplicationName("ManuAiAssistant")
                .PersistKeysToAzureBlobStorage(sp =>
                {
                    var blobService = sp.GetRequiredService<BlobServiceClient>();
                    var container = blobService.GetBlobContainerClient("dataprotection");
                    container.CreateIfNotExists();
                    tempLogger.LogInformation("DataProtection: Persisting keys to Azure Blob Storage");
                    return container.GetBlobClient("keyring.xml");
                });
            
            if (!string.IsNullOrEmpty(keyVaultUrl))
            {
                var keyIdentifier = builder.Configuration["AzureKeyVault:DataProtectionKeyId"];
                keyIdentifier = $"{keyVaultUrl}/keys/{keyIdentifier}";
                tempLogger.LogInformation("DataProtection: Protecting keys with Azure Key Vault: {KeyIdentifier}", keyIdentifier);
                dataProtectionBuilder.ProtectKeysWithAzureKeyVault(new Uri(keyIdentifier), new DefaultAzureCredential());
            }

            builder.Services.AddSingleton(provider => {
                var options = provider.GetRequiredService<IOptions<CosmosDbOptions>>().Value;
                tempLogger.LogInformation("CosmosDbOptions.AccountEndpoint: {AccountEndpoint}, DatabaseName: {DatabaseName}", options.AccountEndpoint, options.DatabaseName);
                var clientOptions = new CosmosClientOptions
                {
                    SerializerOptions = new CosmosSerializationOptions
                    {
                        PropertyNamingPolicy = CosmosPropertyNamingPolicy.CamelCase,
                        IgnoreNullValues = true
                    }
                };
                return new CosmosClient(options.AccountEndpoint, options.AccountKey, clientOptions);
            });

            builder.Services.AddSingleton(provider => {
                var options = provider.GetRequiredService<IOptions<CosmosDbOptions>>().Value;
                var client = provider.GetRequiredService<CosmosClient>();
                tempLogger.LogInformation("Registering CosmosRepository<Image> with container: {Container}", options.Containers["Image"]);
                var container = client.GetContainer(options.DatabaseName, options.Containers["Image"]);
                return new CosmosRepository<Image>(container);
            });

            builder.Services.AddSingleton(provider => {
                var options = provider.GetRequiredService<IOptions<CosmosDbOptions>>().Value;
                var client = provider.GetRequiredService<CosmosClient>();
                tempLogger.LogInformation("Registering CosmosRepository<Chat> with container: {Container}", options.Containers["Chat"]);
                var container = client.GetContainer(options.DatabaseName, options.Containers["Chat"]);
                return new CosmosRepository<Chat>(container);
            });

            builder.Services.AddSingleton(provider => {
                var options = provider.GetRequiredService<IOptions<CosmosDbOptions>>().Value;
                var client = provider.GetRequiredService<CosmosClient>();
                tempLogger.LogInformation("Registering CosmosRepository<Prompt> with container: {Container}", options.Containers["Prompt"]);
                var container = client.GetContainer(options.DatabaseName, options.Containers["Prompt"]);
                return new CosmosRepository<Prompt>(container);
            });

            builder.Services.AddIdentityCore<ApplicationUser>(o =>
            {
                o.User.RequireUniqueEmail = false;
            })
            .AddSignInManager()
            .AddDefaultTokenProviders();
            builder.Services.AddScoped<IUserStore<ApplicationUser>, CosmosUserStore>();

            builder.Services.AddAuthorization();

            if (builder.Environment.IsDevelopment())
            {
                builder.Services.AddAuthentication(options =>
                {
                    options.DefaultAuthenticateScheme = IdentityConstants.ApplicationScheme;
                    options.DefaultSignInScheme = IdentityConstants.ApplicationScheme;
                    options.DefaultChallengeScheme = IdentityConstants.ApplicationScheme;
                    options.DefaultScheme = CookieAuthenticationDefaults.AuthenticationScheme;
                })
                .AddCookie(IdentityConstants.ApplicationScheme, o =>
                {
                    o.Cookie.Name = ".ManuAuth";
                    o.Cookie.SameSite = SameSiteMode.None;
                    o.Cookie.SecurePolicy = CookieSecurePolicy.Always;
                    o.Cookie.HttpOnly = true;
                    o.SlidingExpiration = true;
                    o.Events = new CookieAuthenticationEvents
                    {
                        OnRedirectToLogin = ctx => { ctx.Response.StatusCode = StatusCodes.Status401Unauthorized; return Task.CompletedTask; },
                        OnRedirectToAccessDenied = ctx => { ctx.Response.StatusCode = StatusCodes.Status403Forbidden; return Task.CompletedTask; }
                    };
                })
                .AddJwtBearer(JwtBearerDefaults.AuthenticationScheme, options =>
                {
                    var azureAdOptions = builder.Configuration.GetSection("AzureAd").Get<AzureAdOptions>();
                    var jwtKey = builder.Configuration["App:JwtKey"];
                    tempLogger.LogInformation("JwtBearer: AzureAdOptions.TenantId={TenantId}, ClientId={ClientId}, JwtKey set={JwtKeySet}", azureAdOptions?.TenantId, azureAdOptions?.ClientId, !string.IsNullOrEmpty(jwtKey));
                    options.TokenValidationParameters = new Microsoft.IdentityModel.Tokens.TokenValidationParameters
                    {
                        ValidateIssuer = true,
                        ValidIssuer = $"https://login.microsoftonline.com/{azureAdOptions.TenantId}/v2.0",
                        ValidateAudience = true,
                        ValidAudience = azureAdOptions.ClientId,
                        ValidateIssuerSigningKey = true,
                        IssuerSigningKey = new Microsoft.IdentityModel.Tokens.SymmetricSecurityKey(System.Text.Encoding.UTF8.GetBytes(jwtKey)),
                        ValidateLifetime = true
                    };
                    options.Events = new JwtBearerEvents
                    {
                        OnChallenge = context =>
                        {
                            context.HandleResponse();
                            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                            return Task.CompletedTask;
                        },
                        OnForbidden = context =>
                        {
                            context.Response.StatusCode = StatusCodes.Status403Forbidden;
                            return Task.CompletedTask;
                        }
                    };
                });
            }
            else
            {
                builder.Services.AddAuthentication(options =>
                {
                    options.DefaultAuthenticateScheme = IdentityConstants.ApplicationScheme;
                    options.DefaultSignInScheme = IdentityConstants.ApplicationScheme;
                    options.DefaultChallengeScheme = IdentityConstants.ApplicationScheme;
                    options.DefaultScheme = CookieAuthenticationDefaults.AuthenticationScheme;
                })
                .AddCookie(IdentityConstants.ApplicationScheme, o =>
                {
                    o.Cookie.Name = ".ManuAuth";
                    o.Cookie.SameSite = SameSiteMode.None;
                    o.Cookie.SecurePolicy = CookieSecurePolicy.Always;
                    o.Cookie.HttpOnly = true;
                    o.Events = new CookieAuthenticationEvents
                    {
                        OnRedirectToLogin = ctx => { ctx.Response.StatusCode = StatusCodes.Status401Unauthorized; return Task.CompletedTask; },
            // Build the app AFTER all service registrations
                    };
                });
            }

            builder.Services.AddScoped<IImageProcessingProvider, ImageSharpProcessingProvider>();
            builder.Services.AddScoped<IImageStorageProvider, AzureBlobImageStorageProvider>();
            builder.Services.AddScoped<IDalleProvider, DalleApiProvider>();
            builder.Services.AddScoped<UserImageBlobStorageProvider>();
            builder.Services.AddScoped<IImagePromptProvider, ImagePromptProvider>();
            builder.Services.AddAutoMapper(typeof(PromptMappingProfile));

            // Build the app AFTER all service registrations
            var app = builder.Build();
            tempLogger.LogInformation("WebApplication built. Environment: {Environment}", app.Environment.EnvironmentName);

            if (app.Environment.IsDevelopment())
            {
                app.MapOpenApi();
            }

            app.Use(async (ctx, next) =>
            {
                app.Logger.LogDebug("Request Host={Host} Scheme={Scheme} Path={Path}", ctx.Request.Host, ctx.Request.Scheme, ctx.Request.Path);
                await next();
            });

            app.UseForwardedHeaders();
            app.UseHttpsRedirection();
            app.UseCors(FrontendCorsPolicy);
            app.UseAuthentication();
            app.UseAuthorization();
            app.MapControllers();
            app.MapHealthChecks("/health");
            tempLogger.LogInformation("Startup pipeline complete. Running app...");
            app.Run();
        }
    }
}
