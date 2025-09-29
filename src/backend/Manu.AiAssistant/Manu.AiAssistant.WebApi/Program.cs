using Azure.Security.KeyVault.Secrets;
using Azure.Identity;
using Manu.AiAssistant.WebApi.Options;
using Manu.AiAssistant.WebApi.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore.SqlServer; // ensure extension method namespace

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

            builder.Services.AddCors(options =>
            {
                options.AddDefaultPolicy(policy =>
                {
                    policy.AllowAnyOrigin()
                          .AllowAnyMethod()
                          .AllowAnyHeader();
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

            builder.Services.AddDbContext<ApplicationDbContext>(options =>
                options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"), sql =>
                {
                    sql.EnableRetryOnFailure(5, TimeSpan.FromSeconds(10), null);
                }));

            builder.Services.AddIdentity<ApplicationUser, ApplicationRole>()
                .AddEntityFrameworkStores<ApplicationDbContext>()
                .AddDefaultTokenProviders();

            var app = builder.Build();

            // Ensure database / schema exists (development bootstrap). For production prefer migrations.
            using (var scope = app.Services.CreateScope())
            {
                var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                db.Database.EnsureCreated();
            }

            if (app.Environment.IsDevelopment())
            {
                app.MapOpenApi();
            }

            app.UseCors();
            app.UseHttpsRedirection();
            app.UseAuthentication();
            app.UseAuthorization();
            app.MapControllers();
            app.Run();
        }
    }
}
