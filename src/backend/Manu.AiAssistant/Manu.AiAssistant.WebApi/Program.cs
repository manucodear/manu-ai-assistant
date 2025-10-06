using Azure.Security.KeyVault.Secrets;
using Azure.Identity;
using Manu.AiAssistant.WebApi.Options;
using Manu.AiAssistant.WebApi.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;

namespace Manu.AiAssistant.WebApi
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            var keyVaultUrl = builder.Configuration["AzureKeyVault:Url"];
            if (!string.IsNullOrEmpty(keyVaultUrl) && !builder.Environment.IsDevelopment())
            {
                builder.Configuration.AddAzureKeyVault(new Uri(keyVaultUrl), new DefaultAzureCredential());
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

            builder.Services.AddSingleton(x =>
            {
                var configuration = x.GetRequiredService<IConfiguration>();
                var vaultUrl = configuration["AzureKeyVault:Url"];
                return new SecretClient(new Uri(vaultUrl!), new DefaultAzureCredential());
            });

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
                var options = x.GetRequiredService<Microsoft.Extensions.Options.IOptions<AzureStorageOptions>>().Value;
                return new Azure.Storage.Blobs.BlobServiceClient(options.ConnectionString);
            });

            // Add Application Insights telemetry only in non-development environments
            if (!builder.Environment.IsDevelopment())
            {
                builder.Services.AddApplicationInsightsTelemetry();
            }

            builder.Services.AddHealthChecks();

            var app = builder.Build();

            // Log the database connection string at startup for verification
            var logger = app.Services.GetRequiredService<ILogger<Program>>();
            logger.LogInformation("Database connection string: {ConnectionString}", builder.Configuration.GetConnectionString("DefaultConnection"));

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
