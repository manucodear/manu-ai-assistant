using Azure.Security.KeyVault.Secrets;
using Azure.Identity;
using Manu.AiAssistant.WebApi.Options;
using Manu.AiAssistant.WebApi.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using Azure.Extensions.AspNetCore.Configuration.Secrets;
using Manu.AiAssistant.WebApi.KeyVault;

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
                // Load configuration from Azure Key Vault using a custom mapper for flat secret names
                var secretClient = new SecretClient(new Uri(keyVaultUrl), new DefaultAzureCredential());
                builder.Configuration.AddAzureKeyVault(secretClient, new CustomKeyVaultSecretManager());
            }

            builder.Services.AddControllers();
            builder.Services.AddOpenApi();

            // CORS policy for frontend using cookies (credentials)
            const string FrontendCorsPolicy = "Frontend";
            builder.Services.AddCors(options =>
            {
                options.AddPolicy(FrontendCorsPolicy, policy =>
                {
                    policy.WithOrigins("https://localhost:3001") // use https to allow Secure cookies
                          .AllowAnyHeader()
                          .AllowAnyMethod()
                          .AllowCredentials();
                });
            });

            builder.Services.AddHttpClient();

            if (!string.IsNullOrWhiteSpace(keyVaultUrl))
            {
                builder.Services.AddSingleton(_ => new SecretClient(new Uri(keyVaultUrl), new DefaultAzureCredential()));
            }

            builder.Services.Configure<AzureAdOptions>(builder.Configuration.GetSection("AzureAd"));
            // Added Dalle options registration
            builder.Services.Configure<DalleOptions>(builder.Configuration.GetSection("Dalle"));

            builder.Services.AddDbContext<ApplicationDbContext>(options =>
                options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"), sql =>
                {
                    sql.EnableRetryOnFailure(5, TimeSpan.FromSeconds(10), null);
                }));

            builder.Services.AddIdentity<ApplicationUser, ApplicationRole>()
                .AddEntityFrameworkStores<ApplicationDbContext>()
                .AddDefaultTokenProviders();

            // Cookie configuration for cross-site (SameSite=None requires Secure)
            builder.Services.ConfigureApplicationCookie(o =>
            {
                o.Cookie.SameSite = SameSiteMode.None;
                o.Cookie.SecurePolicy = CookieSecurePolicy.Always;
                o.Cookie.HttpOnly = true;
            });

            builder.Services.Configure<AzureStorageOptions>(builder.Configuration.GetSection("AzureStorage"));
            builder.Services.AddSingleton(x =>
            {
                var opts = x.GetRequiredService<Microsoft.Extensions.Options.IOptions<AzureStorageOptions>>().Value;
                if (string.IsNullOrWhiteSpace(opts.AccountUrl))
                {
                    throw new InvalidOperationException("AzureStorage:AccountUrl must be configured");
                }
                return new Azure.Storage.Blobs.BlobServiceClient(new Uri(opts.AccountUrl), new DefaultAzureCredential());
            });

            // Add Application Insights telemetry only in non-development environments
            if (!builder.Environment.IsDevelopment())
            {
                builder.Services.AddApplicationInsightsTelemetry();
            }

            builder.Services.AddHealthChecks();

            var app = builder.Build();

            if (app.Environment.IsDevelopment())
            {
                // Apply migrations automatically in development
                using var scope = app.Services.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                db.Database.Migrate();
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
