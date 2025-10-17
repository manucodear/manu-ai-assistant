import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ErrorPageProps } from './ErrorPage.types';
import {
  Paper,
  Typography,
  Button,
  Divider,
  Alert,
  Avatar,
  Box
} from '@mui/material';
import {
  Home as HomeIcon,
  Error as ErrorIcon,
  Security as SecurityIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import './ErrorPage.css';

const ErrorPage: React.FC<ErrorPageProps> = ({ 
  type = 'general',
  title,
  message,
  details 
}) => {
  const [searchParams] = useSearchParams();
  
  // Get error details from URL params if not provided as props
  const errorType = type || searchParams.get('type') || 'general';
  const errorMessage = message || searchParams.get('message');
  const errorDetails = details || searchParams.get('details');
  const returnUrl = searchParams.get('returnUrl');

  const getErrorConfig = () => {
    switch (errorType) {
      case 'auth-error':
        return {
          title: title || 'Authentication Error',
          message: errorMessage || 'There was a problem during the authentication process.',
          // store the icon component (not an element) so we can render it inside Avatar
          icon: ErrorIcon,
          intent: 'error' as const,
          defaultDetails: 'Please try logging in again. If the problem persists, check your network connection or contact support.'
        };
      case 'unauthorized':
        return {
          title: title || 'Access Denied',
          message: errorMessage || 'You need to be authenticated to access this page.',
          icon: SecurityIcon,
          intent: 'warning' as const,
          defaultDetails: 'Please log in to your account to continue using this feature.'
        };
      default:
        return {
          title: title || 'Something went wrong',
          message: errorMessage || 'An unexpected error occurred.',
          icon: WarningIcon,
          intent: 'error' as const,
          defaultDetails: 'Please try again or return to the home page.'
        };
    }
  };

  const errorConfig = getErrorConfig();
  const displayDetails = errorDetails || errorConfig.defaultDetails;

  return (
    <div className="error-container">
      <Paper className="error-card" elevation={3} sx={{ padding: 3 }}>
        {/* Avatar overlapping the card for better visual hierarchy */}
        <div className="error-avatar" aria-hidden>
          {(() => {
            const IconComponent = errorConfig.icon as React.ElementType;
            const bgClass = errorConfig.intent === 'warning' ? 'avatar-warning' : 'avatar-error';
            return (
              <Avatar className={bgClass} sx={{ width: 56, height: 56 }}>
                <IconComponent sx={{ fontSize: 28, color: '#fff' }} />
              </Avatar>
            );
          })()}
        </div>

        <Box className="error-header" sx={{ textAlign: 'center', mb: 2 }}>
          <Typography variant="h5">{errorConfig.title}</Typography>
          <Typography variant="subtitle1">{errorConfig.message}</Typography>
        </Box>

        <div className="error-content">
          <Alert severity={errorConfig.intent === 'warning' ? 'warning' : 'error'}>
            {displayDetails}
          </Alert>

          {errorType === 'auth-error' && (
            <div className="error-additional-info">
              <Typography variant="body1">Common causes include:</Typography>
              <ul className="error-causes-list">
                <li>Network connectivity issues</li>
                <li>Invalid credentials</li>
                <li>Expired authentication session</li>
                <li>Third-party service unavailable</li>
              </ul>
            </div>
          )}

          {errorType === 'unauthorized' && (
            <div className="error-additional-info">
              <Typography variant="body1">
                This page requires authentication. Please log in with one of the available providers to continue.
              </Typography>
            </div>
          )}
        </div>

        <Divider sx={{ my: 2 }} />

        <div className="error-actions">
          <Link to="/" style={{ textDecoration: 'none' }}>
            <Button variant="contained" size="large" startIcon={<HomeIcon />}>
              Go to Home
            </Button>
          </Link>

          {errorType === 'unauthorized' && (
            <Link
              to={returnUrl ? `/login?returnUrl=${encodeURIComponent(returnUrl)}` : '/login'}
              style={{ textDecoration: 'none' }}
            >
              <Button variant="outlined" size="large" sx={{ ml: 2 }}>
                Login
              </Button>
            </Link>
          )}

          {errorType === 'auth-error' && (
            <Button variant="outlined" size="large" sx={{ ml: 2 }} onClick={() => window.location.reload()}>
              Try Again
            </Button>
          )}
        </div>
      </Paper>
    </div>
  );
};

export default ErrorPage;