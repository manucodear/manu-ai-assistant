using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using Manu.AiAssistant.WebApi.Options;
using Microsoft.Extensions.Options;

namespace Manu.AiAssistant.WebApi.Identity
{
    public class ApplicationDbContext : IdentityDbContext<ApplicationUser, ApplicationRole, string>
    {
        private readonly CosmosDbOptions _cosmosOptions;

        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options, IOptions<CosmosDbOptions> cosmosOptions)
            : base(options)
        {
            _cosmosOptions = cosmosOptions.Value;
        }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);
            builder.HasDefaultContainer(_cosmosOptions.ContainerName);
            builder.Entity<ApplicationUser>()
                .Property(u => u.ConcurrencyStamp)
                .IsConcurrencyToken(false); // Remove as concurrency token for Cosmos DB
            builder.Entity<ApplicationUser>()
                .Property(u => u.ETag)
                .IsETagConcurrency();
            builder.Entity<ApplicationRole>()
                .Property(r => r.ConcurrencyStamp)
                .IsConcurrencyToken(false); // Remove as concurrency token for Cosmos DB
            builder.Entity<ApplicationRole>()
                .Property(r => r.ETag)
                .IsETagConcurrency();
            // Remove index on NormalizedName for Cosmos DB compatibility
            var role = builder.Entity<ApplicationRole>();
            var index = role.Metadata.GetIndexes().FirstOrDefault(i => i.Properties.Any(p => p.Name == "NormalizedName"));
            if (index != null)
            {
                role.Metadata.RemoveIndex(index);
            }
            // Remove index on NormalizedEmail for Cosmos DB compatibility
            var user = builder.Entity<ApplicationUser>();
            var emailIndex = user.Metadata.GetIndexes().FirstOrDefault(i => i.Properties.Any(p => p.Name == "NormalizedEmail"));
            if (emailIndex != null)
            {
                user.Metadata.RemoveIndex(emailIndex);
            }
            // Remove index on NormalizedUserName for Cosmos DB compatibility
            var userNameIndex = user.Metadata.GetIndexes().FirstOrDefault(i => i.Properties.Any(p => p.Name == "NormalizedUserName"));
            if (userNameIndex != null)
            {
                user.Metadata.RemoveIndex(userNameIndex);
            }
        }
    }
}