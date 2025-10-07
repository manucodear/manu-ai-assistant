import { Link, Outlet } from "react-router-dom";
import { Button } from '@fluentui/react-components';
import { Home20Regular } from '@fluentui/react-icons';
import './Layout.css';

const Layout = () => {

  return (
    <div className="layout">
      <nav className="layout-nav">
        <Link to="/" style={{ textDecoration: 'none' }}>
          <Button appearance="subtle" icon={<Home20Regular />}>
            Home
          </Button>
        </Link>
      </nav>
      <main className="layout-main">
        <Outlet /> {/* This renders the child route */}
      </main>
    </div>
  );
};

export default Layout;