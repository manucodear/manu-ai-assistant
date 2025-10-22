import './Home.css';
import { LoginButton, LoginButtonType } from '../../components/LoginButton';
import { Link } from 'react-router-dom';
import {
  Button,
  Box
} from '@mui/material';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { Person } from '@mui/icons-material';

const Home: React.FC = () => {
  const isGoogleAuthEnabled = import.meta.env.VITE_GOOGLE_AUTH_ENABLED === 'true';

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
      <div className="home-body">
        <Paper className="home-card" elevation={3}>
          <div className="home-card-header">
            <Typography 
              variant="h4" 
              gutterBottom
              sx={{ 
                fontSize: { xs: '1.75rem', sm: '2rem', md: '2.125rem' },
                textAlign: 'center'
              }}
            >
              AI Image Generation Assistant
            </Typography>
            <Typography 
              variant="h6" 
              color="text.secondary" 
              gutterBottom
              sx={{ 
                fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' },
                textAlign: 'center',
                mb: { xs: 2, md: 3 }
              }}
            >
              Create stunning images with AI-powered prompt optimization
            </Typography>
            
            {/* Mobile-first feature cards */}
            <Box sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', md: 'row' },
              gap: { xs: 2, md: 3 },
              width: '100%',
              mb: { xs: 3, md: 4 }
            }}>
              <Box className="feature-card">
                <Typography variant="h6" sx={{ fontSize: { xs: '1rem', md: '1.125rem' }, mb: 1 }}>
                  🎨 Smart Prompts
                </Typography>
                <Typography variant="body2" sx={{ fontSize: { xs: '0.875rem', md: '0.875rem' } }}>
                  Transform simple ideas into detailed, optimized prompts
                </Typography>
              </Box>
              
              <Box className="feature-card">
                <Typography variant="h6" sx={{ fontSize: { xs: '1rem', md: '1.125rem' }, mb: 1 }}>
                  🖼️ AI Generation
                </Typography>
                <Typography variant="body2" sx={{ fontSize: { xs: '0.875rem', md: '0.875rem' } }}>
                  Create high-quality images using advanced AI models
                </Typography>
              </Box>
              
              <Box className="feature-card">
                <Typography variant="h6" sx={{ fontSize: { xs: '1rem', md: '1.125rem' }, mb: 1 }}>
                  📱 Personal Gallery
                </Typography>
                <Typography variant="body2" sx={{ fontSize: { xs: '0.875rem', md: '0.875rem' } }}>
                  Save and organize your generated images
                </Typography>
              </Box>
            </Box>

            {/* Collapsible authentication info */}
            <Box className="auth-info-section">
              <Typography 
                variant="body1" 
                sx={{ 
                  fontWeight: 600,
                  mb: 2,
                  textAlign: 'center',
                  fontSize: { xs: '0.95rem', md: '1rem' }
                }}
              >
                🔐 Secure Multi-Provider Authentication
              </Typography>
              
              <Box sx={{ 
                display: { xs: 'none', md: 'block' },
                maxWidth: '600px',
                mx: 'auto'
              }}>
                <Typography variant="body2" sx={{ mb: 2, textAlign: 'center' }}>
                  Choose from Google, Microsoft, or other supported authentication providers.
                  We only access basic profile information (name, email) to create your secure account
                  and personalize your experience.
                </Typography>
              </Box>
              
              {/* Mobile-friendly short version */}
              <Box sx={{ 
                display: { xs: 'block', md: 'none' },
                textAlign: 'center'
              }}>
                <Typography variant="body2" sx={{ fontSize: '0.875rem', mb: 2 }}>
                  Multiple sign-in options available. We only access basic profile info to secure your account.
                </Typography>
              </Box>
            </Box>

            <Typography 
              variant="body2" 
              sx={{ 
                mt: { xs: 2, md: 3 },
                fontStyle: 'italic', 
                color: 'text.secondary', 
                textAlign: 'center',
                fontSize: { xs: '0.8rem', md: '0.875rem' }
              }}
            >
              🔒 Your privacy is protected. Choose your preferred sign-in method below.
            </Typography>
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
      </div>
    </div>
  );
};

export default Home;
