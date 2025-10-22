import './Home.css';
import { LoginButton, LoginButtonType } from '../../components/LoginButton';
import { Link } from 'react-router-dom';
import {
  Button
} from '@mui/material';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { Person } from '@mui/icons-material';

const Home: React.FC = () => {
  const isGoogleAuthEnabled = import.meta.env.VITE_GOOGLE_AUTH_ENABLED === 'true';
  const privacyUrl = import.meta.env.VITE_PRIVACY_URL || '';
  const termsUrl = import.meta.env.VITE_TERMS_URL || '';
  const appVersion = import.meta.env.VITE_VERSION || '';

  return (
    <div className="home-container">
      {import.meta.env.DEV && (
        <div className="home-header">
          <Link to="/login" style={{ textDecoration: 'none' }}>
            <Button variant="contained" color="primary" startIcon={<Person />}>
              Login
            </Button>
          </Link>
        </div>
      )}
      {import.meta.env.DEV && (
        <div style={{ width: '100%', maxWidth: 980, marginTop: 8 }}>
          <pre style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, whiteSpace: 'pre-wrap' }}>
            {JSON.stringify(Object.fromEntries(Object.entries(import.meta.env).filter(([k]) => k.startsWith('VITE_'))), null, 2)}
          </pre>
        </div>
      )}
      <div className="home-body">
        <Paper className="home-card" elevation={3}>
          <div className="home-card-header">
            <Typography variant="h4">Welcome to My AI Assistant</Typography>
          </div>
        </Paper>
        <div className="home-login-buttons">
          <LoginButton type={LoginButtonType.Microsoft} />
          {isGoogleAuthEnabled && <LoginButton type={LoginButtonType.Google} />}
        </div>

        {import.meta.env.DEV && (
          <div className="home-button-group">
            <Link to="/showcase" style={{ textDecoration: 'none' }}>
              <Button
                variant="outlined"
              >
                View Component Showcase
              </Button>
            </Link>
            <Link to="/material-showcase" style={{ textDecoration: 'none' }}>
              <Button
                variant="outlined"
                sx={{ ml: 1 }}
              >
                View Material Showcase
              </Button>
            </Link>
            <Link to="/responsive" style={{ textDecoration: 'none' }}>
              <Button
                variant="outlined"
              >
                📱 Mobile Demo
              </Button>
            </Link>
            <Link to="/test-errors" style={{ textDecoration: 'none' }}>
              <Button
                variant="text"
              >
                Test Error Pages
              </Button>
            </Link>
          </div>
        )}
        <div className="legal-links">
          {privacyUrl ? (
            <a href={privacyUrl} target="_blank" rel="noopener noreferrer" className="legal-link">
              Privacy Policy
            </a>
          ) : (
            <Link to="/privacy" className="legal-link">
              Privacy Policy
            </Link>
          )}

          {termsUrl ? (
            <a href={termsUrl} target="_blank" rel="noopener noreferrer" className="legal-link">
              Terms of Service
            </a>
          ) : (
            <Link to="/terms" className="legal-link">
              Terms of Service
            </Link>
          )}
        </div>
        {appVersion && (
          <div className="app-version" aria-hidden>
            v{appVersion}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
