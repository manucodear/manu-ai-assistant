import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Home } from './pages/Home';
import { AuthCallback } from './pages/AuthCallback';
import { RedditPosts } from './pages/RedditPosts';
import { Image } from './pages/Image';
import { Login } from './pages/Login';
import Layout from './Layout';

function App() {
  return (
   <Router>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route element={<Layout />}>
        <Route path="/auth/callback/:type" element={<AuthCallback />} />
        <Route path="/redditPosts" element={<RedditPosts />} />
      </Route>
      <Route path="/image" element={<Image />} />
    </Routes>
   </Router>
  )
}

export default App
