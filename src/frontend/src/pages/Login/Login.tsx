import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { LoginButton, LoginButtonType } from '../../components/LoginButton';
import {
  Title1,
  Body1,
  Card,
  CardHeader,
  Divider,
  Button,
  MessageBar
} from '@fluentui/react-components';
import { Home as HomeIcon } from '@mui/icons-material';
import './Login.css';

const Login: React.FC = () => {
  const [searchParams] = useSearchParams();
  const returnUrl = searchParams.get('returnUrl');
  const isGoogleAuthEnabled = import.meta.env.VITE_GOOGLE_AUTH_ENABLED === 'true';

  return (
    <div className="login-container">
      <Card className="login-card">
        <CardHeader
          header={<Title1>Welcome Back</Title1>}
          description={<Body1>Choose your preferred login method to continue</Body1>}
        />
        
        {returnUrl && (
          <MessageBar intent="info">
            You'll be redirected back to your requested page after logging in.
          </MessageBar>
        )}
        
        <div className="login-options">
          <LoginButton type={LoginButtonType.Microsoft} />
          {isGoogleAuthEnabled && <LoginButton type={LoginButtonType.Google} />}
          <Button disabled appearance="primary" size="large" style={{ width: '100%' }}>
            Login with X
          </Button>
          <Button disabled appearance="primary" size="large" style={{ width: '100%' }}>
            Login with Reddit
          </Button>
        </div>
        
        <Divider />
        
        <div className="login-actions">
          <Link to="/" style={{ textDecoration: 'none' }}>
            <Button appearance="subtle" icon={<HomeIcon />}>
              Back to Home
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default Login;
