using Azure.Extensions.AspNetCore.Configuration.Secrets;
using Azure.Security.KeyVault.Secrets;
using Microsoft.Extensions.Configuration;

namespace Manu.AiAssistant.WebApi.KeyVault
{
    // Maps existing flat secret names to the configuration keys used by the app.
    // Also preserves hierarchical mapping via "--" -> ":" when present.
    public class CustomKeyVaultSecretManager : KeyVaultSecretManager
    {
        public override bool Load(SecretProperties secret)
        {
            // Load all secrets; filter here if needed
            return true;
        }

        public override string GetKey(KeyVaultSecret secret)
        {
            var name = secret.Name;

            // If the secret already uses hierarchical naming (Section--Key), keep default behavior
            if (name.Contains("--"))
            {
                return name.Replace("--", ConfigurationPath.KeyDelimiter);
            }

            // Known flat names -> map to hierarchical configuration keys
            // Azure AD
            if (string.Equals(name, "client-id", StringComparison.OrdinalIgnoreCase))
                return $"AzureAd{ConfigurationPath.KeyDelimiter}ClientId";
            if (string.Equals(name, "tenant-id", StringComparison.OrdinalIgnoreCase))
                return $"AzureAd{ConfigurationPath.KeyDelimiter}TenantId";
            if (string.Equals(name, "client-secret", StringComparison.OrdinalIgnoreCase))
                return $"AzureAd{ConfigurationPath.KeyDelimiter}ClientSecret";
            if (string.Equals(name, "redirect-uri", StringComparison.OrdinalIgnoreCase))
                return $"AzureAd{ConfigurationPath.KeyDelimiter}RedirectUri";

            // DALL·E
            if (string.Equals(name, "dalle-api-key", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(name, "dall-e-key", StringComparison.OrdinalIgnoreCase))
                return $"Dalle{ConfigurationPath.KeyDelimiter}ApiKey";
            if (string.Equals(name, "dalle-endpoint", StringComparison.OrdinalIgnoreCase))
                return $"Dalle{ConfigurationPath.KeyDelimiter}Endpoint";

            // SQL connection string
            if (string.Equals(name, "sql-connection-string", StringComparison.OrdinalIgnoreCase))
                return $"ConnectionStrings{ConfigurationPath.KeyDelimiter}DefaultConnection";

            // Storage account url
            if (string.Equals(name, "storage-account-url", StringComparison.OrdinalIgnoreCase))
                return $"AzureStorage{ConfigurationPath.KeyDelimiter}AccountUrl";

            // Otherwise expose as a root key (name as-is)
            return name;
        }
    }
}
