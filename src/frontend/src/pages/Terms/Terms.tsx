import { Link as RouterLink } from 'react-router-dom';
import { Box, Typography, Link, Paper } from '@mui/material';
import './Terms.css';

const Terms: React.FC = () => {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
      <Paper sx={{ maxWidth: 800, p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Terms of Service
        </Typography>
        <div>
            <Typography component="p" sx={{ mb: 2 }}>
              These are the basic terms: use this service at your own risk. We reserve the
              right to suspend accounts for abuse. See your administrator for details.
            </Typography>
        </div>

        <Box sx={{ mt: 2 }}>
          <Link component={RouterLink} to="/">
            Return home
          </Link>
        </Box>
      </Paper>
    </Box>
  );
};

export default Terms;
