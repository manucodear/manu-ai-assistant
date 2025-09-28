using Azure.Security.KeyVault.Secrets;
using Azure.Identity;
using Manu.AiAssistant.WebApi.Options;
using Manu.AiAssistant.WebApi.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using Azure.Extensions.AspNetCore.Configuration.Secrets;

namespace Manu.AiAssistant.WebApi
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            // Add Azure Key Vault as a configuration provider if set
            var keyVaultUrl = builder.Configuration["AzureKeyVault:Url"];
            if (!string.IsNullOrEmpty(keyVaultUrl) && !builder.Environment.IsDevelopment())
            {
                builder.Configuration.AddAzureKeyVault(new Uri(keyVaultUrl), new DefaultAzureCredential());
            }

            // Add services to the container.
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
                return new SecretClient(new Uri(vaultUrl), new DefaultAzureCredential());
            });

            builder.Services.Configure<AzureAdOptions>(builder.Configuration.GetSection("AzureAd"));

            // Use CosmosDb config from configuration (overridden by Key Vault in production)
            builder.Services.AddDbContext<ApplicationDbContext>(options =>
                options.UseCosmos(
                    builder.Configuration["CosmosDb:AccountEndpoint"],
                    builder.Configuration["CosmosDb:AccountKey"],
                    builder.Configuration["CosmosDb:DatabaseName"]));

            builder.Services.AddIdentity<ApplicationUser, IdentityRole>()
                .AddEntityFrameworkStores<ApplicationDbContext>()
                .AddDefaultTokenProviders();

            var app = builder.Build();

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
