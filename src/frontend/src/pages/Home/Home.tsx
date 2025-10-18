import reactLogo from '../../assets/react.svg'
import viteLogo from '/vite.svg'
import './Home.css';
import { LoginButton, LoginButtonType } from '../../components/LoginButton';
import { Link } from 'react-router-dom';
import {
  Button
} from '@mui/material';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { Link as MuiLink } from '@mui/material';
import { Person } from '@mui/icons-material';

const Home: React.FC = () => {
  const isGoogleAuthEnabled = import.meta.env.VITE_GOOGLE_AUTH_ENABLED === 'true';

  return (
    <div className="home-container">
      {import.meta.env.DEV && (
        <div className="home-header">
          <Link to="/login" style={{ textDecoration: 'none' }}>
            <Button variant="contained" color="primary" startIcon={<Person />}>
              Login
            </Button>
          </Link>
        </div>
      )}
      <div className="home-body">
        <Paper className="home-card" elevation={3}>
          <div className="home-card-header">
            <Typography variant="h4">Welcome to My AI Assistant</Typography>
            <Typography variant="body1">Built with Vite + React + Material UI</Typography>
          </div>
          <div className="home-logo-container home-text-center">
            <MuiLink href="https://vite.dev" target="_blank" rel="noopener">
              <img
                src={viteLogo}
                alt="Vite logo"
                className="home-logo"
                width={96}
                height={96}
              />
            </MuiLink>
            <MuiLink href="https://react.dev" target="_blank" rel="noopener">
              <img
                src={reactLogo}
                alt="React logo"
                className="home-logo home-react-logo"
                width={96}
                height={96}
              />
            </MuiLink>
          </div>
        </Paper>
        <div className="home-login-buttons">
          <LoginButton type={LoginButtonType.Microsoft} />
          {isGoogleAuthEnabled && <LoginButton type={LoginButtonType.Google} />}
        </div>

        {import.meta.env.DEV && (
          <div className="home-button-group">
            <Link to="/showcase" style={{ textDecoration: 'none' }}>
              <Button
                variant="outlined"
              >
                View Component Showcase
              </Button>
            </Link>
            <Link to="/material-showcase" style={{ textDecoration: 'none' }}>
              <Button
                variant="outlined"
                sx={{ ml: 1 }}
              >
                View Material Showcase
              </Button>
            </Link>
            <Link to="/responsive" style={{ textDecoration: 'none' }}>
              <Button
                variant="outlined"
              >
                📱 Mobile Demo
              </Button>
            </Link>
            <Link to="/test-errors" style={{ textDecoration: 'none' }}>
              <Button
                variant="text"
              >
                Test Error Pages
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
