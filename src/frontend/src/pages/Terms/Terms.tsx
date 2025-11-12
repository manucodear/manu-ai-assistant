import { Link as RouterLink } from 'react-router-dom';
import { Box, Typography, Link, Paper } from '@mui/material';
import './Terms.css';
import usePageMeta from '../../hooks/usePageMeta';

const Terms: React.FC = () => {
  usePageMeta({
    title: 'Terms of Service — AI Image Generator',
    description:
      'Terms of Service — Use the AI Image Generator responsibly. We reserve the right to suspend accounts for abuse.',
  });

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
