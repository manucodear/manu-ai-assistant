import { Link as RouterLink } from 'react-router-dom';
import { Box, Typography, Link, Paper } from '@mui/material';
import './Privacy.css';

const Privacy: React.FC = () => {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
      <Paper sx={{ maxWidth: 800, p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Privacy Policy
        </Typography>
        <div>
            <Typography component="p" sx={{ mb: 2 }}>
                This is a minimal privacy summary. We collect only the data necessary to
                provide and improve the service. We do not sell personal information.
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

export default Privacy;
