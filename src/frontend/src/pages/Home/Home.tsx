import './Home.css';
import { Link, useNavigate } from 'react-router-dom';
import {
  Button,
  Box
} from '@mui/material';
import { isAuthenticationValid } from '../../utils/authentication-helper';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const privacyUrl = import.meta.env.VITE_PRIVACY_URL || '';
  const termsUrl = import.meta.env.VITE_TERMS_URL || '';
  const appVersion = import.meta.env.VITE_VERSION || '';

  const handleStart = () => {
    if (isAuthenticationValid()) {
      // User is authenticated, redirect to image generation page
      navigate('/create');
    } else {
      // User is not authenticated, redirect to login page
      navigate('/login');
    }
  };

  return (
    <div className="home-container">
      <div className="home-body">
        <Paper className="home-card" elevation={3}>
          <div className="home-card-header">
            <Typography 
              variant="h4" 
              gutterBottom
              className="home-main-title"
            >
              AI Image Generator
            </Typography>
            <Typography 
              variant="h6" 
              color="text.secondary" 
              className="home-subtitle"
            >
              Create stunning images with AI-powered prompts
            </Typography>
            
            {/* Mobile-optimized features grid */}
            <Box className="home-features-grid">
              <Box className="feature-card home-feature-card">
                <Typography 
                  variant="h6" 
                  className="home-feature-title"
                >
                  🎨 Smart Prompts
                </Typography>
                <Typography 
                  variant="body2" 
                  className="home-feature-description"
                >
                  Transform ideas into optimized prompts
                </Typography>
              </Box>
              
              <Box className="feature-card home-feature-card">
                <Typography 
                  variant="h6" 
                  className="home-feature-title"
                >
                  🖼️ AI Generation
                </Typography>
                <Typography 
                  variant="body2" 
                  className="home-feature-description"
                >
                  High-quality images using advanced AI
                </Typography>
              </Box>
              
              <Box className="feature-card home-feature-card home-feature-card-full">
                <Typography 
                  variant="h6" 
                  className="home-feature-title"
                >
                  📱 Personal Gallery
                </Typography>
                <Typography 
                  variant="body2" 
                  className="home-feature-description"
                >
                  Save and organize images securely
                </Typography>
              </Box>
            </Box>

            {/* Quick benefits row - visible on mobile */}
            <Box className="home-benefits-row">
              <Box className="home-benefit-badge">
                <Typography variant="body2">
                  ⚡ Fast
                </Typography>
              </Box>
              <Box className="home-benefit-badge">
                <Typography variant="body2">
                  🎯 High Quality
                </Typography>
              </Box>
              <Box className="home-benefit-badge">
                <Typography variant="body2">
                  🔒 Secure
                </Typography>
              </Box>
            </Box>
          </div>
        </Paper>
        
        <Box className="home-start-button-container">
          <Button
            variant="contained"
            size="medium"
            onClick={handleStart}
            className="home-start-button"
          >
            🚀 Start Creating
          </Button>
        </Box>
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