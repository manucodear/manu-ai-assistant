import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { saveAuthenticationData } from "../../utils/authentication-helper";

const AuthCallback: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const navigate  = useNavigate(); // Create a history object for navigation
  const { type } = useParams();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const codeParam = params.get('code');

    if (codeParam) {
      setCode(codeParam); // Store the code in state
    } else {
      setError('Authorization code not found');
    }
  });

  useEffect(() => {
    console.log(code);
    if (code) {
      let parameter = {};
      switch (type) {
        case 'X': {
          const codeVerifier = sessionStorage.getItem('codeVerifier');
          parameter = {
            code,
            codeVerifier
          };
          break;
        }
        case 'Reddit': {
          parameter = { code };
          break;
        }
        case 'Microsoft': {
          parameter = { code };
          break;
        }
      }
      // Send the authorization code and code_verifier to the backend to get the access token
      axios
        .post(`${import.meta.env.VITE_BACKEND_URL}/api/authentication/${type}`, parameter, {withCredentials: true})
        .then(async (response) => {
          console.log('response.data', response.data);
          const { access_token, refresh_token, expires_in } = response.data;
          if (access_token) {
            // If the backend still returns a refresh_token, send it back to the backend for secure storage
            // (HttpOnly cookie or server-side DB) and do not persist it on the client.
            if (refresh_token) {
              try {
                await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/authentication/store-refresh`, {
                  type,
                  refreshToken: refresh_token
                }, { withCredentials: true });
                console.log('Refresh token forwarded to backend for secure storage.');
              } catch (err) {
                console.warn('Failed to store refresh token on server:', err);
              }
            }

            // Save only the access token and expiry locally.
            saveAuthenticationData(type as string, access_token, undefined, expires_in);
            console.log('Access token stored:', access_token);
            console.log('Expiration:', expires_in);

            // Redirect the user to another page (e.g., Dashboard, Home, etc.)
            navigate('/Image');  // Navigate to the dashboard or any other route
          }
        })
        .catch((err) => {
          setError('Authentication failed');
          console.error(err);
        });
    } else {
      setError('Authorization code or code_verifier not found');
    }
  }, [code, type]);
  
  return (
    <div>
      <h1>AuthCallback Page</h1>
      {error && <p>Error: {error}</p>}
    </div>
  );
};

export default AuthCallback;
