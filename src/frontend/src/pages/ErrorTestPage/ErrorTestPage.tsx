import React from 'react';
import { Link } from 'react-router-dom';
import { Paper, Typography, Button, Divider, Box } from '@mui/material';
import {
  Error as ErrorIcon,
  Security as SecurityIcon,
  Navigation as NavigationIcon
} from '@mui/icons-material';

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem',
    maxWidth: '800px',
    margin: '0 auto',
    padding: '2rem'
  },
  paper: {
    padding: '2rem'
  },
  buttonGroup: {
    display: 'flex',
    gap: '1rem',
    flexWrap: 'wrap'
  }
};

const ErrorTestPage: React.FC = () => {
  return (
    <div style={styles.container}>
      <Paper elevation={3} style={styles.paper}>
        <Typography variant="h5" component="h1" gutterBottom>
          Error Page Testing
        </Typography>

        <Typography variant="body1" paragraph>
          Use these links to test the different error scenarios:
        </Typography>

        <Divider />

        <Box style={styles.buttonGroup} mt={2} mb={2}>
          <Button
            component={Link}
            to="/error?type=auth-error&message=Test authentication error&details=This is a test authentication error for demonstration purposes"
            variant="outlined"
            startIcon={<ErrorIcon />}
          >
            Test Auth Error
          </Button>

          <Button
            component={Link}
            to="/error?type=unauthorized&message=Test unauthorized access&returnUrl=/image"
            variant="outlined"
            startIcon={<SecurityIcon />}
          >
            Test Unauthorized
          </Button>

          <Button
            component={Link}
            to="/error?type=general&message=Test general error&details=This is a general error for testing purposes"
            variant="outlined"
            startIcon={<NavigationIcon />}
          >
            Test General Error
          </Button>
        </Box>

        <Divider />

        <Typography variant="body1" paragraph>
          <strong>Note:</strong> The Image page is now protected and will redirect to an error page if you're not authenticated.
        </Typography>
      </Paper>
    </div>
  );
};

export default ErrorTestPage;