# Google OAuth Integration

This document describes the Google OAuth integration added to the application.

## Overview

Google OAuth has been integrated alongside the existing Microsoft, X (Twitter), and Reddit authentication providers.

## Frontend Changes

### 1. LoginButtonType Enum
- Added `Google = "Google"` to `src/components/LoginButton/LoginButton.enums.ts`

### 2. LoginButton Component Updates
- **getAuthenticationUri()**: Added Google OAuth case with standard OAuth 2.0 flow
  - Uses `VITE_GOOGLE_CLIENT_ID`, `VITE_GOOGLE_AUTHENTICATION_URI`, `VITE_GOOGLE_SCOPE`
  - Implements `access_type=offline` and `prompt=consent` for refresh token support
- **getIcon()**: Added Globe icon for Google login button
- **getAppearance()**: Set Google button to use 'primary' appearance

### 3. AuthCallback Component
- Added Google case to handle the OAuth callback with authorization code

### 4. UI Updates
- **Login Page**: Added Google login button alongside existing providers
- **Home Page**: Added Google login option with proper styling

## Environment Variables

The following environment variables are required for Google OAuth:

```env
VITE_GOOGLE_CLIENT_ID=your-google-client-id
VITE_GOOGLE_AUTHENTICATION_URI=https://accounts.google.com/o/oauth2/v2/auth
VITE_GOOGLE_SCOPE=openid email profile
VITE_REDIRECT_URI=https://localhost:3001/auth/callback
```

## Google OAuth Flow

1. User clicks "Login with Google" button
2. Application redirects to Google's authorization server
3. User authenticates and grants permissions
4. Google redirects back to `/auth/callback/Google` with authorization code
5. Frontend sends the code to backend endpoint `/authentication/Google`
6. Backend exchanges code for access token and handles user authentication
7. User is redirected to the appropriate page (returnUrl or /image)

## Backend Requirements

The backend must implement a `/authentication/Google` endpoint that:
- Accepts POST requests with `{ code: string }` body
- Exchanges the authorization code for access tokens
- Creates/updates user account
- Sets authentication cookies
- Returns 200 status on success

## Security Features

- Uses `state` parameter for CSRF protection
- Implements `access_type=offline` for refresh token support
- Uses `prompt=consent` to ensure fresh consent
- Supports `withCredentials: true` for secure cookie handling

## Google Console Setup

To use Google OAuth, you need to:

1. Create a project in Google Cloud Console
2. Enable the Google+ API
3. Create OAuth 2.0 credentials
4. Add authorized redirect URIs:
   - `https://localhost:3001/auth/callback/Google` (development)
   - Your production callback URL
5. Copy the Client ID to your environment variables

## Testing

The Google OAuth integration can be tested by:
1. Starting the development server (`yarn dev`)
2. Navigating to `/login` page
3. Clicking the "Login with Google" button
4. Completing the Google authentication flow

Note: Ensure your backend Google OAuth endpoint is properly implemented and running.