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

            var keyVaultUrl = builder.Configuration["AzureKeyVault:Url"];
            if (!string.IsNullOrEmpty(keyVaultUrl))
            {
                var secretClient = new SecretClient(new Uri(keyVaultUrl), new DefaultAzureCredential());
                builder.Configuration.AddAzureKeyVault(secretClient, new CustomKeyVaultSecretManager());
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
            builder.Services.Configure<AzureAdOptions>(builder.Configuration.GetSection("AzureAd"));
            builder.Services.Configure<DalleOptions>(builder.Configuration.GetSection("Dalle"));
            builder.Services.Configure<GoogleOptions>(builder.Configuration.GetSection("Google"));
            builder.Services.Configure<AzureStorageOptions>(builder.Configuration.GetSection("AzureStorage"));
            builder.Services.Configure<AppOptions>(builder.Configuration.GetSection("App"));
            builder.Services.Configure<ChatOptions>(builder.Configuration.GetSection("Chat"));
            builder.Services.Configure<CosmosDbOptions>(builder.Configuration.GetSection("CosmosDb"));
            // Register PromptSettingsOptions from promptSettings.json
            builder.Services.Configure<PromptSettingsOptions>(builder.Configuration);

            // To use OpenAI (public API):
            // builder.Services.AddScoped<IChatProvider, OpenAiChatProvider>();

            // To use Azure OpenAI (default):
            builder.Services.AddScoped<IChatProvider, AzureOpenAiChatProvider>(); // Change to OpenAiChatProvider for OpenAI public API

            // Health checks
            builder.Services.AddHealthChecks();

            // Forwarded headers (Front Door / reverse proxy) so Request.Scheme becomes https
            builder.Services.Configure<ForwardedHeadersOptions>(options =>
            {
                options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto | ForwardedHeaders.XForwardedHost;
                options.KnownNetworks.Clear();
                options.KnownProxies.Clear();
            });

            // BlobServiceClient for image storage & data protection key ring
            builder.Services.AddSingleton(provider =>
            {
                var storageOptions = provider.GetRequiredService<Microsoft.Extensions.Options.IOptions<AzureStorageOptions>>().Value;
                return new BlobServiceClient(new Uri(storageOptions.AccountUrl), new DefaultAzureCredential());
            });

            // Data Protection: persist keys to blob AND optionally encrypt with Key Vault key
            var dataProtectionBuilder = builder.Services.AddDataProtection()
                .SetApplicationName("ManuAiAssistant")
                .PersistKeysToAzureBlobStorage(sp =>
                {
                    var blobService = sp.GetRequiredService<BlobServiceClient>();
                    // Use a dedicated container for data protection keys, not ImageC/ChatC
                    var container = blobService.GetBlobContainerClient("dataprotection");
                    container.CreateIfNotExists();
                    return container.GetBlobClient("keyring.xml");
                });
            
            if (!string.IsNullOrEmpty(keyVaultUrl))
            {
                var keyIdentifier = builder.Configuration["AzureKeyVault:DataProtectionKeyId"]; // key name or full identifier
                keyIdentifier = $"{keyVaultUrl}/keys/{keyIdentifier}";
                dataProtectionBuilder.ProtectKeysWithAzureKeyVault(new Uri(keyIdentifier), new DefaultAzureCredential());
            }

            // Cosmos Client singleton (shared)
            builder.Services.AddSingleton(provider => {
                var options = provider.GetRequiredService<IOptions<CosmosDbOptions>>().Value;
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

            // ImageGeneration repository
            builder.Services.AddSingleton(provider => {
                var options = provider.GetRequiredService<IOptions<CosmosDbOptions>>().Value;
                var client = provider.GetRequiredService<CosmosClient>();
                var container = client.GetContainer(options.DatabaseName, options.Containers["Image"]);
                return new CosmosRepository<Image>(container);
            });

            // Register Chat repository
            builder.Services.AddSingleton(provider => {
                var options = provider.GetRequiredService<IOptions<CosmosDbOptions>>().Value;
                var client = provider.GetRequiredService<CosmosClient>();
                var container = client.GetContainer(options.DatabaseName, options.Containers["Chat"]);
                return new CosmosRepository<Chat>(container);
            });

            // Register Prompt repository for Cosmos DB
            builder.Services.AddSingleton(provider => {
                var options = provider.GetRequiredService<IOptions<CosmosDbOptions>>().Value;
                var client = provider.GetRequiredService<CosmosClient>();
                var container = client.GetContainer(options.DatabaseName, options.Containers["Prompt"]);
                return new CosmosRepository<Prompt>(container);
            });

            // Identity (custom Cosmos user store). We only need basic user operations (external login).
            builder.Services.AddIdentityCore<ApplicationUser>(o =>
            {
                o.User.RequireUniqueEmail = false;
            })
            .AddSignInManager()
            .AddDefaultTokenProviders();
            builder.Services.AddScoped<IUserStore<ApplicationUser>, CosmosUserStore>();

            // Authorization services
            builder.Services.AddAuthorization();

            // Authentication & Cookie scheme (required for SignInManager)
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
                        OnRedirectToAccessDenied = ctx => { ctx.Response.StatusCode = StatusCodes.Status403Forbidden; return	Task.CompletedTask; }
                    };
                })
                .AddJwtBearer(JwtBearerDefaults.AuthenticationScheme, options =>
                {
                    var azureAdOptions = builder.Configuration.GetSection("AzureAd").Get<AzureAdOptions>();
                    var jwtKey = builder.Configuration["App:JwtKey"];
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
                    o.Cookie.Name = ".ManuAuth"; // custom cookie name
                    o.Cookie.SameSite = SameSiteMode.None;
                    o.Cookie.SecurePolicy = CookieSecurePolicy.Always;
                    o.Cookie.HttpOnly = true;
                    o.SlidingExpiration = true; // single authoritative setting
                    o.Events = new CookieAuthenticationEvents
                    {
                        OnRedirectToLogin = ctx => { ctx.Response.StatusCode = StatusCodes.Status401Unauthorized; return Task.CompletedTask; },
                        OnRedirectToAccessDenied = ctx => { ctx.Response.StatusCode = StatusCodes.Status403Forbidden; return Task.CompletedTask; }
                    };
                });
            }

            builder.Services.AddScoped<IImageProcessingProvider, ImageSharpProcessingProvider>();
            builder.Services.AddScoped<IImageStorageProvider, AzureBlobImageStorageProvider>();
            builder.Services.AddScoped<IDalleProvider, DalleApiProvider>();
            // Register UserImageBlobStorageProvider for user images
            builder.Services.AddScoped<UserImageBlobStorageProvider>();
            // Register IImagePromptProvider for DI
            builder.Services.AddScoped<IImagePromptProvider, ImagePromptProvider>();
            // Register AutoMapper and mapping profiles
            builder.Services.AddAutoMapper(typeof(PromptMappingProfile));

            // Build the app AFTER all service registrations
            var app = builder.Build();

            if (app.Environment.IsDevelopment())
            {
                app.MapOpenApi();
            }

            // Diagnostic request logging for scheme/host (early)
            app.Use(async (ctx, next) =>
            {
                app.Logger.LogDebug("Request Host={Host} Scheme={Scheme} Path={Path}", ctx.Request.Host, ctx.Request.Scheme, ctx.Request.Path);
                await next();
            });

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
