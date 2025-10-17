import { LoginButtonProps } from './LoginButton.types';
import { LoginButtonType } from './LoginButton.enums';
import { generatePKCECode, generateRandomState } from '../../utils/random-helper';
import Button from '@mui/material/Button';
import PersonIcon from '@mui/icons-material/Person';
import WidgetsIcon from '@mui/icons-material/Widgets';
import CloudIcon from '@mui/icons-material/Cloud';
import PublicIcon from '@mui/icons-material/Public';
import styles from './LoginButton.module.css';

const getAuthenticationUri = async (type:LoginButtonType): Promise<string> => {
  let authUrl: string = '';

  switch (type) {
    case LoginButtonType.X: {
      const clientId = import.meta.env.VITE_X_CLIENT_ID;
      const redirectUri = `${import.meta.env.VITE_REDIRECT_URI}/${LoginButtonType.X}`;
      const scope = encodeURIComponent(import.meta.env.VITE_X_SCOPE);
      const { codeVerifier, codeChallenge, state } = await generatePKCECode();
      const authenticationUriX = import.meta.env.VITE_X_AUTHENTICATION_URI;
      sessionStorage.setItem('codeVerifier', codeVerifier);
      // Construct the authorization URL
      authUrl = `${authenticationUriX}?&response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&state=${state}&code_challenge=${codeChallenge}&code_challenge_method=S256`;
      break;
    }
    case LoginButtonType.Reddit: {
      const clientId = import.meta.env.VITE_REDDIT_CLIENT_ID;
      const redirectUri = `${import.meta.env.VITE_REDIRECT_URI}/${LoginButtonType.Reddit}`;
      const scope = encodeURIComponent(import.meta.env.VITE_REDDIT_SCOPE);
      const stateReddit = await generateRandomState();
      const authenticationUriReddit = import.meta.env.VITE_REDDIT_AUTHENTICATION_URI;
      // Construct the authorization URL
      authUrl = `${authenticationUriReddit}?&response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&state=${stateReddit}&duration=permanent`;
      break;
    }
    case LoginButtonType.Microsoft: {
      const clientId = import.meta.env.VITE_MS_CLIENT_ID;
      const redirectUri = `${import.meta.env.VITE_REDIRECT_URI}/${LoginButtonType.Microsoft}`;
      const scope = encodeURIComponent(import.meta.env.VITE_MS_SCOPE);
      const authenticationUriMs = import.meta.env.VITE_MS_AUTHENTICATION_URI;
      // Construct the authorization URL
      authUrl = `${authenticationUriMs}?&response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&response_mode=query&duration=permanent`;
      break;
    }
    case LoginButtonType.Google: {
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      const redirectUri = `${import.meta.env.VITE_REDIRECT_URI}/${LoginButtonType.Google}`;
      const scope = encodeURIComponent(import.meta.env.VITE_GOOGLE_SCOPE);
      const state = await generateRandomState();
      const authenticationUriGoogle = import.meta.env.VITE_GOOGLE_AUTHENTICATION_URI;
      // Store state for validation
      sessionStorage.setItem('expectedOauthState', state);
      // Construct the authorization URL
      authUrl = `${authenticationUriGoogle}?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&state=${state}&access_type=offline&prompt=consent`;
      break;
    }
  }
  return authUrl;
}

const LoginButton: React.FC<LoginButtonProps> = ({ type, text }) => {
  const onButtonClick = async (type:LoginButtonType) => {
    // Store return URL if provided in query params
    const urlParams = new URLSearchParams(window.location.search);
    const returnUrl = urlParams.get('returnUrl');
    if (returnUrl) {
      sessionStorage.setItem('returnUrl', returnUrl);
    }
    
    const authUrl = await getAuthenticationUri(type);
    window.location.href = authUrl;
  }

  const buttonText = text ? text : `Login with ${type}`;
  
  const getIcon = () => {
    switch (type) {
      case LoginButtonType.Microsoft:
        return <CloudIcon />;
      case LoginButtonType.X:
        return <WidgetsIcon />;
      case LoginButtonType.Reddit:
        return <PersonIcon />;
      case LoginButtonType.Google:
        return <PublicIcon />;
      default:
        return <PersonIcon />;
    }
  };

  const getVariant = () => {
    switch (type) {
      case LoginButtonType.Microsoft:
        return 'contained' as const;
      case LoginButtonType.X:
        return 'outlined' as const;
      case LoginButtonType.Reddit:
        return 'outlined' as const;
      case LoginButtonType.Google:
        return 'contained' as const;
      default:
        return 'contained' as const;
    }
  };

  return (
    <Button
      onClick={() => onButtonClick(type)}
      variant={getVariant()}
      startIcon={getIcon()}
      className={styles.loginButton}
    >
      {buttonText}
    </Button>
  );
};

export default LoginButton;
