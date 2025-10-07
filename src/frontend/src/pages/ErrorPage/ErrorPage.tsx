import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ErrorPageProps } from './ErrorPage.types';
import {
  Title1,
  Title2,
  Body1,
  Card,
  Button,
  MessageBar,
  Divider
} from '@fluentui/react-components';
import {
  Home20Regular,
  ErrorCircle24Regular,
  Shield20Regular,
  Warning20Regular
} from '@fluentui/react-icons';
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
          icon: <ErrorCircle24Regular className="error-icon" />,
          intent: 'error' as const,
          defaultDetails: 'Please try logging in again. If the problem persists, check your network connection or contact support.'
        };
      case 'unauthorized':
        return {
          title: title || 'Access Denied',
          message: errorMessage || 'You need to be authenticated to access this page.',
          icon: <Shield20Regular className="error-unauthorized-icon" />,
          intent: 'warning' as const,
          defaultDetails: 'Please log in to your account to continue using this feature.'
        };
      default:
        return {
          title: title || 'Something went wrong',
          message: errorMessage || 'An unexpected error occurred.',
          icon: <Warning20Regular className="error-icon" />,
          intent: 'error' as const,
          defaultDetails: 'Please try again or return to the home page.'
        };
    }
  };

  const errorConfig = getErrorConfig();
  const displayDetails = errorDetails || errorConfig.defaultDetails;

  return (
    <div className="error-container">
      <Card className="error-card">
        <div className="error-icon-container">
          {errorConfig.icon}
        </div>
        
        <div className="error-header">
          <Title1>{errorConfig.title}</Title1>
          <Title2>{errorConfig.message}</Title2>
        </div>
        
        <div className="error-content">
          <MessageBar intent={errorConfig.intent}>
            {displayDetails}
          </MessageBar>
          
          {errorType === 'auth-error' && (
            <div className="error-additional-info">
              <Body1>Common causes include:</Body1>
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
              <Body1>
                This page requires authentication. Please log in with one of the available providers to continue.
              </Body1>
            </div>
          )}
        </div>
        
        <Divider />
        
        <div className="error-actions">
          <Link to="/" style={{ textDecoration: 'none' }}>
            <Button 
              appearance="primary" 
              icon={<Home20Regular />}
              size="large"
            >
              Go to Home
            </Button>
          </Link>
          
          {errorType === 'unauthorized' && (
            <Link 
              to={returnUrl ? `/login?returnUrl=${encodeURIComponent(returnUrl)}` : '/login'} 
              style={{ textDecoration: 'none' }}
            >
              <Button 
                appearance="secondary"
                size="large"
              >
                Login
              </Button>
            </Link>
          )}
          
          {errorType === 'auth-error' && (
            <Button 
              appearance="secondary"
              size="large"
              onClick={() => window.location.reload()}
            >
              Try Again
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};

export default ErrorPage;