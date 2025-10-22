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
      navigate('/image-generation');
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
            
            {/* Mobile-optimized features grid */}
            <Box sx={{ 
              display: 'grid',
              gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
              gap: { xs: 1.5, md: 3 },
              width: '100%',
              mb: { xs: 2, md: 3 }
            }}>
              <Box 
                className="feature-card"
                sx={{
                  p: { xs: 1.5, md: 2 },
                  textAlign: 'center'
                }}
              >
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontSize: { xs: '1rem', md: '1.125rem' }, 
                    mb: { xs: 0.75, md: 1.5 },
                    fontWeight: 600
                  }}
                >
                  🎨 Smart Prompts
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontSize: { xs: '0.8rem', md: '0.875rem' },
                    lineHeight: { xs: 1.3, md: 1.4 }
                  }}
                >
                  Transform ideas into optimized prompts
                </Typography>
              </Box>
              
              <Box 
                className="feature-card"
                sx={{
                  p: { xs: 1.5, md: 2 },
                  textAlign: 'center'
                }}
              >
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontSize: { xs: '1rem', md: '1.125rem' }, 
                    mb: { xs: 0.75, md: 1.5 },
                    fontWeight: 600
                  }}
                >
                  🖼️ AI Generation
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontSize: { xs: '0.8rem', md: '0.875rem' },
                    lineHeight: { xs: 1.3, md: 1.4 }
                  }}
                >
                  High-quality images using advanced AI
                </Typography>
              </Box>
              
              <Box 
                className="feature-card"
                sx={{
                  p: { xs: 1.5, md: 2 },
                  textAlign: 'center',
                  gridColumn: { xs: '1 / -1', md: 'auto' }
                }}
              >
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontSize: { xs: '1rem', md: '1.125rem' }, 
                    mb: { xs: 0.75, md: 1.5 },
                    fontWeight: 600
                  }}
                >
                  📱 Personal Gallery
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontSize: { xs: '0.8rem', md: '0.875rem' },
                    lineHeight: { xs: 1.3, md: 1.4 }
                  }}
                >
                  Save and organize images securely
                </Typography>
              </Box>
            </Box>

            {/* Quick benefits row - visible on mobile */}
            <Box sx={{ 
              display: 'flex',
              justifyContent: 'center',
              flexWrap: 'wrap',
              gap: { xs: 1, md: 1.5 },
              mb: { xs: 2.5, md: 3 }
            }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 0.5,
                px: { xs: 1, md: 1.5 },
                py: { xs: 0.5, md: 0.75 },
                backgroundColor: 'action.hover',
                borderRadius: 1,
                fontSize: { xs: '0.75rem', md: '0.8rem' }
              }}>
                <Typography variant="body2" sx={{ fontSize: 'inherit' }}>
                  ⚡ Fast
                </Typography>
              </Box>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 0.5,
                px: { xs: 1, md: 1.5 },
                py: { xs: 0.5, md: 0.75 },
                backgroundColor: 'action.hover',
                borderRadius: 1,
                fontSize: { xs: '0.75rem', md: '0.8rem' }
              }}>
                <Typography variant="body2" sx={{ fontSize: 'inherit' }}>
                  🎯 High Quality
                </Typography>
              </Box>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 0.5,
                px: { xs: 1, md: 1.5 },
                py: { xs: 0.5, md: 0.75 },
                backgroundColor: 'action.hover',
                borderRadius: 1,
                fontSize: { xs: '0.75rem', md: '0.8rem' }
              }}>
                <Typography variant="body2" sx={{ fontSize: 'inherit' }}>
                  🔒 Secure
                </Typography>
              </Box>
            </Box>
          </div>
        </Paper>
        
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          mt: { xs: 1.5, md: 2 }
        }}>
          <Button
            variant="contained"
            size="medium"
            onClick={handleStart}
            sx={{
              px: { xs: 3, md: 4 },
              py: { xs: 1, md: 1.25 },
              fontSize: { xs: '0.95rem', md: '1rem' },
              fontWeight: 600,
              borderRadius: 2,
              textTransform: 'none',
              minWidth: { xs: 160, md: 200 }
            }}
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