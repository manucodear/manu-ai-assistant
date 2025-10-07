import { Link, Outlet } from "react-router-dom";
import { 
  makeStyles, 
  Button
} from '@fluentui/react-components';
import { Home20Regular } from '@fluentui/react-icons';

const useStyles = makeStyles({
  layout: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh'
  },
  nav: {
    padding: '1rem',
    borderBottom: '1px solid #e1e1e1',
    backgroundColor: '#f8f9fa'
  },
  main: {
    flex: 1,
    padding: '2rem'
  }
});

const Layout = () => {
  const styles = useStyles();

  return (
    <div className={styles.layout}>
      <nav className={styles.nav}>
        <Link to="/" style={{ textDecoration: 'none' }}>
          <Button appearance="subtle" icon={<Home20Regular />}>
            Home
          </Button>
        </Link>
      </nav>
      <main className={styles.main}>
        <Outlet /> {/* This renders the child route */}
      </main>
    </div>
  );
};

export default Layout;