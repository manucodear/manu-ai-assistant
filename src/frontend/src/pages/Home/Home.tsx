import reactLogo from '../../assets/react.svg'
import viteLogo from '/vite.svg'
import './Home.css';
import { LoginButton, LoginButtonType } from '../../components/LoginButton';
import { Link } from 'react-router-dom';
import {
  Button,
  Card,
  CardHeader,
  CardPreview,
  Text,
  Title1,
  Title3,
  Body1,
  Image,
  Link as FluentLink
} from '@fluentui/react-components';
import { Home20Regular, PersonFeedback20Regular } from '@fluentui/react-icons';

const Home: React.FC = () => {
  const isGoogleAuthEnabled = import.meta.env.VITE_GOOGLE_AUTH_ENABLED === 'true';

  return (
    <div className="home-container">
      <div className="home-header">
        <Link to="/login" style={{ textDecoration: 'none' }}>
          <Button appearance="primary" icon={<PersonFeedback20Regular />}>
            Login
          </Button>
        </Link>
      </div>
      <div className="home-body">
        <Card className="home-card">
          <CardHeader
            header={<Title1>Welcome to My AI Assistant</Title1>}
            description={<Body1>Built with Vite + React + Fluent UI</Body1>}
          />
          <CardPreview>
            <div className="home-logo-container home-text-center">
              <FluentLink href="https://vite.dev" target="_blank">
                <Image
                  src={viteLogo}
                  alt="Vite logo"
                  className="home-logo"
                  width={96}
                  height={96}
                />
              </FluentLink>
              <FluentLink href="https://react.dev" target="_blank">
                <Image
                  src={reactLogo}
                  alt="React logo"
                  className="home-logo home-react-logo"
                  width={96}
                  height={96}
                />
              </FluentLink>
            </div>
          </CardPreview>
        </Card>
        <div className="home-login-buttons">
          <LoginButton type={LoginButtonType.Microsoft} />
          {isGoogleAuthEnabled && <LoginButton type={LoginButtonType.Google} />}
        </div>
        
        <div className="home-button-group">
          <Link to="/image" style={{ textDecoration: 'none' }}>
            <Button 
              appearance="secondary" 
              icon={<Home20Regular />}
            >
              Go to Image Page
            </Button>
          </Link>
          <Link to="/showcase" style={{ textDecoration: 'none' }}>
            <Button 
              appearance="outline"
            >
              View Component Showcase
            </Button>
          </Link>
          <Link to="/responsive" style={{ textDecoration: 'none' }}>
            <Button 
              appearance="outline"
            >
              📱 Mobile Demo
            </Button>
          </Link>
          <Link to="/test-errors" style={{ textDecoration: 'none' }}>
            <Button 
              appearance="subtle"
            >
              Test Error Pages
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;
