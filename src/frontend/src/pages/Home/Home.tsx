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
  makeStyles,
  Image,
  Link as FluentLink
} from '@fluentui/react-components';
import { Home20Regular, PersonFeedback20Regular } from '@fluentui/react-icons';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '2rem',
    gap: '2rem',
    minHeight: '100vh'
  },
  header: {
    display: 'flex',
    justifyContent: 'flex-end',
    width: '100%',
    padding: '1rem'
  },
  body: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2rem',
    maxWidth: '800px'
  },
  logoContainer: {
    display: 'flex',
    gap: '2rem',
    alignItems: 'center'
  },
  logo: {
    height: '6em',
    padding: '1.5em',
    willChange: 'filter',
    transition: 'filter 300ms'
  },
  reactLogo: {
    '@keyframes logo-spin': {
      from: {
        transform: 'rotate(0deg)'
      },
      to: {
        transform: 'rotate(360deg)'
      }
    },
    animation: 'logo-spin infinite 20s linear'
  },
  card: {
    width: '100%',
    maxWidth: '600px'
  },
  textCenter: {
    textAlign: 'center'
  }
});

const Home: React.FC = () => {
  const styles = useStyles();

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link to="/login" style={{ textDecoration: 'none' }}>
          <Button appearance="primary" icon={<PersonFeedback20Regular />}>
            Login
          </Button>
        </Link>
      </div>
      <div className={styles.body}>
        <Card className={styles.card}>
          <CardHeader
            header={<Title1>Welcome to Your Fluent UI App</Title1>}
            description={<Body1>Built with Vite + React + Fluent UI</Body1>}
          />
          <CardPreview>
            <div className={`${styles.logoContainer} ${styles.textCenter}`}>
              <FluentLink href="https://vite.dev" target="_blank">
                <Image
                  src={viteLogo}
                  alt="Vite logo"
                  className={styles.logo}
                  width={96}
                  height={96}
                />
              </FluentLink>
              <FluentLink href="https://react.dev" target="_blank">
                <Image
                  src={reactLogo}
                  alt="React logo"
                  className={`${styles.logo} ${styles.reactLogo}`}
                  width={96}
                  height={96}
                />
              </FluentLink>
            </div>
          </CardPreview>
        </Card>

        <div className={styles.textCenter}>
          <Title3>Get Started</Title3>
          <Text>Click on the Vite and React logos to learn more</Text>
        </div>

        <LoginButton type={LoginButtonType.Microsoft} />
        
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
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
        </div>
      </div>
    </div>
  );
};

export default Home;
