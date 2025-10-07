import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { 
  Spinner, 
  Title1, 
  Body1, 
  Card 
} from '@fluentui/react-components';
import { setAuthExpiration } from '../../utils/authentication-helper';
import './AuthCallback.css';

const AuthCallback: React.FC = () => {
  const [code, setCode] = useState<string | null>(null);
  const navigate = useNavigate();
  const { type } = useParams();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const codeParam = params.get('code');

    if (codeParam) {
      setCode(codeParam);
    } else {
      // Redirect to error page if no authorization code is found
      const errorParams = new URLSearchParams({
        type: 'auth-error',
        message: 'Authorization code missing',
        details: 'The authentication process was interrupted or the authorization code was not received properly.'
      });
      
      navigate(`/error?${errorParams.toString()}`, { replace: true });
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
            
            // Set authentication expiration for fast client-side checks
            setAuthExpiration(); // Uses default 24 hours
            
            // Check if there's a return URL stored in sessionStorage
            const returnUrl = sessionStorage.getItem('returnUrl');
            if (returnUrl) {
              sessionStorage.removeItem('returnUrl');
              navigate(returnUrl);
            } else {
              // Default redirect to /image as requested
              navigate('/image');
            }
          }
        })
        .catch((err) => {
          console.error('Authentication error:', err);
          
          // Redirect to error page with authentication error details
          const errorParams = new URLSearchParams({
            type: 'auth-error',
            message: 'Authentication failed',
            details: err.response?.data?.message || err.message || 'Unknown authentication error occurred'
          });
          
          navigate(`/error?${errorParams.toString()}`, { replace: true });
        });
    }
  }, [code, type, navigate]);
  
  return (
    <div className="auth-callback-container">
      <Card className="auth-callback-card">
        <Spinner size="large" />
        <Title1>Processing Authentication...</Title1>
        <Body1>Please wait while we complete your login process.</Body1>
      </Card>
    </div>
  );
};

export default AuthCallback;
