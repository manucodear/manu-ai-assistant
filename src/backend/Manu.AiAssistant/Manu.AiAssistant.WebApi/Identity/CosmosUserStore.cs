using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;
using Microsoft.Azure.Cosmos;
using System.Linq;
using System.Collections.Generic;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Manu.AiAssistant.WebApi.Options;

namespace Manu.AiAssistant.WebApi.Identity
{
    // Minimal Cosmos implementation for required user operations (Create, Update, FindByName)
    public class CosmosUserStore : IUserStore<ApplicationUser>, IUserPasswordStore<ApplicationUser>
    {
        private readonly Container _container;
        private readonly ILogger<CosmosUserStore> _logger;
        private readonly string _dbName;
        private readonly string _containerName = "AspNetUsers";

        public CosmosUserStore(CosmosClient client, IOptions<CosmosDbOptions> options, ILogger<CosmosUserStore> logger)
        {
            _logger = logger;
            var opts = options.Value;
            _dbName = opts.IdentityDatabaseName ?? opts.DatabaseName;
            _container = client.GetContainer(_dbName, _containerName);
            _logger.LogInformation("CosmosUserStore initialized. Database={Database} Container={Container}", _dbName, _containerName);
        }

        public void Dispose() { }

        public Task<string> GetUserIdAsync(ApplicationUser user, CancellationToken cancellationToken) => Task.FromResult(user.Id);
        public Task<string> GetUserNameAsync(ApplicationUser user, CancellationToken cancellationToken) => Task.FromResult(user.UserName ?? string.Empty);
        public Task SetUserNameAsync(ApplicationUser user, string userName, CancellationToken cancellationToken) { user.UserName = userName; return Task.CompletedTask; }
        public Task<string?> GetNormalizedUserNameAsync(ApplicationUser user, CancellationToken cancellationToken) => Task.FromResult(user.NormalizedUserName);
        public Task SetNormalizedUserNameAsync(ApplicationUser user, string? normalizedName, CancellationToken cancellationToken) { user.NormalizedUserName = normalizedName; return Task.CompletedTask; }

