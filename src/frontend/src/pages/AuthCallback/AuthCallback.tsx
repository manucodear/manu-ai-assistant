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
        .post(`http://localhost:4000/auth/callback/${type}`, parameter)
        .then((response) => {
          console.log('response.data', response.data);
          const { access_token, refresh_token, expires_in } = response.data;
          if (access_token) {
            // Store the access token in localStorage (or sessionStorage)
            saveAuthenticationData(type as string, access_token, refresh_token, expires_in);
            console.log('Access token stored:', access_token);
            console.log('Refresh token stored:', refresh_token);
            console.log('Expiration:', expires_in);

            // Redirect the user to another page (e.g., Dashboard, Home, etc.)
            navigate('/');  // Navigate to the dashboard or any other route
            // Alternatively, you can use window.location.replace('/dashboard') if you're not using React Router
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
