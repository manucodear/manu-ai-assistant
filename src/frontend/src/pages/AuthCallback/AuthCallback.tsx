import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const AuthCallback: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const navigate = useNavigate();
  const { type } = useParams();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const codeParam = params.get('code');

    if (codeParam) {
      setCode(codeParam);
    } else {
      setError('Authorization code not found');
    }
  }, []); // Add dependency array to prevent infinite loop

  useEffect(() => {
    if (code && type) {
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

      // Send the authorization code to the backend - authentication is handled via cookies
      axios
        .post(`${import.meta.env.VITE_BACKEND_URL}/authentication/${type}`, parameter, { withCredentials: true })
        .then((response) => {
          // API now returns 200 without body, authentication is stored in cookies
          if (response.status === 200) {
            console.log('Authentication successful');
            // Redirect to /image as requested
            navigate('/image');
          }
        })
        .catch((err) => {
          setError('Authentication failed');
          console.error('Authentication error:', err);
        });
    }
  }, [code, type, navigate]);
  
  return (
    <div>
      <h1>Processing Authentication...</h1>
      {error && <p>Error: {error}</p>}
    </div>
  );
};

export default AuthCallback;
