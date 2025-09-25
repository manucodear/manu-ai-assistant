import { Link, Outlet } from "react-router-dom";

const Layout = () => {
  return (
    <div>
      <nav>
        <Link to="/">🏠 Home</Link>
      </nav>
      <main>
        <Outlet /> {/* This renders the child route */}
      </main>
    </div>
  );
};

export default Layout;