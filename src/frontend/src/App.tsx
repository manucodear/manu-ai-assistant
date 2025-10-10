import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Home } from './pages/Home';
import { AuthCallback } from './pages/AuthCallback';
import { RedditPosts } from './pages/RedditPosts';
import { Image } from './pages/Image';
import { Login } from './pages/Login';
import FluentShowcase from './pages/FluentShowcase';
import ErrorPage from './pages/ErrorPage';
import ErrorTestPage from './pages/ErrorTestPage';
import ResponsiveDemo from './pages/ResponsiveDemo';
import ProtectedRoute from './components/ProtectedRoute';
import { Token } from './pages/Token';

function App() {
  return (
   <Router>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/showcase" element={<FluentShowcase />} />
      <Route path="/responsive" element={<ResponsiveDemo />} />
      <Route path="/error" element={<ErrorPage />} />
      <Route path="/test-errors" element={<ErrorTestPage />} />
      <Route path="/auth/callback/:type" element={<AuthCallback />} />
      <Route path="/redditPosts" element={
        <ProtectedRoute>
          <RedditPosts />
        </ProtectedRoute>
      } />
      <Route path="/image-generation" element={
        <ProtectedRoute>
          <Image />
        </ProtectedRoute>
      } />
      <Route path="/token" element={
        <ProtectedRoute>
          <Token />
        </ProtectedRoute>
      } />
    </Routes>
   </Router>
  )
}

export default App
