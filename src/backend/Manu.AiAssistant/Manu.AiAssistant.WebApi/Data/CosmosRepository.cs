using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Azure.Cosmos;
using Manu.AiAssistant.WebApi.Models.Entities;

namespace Manu.AiAssistant.WebApi.Data
{
    public class CosmosRepository<TEntity> where TEntity : CosmosEntityBase
    {
        private readonly Container _container;

        public CosmosRepository(Container container)
        {
            _container = container;
        }

        public async Task<TEntity> GetAsync(string id, CancellationToken cancellationToken = default)
        {
            var response = await _container.ReadItemAsync<TEntity>(id, new PartitionKey(id), cancellationToken: cancellationToken);
            return response.Resource;
        }

        public async Task<TEntity> AddAsync(TEntity entity, CancellationToken cancellationToken = default)
        {
            var response = await _container.CreateItemAsync(entity, new PartitionKey(entity.Id), cancellationToken: cancellationToken);
            return response.Resource;
        }

        public async Task<TEntity> UpdateAsync(TEntity entity, CancellationToken cancellationToken = default)
        {
            var response = await _container.UpsertItemAsync(entity, new PartitionKey(entity.Id), cancellationToken: cancellationToken);
            return response.Resource;
        }

        public async Task DeleteAsync(string id, CancellationToken cancellationToken = default)
        {
            await _container.DeleteItemAsync<TEntity>(id, new PartitionKey(id), cancellationToken: cancellationToken);
        }

        public async Task<IEnumerable<TEntity>> GetAllAsync(CancellationToken cancellationToken = default)
        {
            var query = _container.GetItemQueryIterator<TEntity>();
            var results = new List<TEntity>();
            while (query.HasMoreResults)
            {
                var response = await query.ReadNextAsync(cancellationToken);
                results.AddRange(response);
            }
            return results;
        }
    }
}
