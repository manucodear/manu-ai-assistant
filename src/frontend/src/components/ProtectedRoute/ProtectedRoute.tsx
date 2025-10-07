import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { smartAuthCheck } from '../../utils/authentication-helper';
import { Spinner } from '@fluentui/react-components';
import styles from './ProtectedRoute.module.css';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Use smart auth check - fast local check first, server fallback if needed
        const authStatus = await smartAuthCheck();
        setIsAuthenticated(authStatus);
      } catch (error) {
        console.error('Authentication check failed:', error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <div className={styles.protectedLoadingContainer}>
        <Spinner size="large" />
        <span>Checking authentication...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to error page with unauthorized type and return URL
    const errorParams = new URLSearchParams({
      type: 'unauthorized',
      message: 'Authentication required to access this page',
      returnUrl: location.pathname + location.search
    });
    
    return <Navigate to={`/error?${errorParams.toString()}`} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;