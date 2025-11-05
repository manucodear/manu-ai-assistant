import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Home } from './pages/Home';
import { AuthCallback } from './pages/AuthCallback';
import { RedditPosts } from './pages/RedditPosts';
import Create from './pages/Create/Create';
import Gallery from './pages/Gallery/Gallery';
import { Login } from './pages/Login';
import FluentShowcase from './pages/FluentShowcase';
import MaterialShowcase from './pages/MaterialShowcase';
import ErrorPage from './pages/ErrorPage';
import ErrorTestPage from './pages/ErrorTestPage';
import ResponsiveDemo from './pages/ResponsiveDemo';
import ProtectedRoute from './components/ProtectedRoute';
import { Token } from './pages/Token';
import { Privacy } from './pages/Privacy';
import { Terms } from './pages/Terms';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/showcase" element={<FluentShowcase />} />
        <Route path="/material-showcase" element={<MaterialShowcase />} />
        <Route path="/responsive" element={<ResponsiveDemo />} />
        <Route path="/error" element={<ErrorPage />} />
        <Route path="/test-errors" element={<ErrorTestPage />} />
        <Route path="/auth/callback/:type" element={<AuthCallback />} />
        <Route path="/redditPosts" element={
          <ProtectedRoute>
            <RedditPosts />
          </ProtectedRoute>
        } />
        <Route path="/create" element={
          <ProtectedRoute>
            <Create />
          </ProtectedRoute>
        } />
        <Route path="/create/:imagePromptId" element={
          <ProtectedRoute>
            <Create />
          </ProtectedRoute>
        } />
        <Route path="/gallery" element={
          <ProtectedRoute>
            <Gallery />
          </ProtectedRoute>
        } />
        <Route path="/token" element={
          <ProtectedRoute>
            <Token />
          </ProtectedRoute>
        } />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
      </Routes>
    </Router>
  )
}

export default App
