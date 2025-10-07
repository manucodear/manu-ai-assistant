import React from 'react';
import { Link } from 'react-router-dom';
import {
  makeStyles,
  Title1,
  Body1,
  Card,
  Button,
  Divider
} from '@fluentui/react-components';
import { 
  ErrorCircle20Regular, 
  Shield20Regular,
  Navigation20Regular 
} from '@fluentui/react-icons';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem',
    maxWidth: '800px',
    margin: '0 auto',
    padding: '2rem'
  },
  card: {
    padding: '2rem'
  },
  buttonGroup: {
    display: 'flex',
    gap: '1rem',
    flexWrap: 'wrap'
  }
});

const ErrorTestPage: React.FC = () => {
  const styles = useStyles();

  return (
    <div className={styles.container}>
      <Card className={styles.card}>
        <Title1>Error Page Testing</Title1>
        <Body1>
          Use these links to test the different error scenarios:
        </Body1>
        
        <Divider />
        
        <div className={styles.buttonGroup}>
          <Link to="/error?type=auth-error&message=Test authentication error&details=This is a test authentication error for demonstration purposes" style={{ textDecoration: 'none' }}>
            <Button 
              appearance="secondary" 
              icon={<ErrorCircle20Regular />}
            >
              Test Auth Error
            </Button>
          </Link>
          
          <Link to="/error?type=unauthorized&message=Test unauthorized access&returnUrl=/image" style={{ textDecoration: 'none' }}>
            <Button 
              appearance="secondary" 
              icon={<Shield20Regular />}
            >
              Test Unauthorized
            </Button>
          </Link>
          
          <Link to="/error?type=general&message=Test general error&details=This is a general error for testing purposes" style={{ textDecoration: 'none' }}>
            <Button 
              appearance="secondary" 
              icon={<Navigation20Regular />}
            >
              Test General Error
            </Button>
          </Link>
        </div>
        
        <Divider />
        
        <Body1>
          <strong>Note:</strong> The Image page is now protected and will redirect to an error page if you're not authenticated.
        </Body1>
      </Card>
    </div>
  );
};

export default ErrorTestPage;