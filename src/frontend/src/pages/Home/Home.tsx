import './Home.css';
import { LoginButton, LoginButtonType } from '../../components/LoginButton';
import { Link } from 'react-router-dom';
import {
  Button,
  Box
} from '@mui/material';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

const Home: React.FC = () => {
  const isGoogleAuthEnabled = import.meta.env.VITE_GOOGLE_AUTH_ENABLED === 'true';
  const privacyUrl = import.meta.env.VITE_PRIVACY_URL || '';
  const termsUrl = import.meta.env.VITE_TERMS_URL || '';
  const appVersion = import.meta.env.VITE_VERSION || '';

  return (
    <div className="home-container">
      <div className="home-body">
        <Paper className="home-card" elevation={3}>
          <div className="home-card-header">
            <Typography 
              variant="h4" 
              gutterBottom
              sx={{ 
                fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' },
                textAlign: 'center',
                mb: { xs: 1, md: 2 }
              }}
            >
              AI Image Generator
            </Typography>
            <Typography 
              variant="h6" 
              color="text.secondary" 
              sx={{ 
                fontSize: { xs: '0.875rem', sm: '1.125rem', md: '1.25rem' },
                textAlign: 'center',
                mb: { xs: 1.5, md: 3 }
              }}
            >
              Create stunning images with AI-powered prompts
            </Typography>
            
            {/* Expanded features section */}
            <Box sx={{ 
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              gap: { xs: 2.5, md: 3 },
              width: '100%',
              mb: { xs: 3, md: 4 }
            }}>
              <Box className="feature-card">
                <Typography variant="h6" sx={{ fontSize: { xs: '1.1rem', md: '1.125rem' }, mb: 1.5 }}>
                  🎨 Smart Prompts
                </Typography>
                <Typography variant="body2" sx={{ fontSize: { xs: '0.9rem', md: '0.875rem' } }}>
                  Transform simple ideas into detailed, optimized prompts for better AI image generation results
                </Typography>
              </Box>
              
              <Box className="feature-card">
                <Typography variant="h6" sx={{ fontSize: { xs: '1.1rem', md: '1.125rem' }, mb: 1.5 }}>
                  🖼️ AI Generation
                </Typography>
                <Typography variant="body2" sx={{ fontSize: { xs: '0.9rem', md: '0.875rem' } }}>
                  Create high-quality, unique images using state-of-the-art AI models and advanced algorithms
                </Typography>
              </Box>
              
              <Box className="feature-card">
                <Typography variant="h6" sx={{ fontSize: { xs: '1.1rem', md: '1.125rem' }, mb: 1.5 }}>
                  📱 Personal Gallery
                </Typography>
                <Typography variant="body2" sx={{ fontSize: { xs: '0.9rem', md: '0.875rem' } }}>
                  Save, organize, and manage your generated images with secure cloud storage and easy access
                </Typography>
              </Box>
            </Box>

            {/* Enhanced benefits section */}
            <Box sx={{ 
              width: '100%',
              mb: { xs: 3, md: 4 },
              textAlign: 'center'
            }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontSize: { xs: '1rem', md: '1.1rem' },
                  fontWeight: 600,
                  mb: 2,
                  color: 'primary.main'
                }}
              >
                Why Choose Our AI Image Generator?
              </Typography>
              
              <Box sx={{ 
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
                gap: { xs: 1.5, md: 2 },
                maxWidth: '800px',
                mx: 'auto'
              }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" sx={{ fontSize: { xs: '0.85rem', md: '0.875rem' }, fontWeight: 500 }}>
                    ⚡ Fast Generation
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: { xs: '0.8rem', md: '0.8rem' }, color: 'text.secondary' }}>
                    Quick results in seconds
                  </Typography>
                </Box>
                
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" sx={{ fontSize: { xs: '0.85rem', md: '0.875rem' }, fontWeight: 500 }}>
                    🎯 High Quality
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: { xs: '0.8rem', md: '0.8rem' }, color: 'text.secondary' }}>
                    Professional-grade images
                  </Typography>
                </Box>
                
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" sx={{ fontSize: { xs: '0.85rem', md: '0.875rem' }, fontWeight: 500 }}>
                    � Secure & Private
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: { xs: '0.8rem', md: '0.8rem' }, color: 'text.secondary' }}>
                    Your data stays protected
                  </Typography>
                </Box>
                
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" sx={{ fontSize: { xs: '0.85rem', md: '0.875rem' }, fontWeight: 500 }}>
                    🎨 Multiple Styles
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: { xs: '0.8rem', md: '0.8rem' }, color: 'text.secondary' }}>
                    Various artistic options
                  </Typography>
                </Box>
                
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" sx={{ fontSize: { xs: '0.85rem', md: '0.875rem' }, fontWeight: 500 }}>
                    💾 Cloud Storage
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: { xs: '0.8rem', md: '0.8rem' }, color: 'text.secondary' }}>
                    Access anywhere, anytime
                  </Typography>
                </Box>
                
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" sx={{ fontSize: { xs: '0.85rem', md: '0.875rem' }, fontWeight: 500 }}>
                    � Iterative Improvement
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: { xs: '0.8rem', md: '0.8rem' }, color: 'text.secondary' }}>
                    Refine and perfect results
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Authentication info */}
            <Typography 
              variant="body2" 
              sx={{ 
                textAlign: 'center',
                fontSize: { xs: '0.85rem', md: '0.875rem' },
                color: 'text.secondary',
                mb: { xs: 2, md: 2 },
                maxWidth: '600px',
                mx: 'auto',
                lineHeight: 1.5
              }}
            >
              🔐 <strong>Secure Authentication:</strong> Sign in with Google, Microsoft, or other providers. 
              We only access basic profile information (name, email) to create your secure personal account 
              and provide a personalized experience. Your privacy and data security are our top priorities.
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
