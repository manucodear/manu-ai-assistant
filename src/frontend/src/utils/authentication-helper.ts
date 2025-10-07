// Authentication utilities for HTTP-only cookie-based authentication
// Uses local storage to track cookie expiration for fast client-side validation

const AUTH_EXPIRY_KEY = 'auth_expires';
const DEFAULT_EXPIRY_HOURS = 24; // Adjust based on your backend cookie expiration

/**
 * Set authentication expiration time in localStorage
 * Call this when login succeeds or when server confirms valid authentication
 */
export const setAuthExpiration = (hours: number = DEFAULT_EXPIRY_HOURS): void => {
    const expiryTime = Date.now() + (hours * 60 * 60 * 1000);
    localStorage.setItem(AUTH_EXPIRY_KEY, String(expiryTime));
}

/**
 * Check if authentication is valid based on stored expiration time
 * Fast client-side check without server request
 */
export const isAuthenticationValid = (): boolean => {
    const expiryTime = localStorage.getItem(AUTH_EXPIRY_KEY);
    if (!expiryTime) return false;
    
    return Date.now() < parseInt(expiryTime);
}

/**
 * Clear authentication expiration (call on logout)
 */
export const clearAuthExpiration = (): void => {
    localStorage.removeItem(AUTH_EXPIRY_KEY);
}

/**
 * Check authentication status with server (use sparingly)
 * Only use when you need to verify with the server (e.g., on app startup, expired local auth)
 */
export const checkAuthenticationStatus = async (): Promise<boolean> => {
    try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/auth/status`, {
            credentials: 'include',
            method: 'GET'
        });
        
        if (response.ok) {
            // If server confirms auth is valid, update local expiration
            setAuthExpiration();
            return true;
        } else {
            // If server says invalid, clear local expiration
            clearAuthExpiration();
            return false;
        }
    } catch (error) {
        console.error('Error checking authentication status:', error);
        return false;
    }
}

/**
 * Smart authentication check - uses local check first, server as fallback
 * Recommended for most use cases as it balances performance and security
 */
export const smartAuthCheck = (): Promise<boolean> => {
    // First try fast local check
    if (isAuthenticationValid()) {
        return Promise.resolve(true);
    }
    
    // If local check fails, verify with server
    return checkAuthenticationStatus();
}

/**
 * Logout user by calling the backend logout endpoint
 * This will clear the HTTP-only authentication cookies and local expiration
 */
export const logout = async (): Promise<void> => {
    try {
        await fetch(`${import.meta.env.VITE_BACKEND_URL}/auth/logout`, {
            credentials: 'include',
            method: 'POST'
        });
        
        // Clear local authentication expiration
        clearAuthExpiration();
        
        // Redirect to login page
        window.location.href = '/login';
    } catch (error) {
        console.error('Error during logout:', error);
        // Still clear local auth even if server request fails
        clearAuthExpiration();
        window.location.href = '/login';
    }
}