        public async Task<IdentityResult> CreateAsync(ApplicationUser user, CancellationToken cancellationToken)
        {
            try
            {
                user.Id ??= Guid.NewGuid().ToString();
                _logger.LogDebug("Creating user in Cosmos. Id={Id} UserName={UserName}", user.Id, user.UserName);
                await _container.CreateItemAsync(user, new PartitionKey(user.Id), cancellationToken: cancellationToken);
                _logger.LogInformation("User created in Cosmos. Id={Id} UserName={UserName}", user.Id, user.UserName);
                return IdentityResult.Success;
            }
            catch (CosmosException ce)
            {
                _logger.LogError(ce, "CosmosException creating user. Status={Status} Id={Id} UserName={UserName}", ce.StatusCode, user.Id, user.UserName);
                return IdentityResult.Failed(new IdentityError { Code = "CosmosCreateFailed", Description = ce.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected exception creating user. Id={Id} UserName={UserName}", user.Id, user.UserName);
                return IdentityResult.Failed(new IdentityError { Code = "CreateFailed", Description = ex.Message });
            }
        }

        public async Task<IdentityResult> UpdateAsync(ApplicationUser user, CancellationToken cancellationToken)
        {
            try
            {
                _logger.LogDebug("Updating user in Cosmos. Id={Id} UserName={UserName}", user.Id, user.UserName);
                await _container.UpsertItemAsync(user, new PartitionKey(user.Id), cancellationToken: cancellationToken);
                _logger.LogInformation("User updated in Cosmos. Id={Id} UserName={UserName}", user.Id, user.UserName);
                return IdentityResult.Success;
            }
            catch (CosmosException ce)
            {
                _logger.LogError(ce, "CosmosException updating user. Status={Status} Id={Id} UserName={UserName}", ce.StatusCode, user.Id, user.UserName);
                return IdentityResult.Failed(new IdentityError { Code = "CosmosUpdateFailed", Description = ce.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected exception updating user. Id={Id} UserName={UserName}", user.Id, user.UserName);
                return IdentityResult.Failed(new IdentityError { Code = "UpdateFailed", Description = ex.Message });
            }
        }

        public async Task<IdentityResult> DeleteAsync(ApplicationUser user, CancellationToken cancellationToken)
        {
            try
            {
                _logger.LogDebug("Deleting user in Cosmos. Id={Id} UserName={UserName}", user.Id, user.UserName);
                await _container.DeleteItemAsync<ApplicationUser>(user.Id, new PartitionKey(user.Id), cancellationToken: cancellationToken);
                _logger.LogInformation("User deleted in Cosmos. Id={Id} UserName={UserName}", user.Id, user.UserName);
                return IdentityResult.Success;
            }
            catch (CosmosException ce) when (ce.StatusCode == System.Net.HttpStatusCode.NotFound)
            {
                _logger.LogWarning("Delete attempted for non-existent user. Id={Id}", user.Id);
                return IdentityResult.Success; // treat as idempotent
            }
            catch (CosmosException ce)
            {
                _logger.LogError(ce, "CosmosException deleting user. Status={Status} Id={Id} UserName={UserName}", ce.StatusCode, user.Id, user.UserName);
                return IdentityResult.Failed(new IdentityError { Code = "CosmosDeleteFailed", Description = ce.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected exception deleting user. Id={Id} UserName={UserName}", user.Id, user.UserName);
                return IdentityResult.Failed(new IdentityError { Code = "DeleteFailed", Description = ex.Message });
            }
        }

        public async Task<ApplicationUser?> FindByIdAsync(string userId, CancellationToken cancellationToken)
        {
            try
            {
                var resp = await _container.ReadItemAsync<ApplicationUser>(userId, new PartitionKey(userId), cancellationToken: cancellationToken);
                return resp.Resource;
            }
            catch (CosmosException ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
            {
                _logger.LogDebug("FindById user not found. Id={Id}", userId);
                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected exception in FindById. Id={Id}", userId);
                throw;
            }
        }

        public async Task<ApplicationUser?> FindByNameAsync(string normalizedUserName, CancellationToken cancellationToken)
        {
            try
            {
                _logger.LogDebug("Querying user by normalizedUserName={NormalizedUserName}", normalizedUserName);
                var query = new QueryDefinition("SELECT * FROM c WHERE c.normalizedUserName = @n")
                    .WithParameter("@n", normalizedUserName);
                var iterator = _container.GetItemQueryIterator<ApplicationUser>(query, requestOptions: new QueryRequestOptions { PartitionKey = null });
                while (iterator.HasMoreResults)
                {
                    var page = await iterator.ReadNextAsync(cancellationToken);
                    var match = page.FirstOrDefault();
                    if (match != null)
                    {
                        _logger.LogDebug("Found user by normalizedUserName={NormalizedUserName} Id={Id}", normalizedUserName, match.Id);
                        return match;
                    }
                }
                _logger.LogDebug("No user found for normalizedUserName={NormalizedUserName}", normalizedUserName);
                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected exception in FindByName. NormalizedUserName={NormalizedUserName}", normalizedUserName);
                throw;
            }
        }

        // Password store
        public Task SetPasswordHashAsync(ApplicationUser user, string? passwordHash, CancellationToken cancellationToken) { user.PasswordHash = passwordHash; return Task.CompletedTask; }
        public Task<string?> GetPasswordHashAsync(ApplicationUser user, CancellationToken cancellationToken) => Task.FromResult(user.PasswordHash);
        public Task<bool> HasPasswordAsync(ApplicationUser user, CancellationToken cancellationToken) => Task.FromResult(!string.IsNullOrEmpty(user.PasswordHash));
    }
}
