import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { LoginButton, LoginButtonType } from '../../components/LoginButton';
import {
  Paper,
  Typography,
  Box,
  Button,
  Alert,
  Divider,
  Container
} from '@mui/material';
import { Home as HomeIcon } from '@mui/icons-material';

const Login: React.FC = () => {
  const [searchParams] = useSearchParams();
  const returnUrl = searchParams.get('returnUrl');
  const isGoogleAuthEnabled = import.meta.env.VITE_GOOGLE_AUTH_ENABLED === 'true';

  return (
    <Container
      maxWidth="sm"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        py: { xs: 2, md: 4 }
      }}
    >
      <Paper
        elevation={3}
        sx={{
          width: '100%',
          maxWidth: 500,
          p: { xs: 2, sm: 3, md: 4 }
        }}
      >
        <Typography
          variant="h4"
          component="h1"
          gutterBottom
          sx={{
            textAlign: 'center',
            mb: 1,
            fontSize: { xs: '1.75rem', md: '2.125rem' }
          }}
        >
          Welcome Back
        </Typography>
        
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{
            textAlign: 'center',
            mb: 3
          }}
        >
          Choose your preferred login method to continue
        </Typography>

        {/* Authentication explanation */}
        <Typography 
          variant="body2" 
          sx={{ 
            textAlign: 'center',
            fontSize: { xs: '0.85rem', md: '0.875rem' },
            color: 'text.secondary',
            mb: 3,
            p: 2,
            backgroundColor: 'action.hover',
            borderRadius: 1,
            lineHeight: 1.5
          }}
        >
          🔐 <strong>Secure Authentication:</strong> Sign in with Google, Microsoft, or other providers. 
          We only access basic profile information (name, email) to create your secure personal account 
          and provide a personalized experience. Your privacy and data security are our top priorities.
        </Typography>

        {returnUrl && (
          <Alert severity="info" sx={{ mb: 3 }}>
            You'll be redirected back to your requested page after logging in.
          </Alert>
        )}

        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            mb: 3
          }}
        >
          <LoginButton type={LoginButtonType.Microsoft} />
          {isGoogleAuthEnabled && <LoginButton type={LoginButtonType.Google} />}

          <Button
            disabled
            variant="contained"
            size="large"
            fullWidth
            sx={{ textTransform: 'none' }}
          >
            Login with X
          </Button>

          <Button
            disabled
            variant="contained"
            size="large"
            fullWidth
            sx={{ textTransform: 'none' }}
          >
            Login with Reddit
          </Button>
        </Box>

        <Divider sx={{ mb: 3 }} />

        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Link to="/" style={{ textDecoration: 'none' }}>
            <Button
              variant="text"
              startIcon={<HomeIcon />}
              sx={{ textTransform: 'none' }}
            >
              Back to Home
            </Button>
          </Link>
        </Box>
      </Paper>
    </Container>
  );
};

export default Login;
