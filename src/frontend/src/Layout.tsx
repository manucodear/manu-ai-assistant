import { Link, Outlet } from "react-router-dom";
import Button from '@mui/material/Button';
import HomeIcon from '@mui/icons-material/Home';
import './Layout.css';

const Layout = () => {

  return (
    <div className="layout">
      <nav className="layout-nav">
        <Link to="/" style={{ textDecoration: 'none' }}>
          <Button variant="text" startIcon={<HomeIcon />}>
            Home
          </Button>
        </Link>
        <div style={{ marginLeft: 12 }}>
          <Link to="/privacy" style={{ textDecoration: 'none', color: 'inherit' }}>
            <Button variant="text">Privacy</Button>
          </Link>
          <Link to="/terms" style={{ textDecoration: 'none', color: 'inherit' }}>
            <Button variant="text">Terms</Button>
          </Link>
        </div>
      </nav>
      <main className="layout-main">
        <Outlet /> {/* This renders the child route */}
      </main>
    </div>
  );
};

export default Layout;