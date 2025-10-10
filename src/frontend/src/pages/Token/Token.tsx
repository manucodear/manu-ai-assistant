import './Token.css';
import { useEffect, useState } from 'react';
import { Button, Input, Spinner } from '@fluentui/react-components';

const Token: React.FC = () => {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchToken = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL ?? ''}/token`, {
        method: 'GET',
        credentials: 'include',
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `Request failed: ${res.status}`);
      }
      const data = await res.json();
      // assume backend returns { token: '...' } or a plain string
      const t = data?.token ?? (typeof data === 'string' ? data : null);
      setToken(t);
    } catch (err: any) {
      setError(err?.message ?? 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // fetch token on mount
    fetchToken();
  }, []);

  const copyToClipboard = async () => {
    if (!token) return;
    await navigator.clipboard.writeText(token);
  };

  return (
    <div className="token-page">
      <h1>Token Page</h1>

      {loading && (
        <div className="token-loading"><Spinner size="small" /> Fetching token...</div>
      )}

      {error && (
        <div className="token-error">Error: {error}</div>
      )}

      {token ? (
        <div className="token-card">
          <Input value={token} readOnly appearance="outline" className="token-input" />
          <div className="token-actions">
            <Button onClick={copyToClipboard}>Copy</Button>
            <Button appearance="secondary" onClick={fetchToken}>Refresh</Button>
          </div>
        </div>
      ) : (
        !loading && !error && (
          <div>
            <p>No token found.</p>
            <Button appearance="primary" onClick={fetchToken}>Fetch Token</Button>
          </div>
        )
      )}
    </div>
  );
};

export default Token;
