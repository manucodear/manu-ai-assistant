// This file is kept for potential future cookie-based authentication utilities
// Since authentication is now handled via HTTP-only cookies, most client-side token management is no longer needed

/**
 * Check if user is authenticated by making a request to a protected endpoint
 * Since authentication is cookie-based, this will automatically include credentials
 */
export const checkAuthenticationStatus = async (): Promise<boolean> => {
    try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/auth/status`, {
            credentials: 'include',
            method: 'GET'
        });
        return response.ok;
    } catch (error) {
        console.error('Error checking authentication status:', error);
        return false;
    }
}

/**
 * Logout user by calling the backend logout endpoint
 * This will clear the HTTP-only authentication cookies
 */
export const logout = async (): Promise<void> => {
    try {
        await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/auth/logout`, {
            credentials: 'include',
            method: 'POST'
        });
        // Optionally redirect to login page or home
        window.location.href = '/login';
    } catch (error) {
        console.error('Error during logout:', error);
    }
}

