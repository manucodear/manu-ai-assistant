import moment from 'moment';
import { throwError } from './customError';
import axios, { AxiosInstance } from 'axios';

interface IAuthenticationData {
    type: string,
    accessToken: string,
    refreshToken?: string,
    expiresAt?: number, // unix ms timestamp
}

/**
 * Save authentication data. `expiresIn` is expected to be seconds from now as returned by most OAuth servers.
 */
export const saveAuthenticationData = (type: string, accessToken: string, refreshToken?: string, expiresIn?: number) => {
    // expiresIn is typically provided in seconds. Add it to now to get an absolute timestamp.
    const expiresAt = typeof expiresIn === 'number'
        ? moment.utc().add(expiresIn, 'seconds').valueOf()
        : undefined;

    const authenticationData: IAuthenticationData = {
        type,
        accessToken,
        refreshToken,
        expiresAt
    };

    sessionStorage.setItem(`authentication${type}`, JSON.stringify(authenticationData));
}

export const getAuthenticationData = (type: string): IAuthenticationData | null => {
    const authenticationDataString = sessionStorage.getItem(`authentication${type}`);
    if (!authenticationDataString) return null;
    try {
        return JSON.parse(authenticationDataString) as IAuthenticationData;
    } catch (err) {
        console.error('Failed to parse authentication data', err);
        return null;
    }
}

/**
 * Refresh access token by calling your backend.
 * Preferred secure setup: backend stores refresh tokens in a secure, HttpOnly cookie when exchanging the code.
 * In that case the frontend does NOT need to (and should not) send the refresh token — the server reads the cookie.
 * If your backend requires the refresh token in the body, you can still pass it as the second parameter.
 * The endpoint is expected to return { access_token, refresh_token?, expires_in? }.
 */
export const refreshAccessToken = async (type: string, refreshToken?: string) => {
    const backendUrl = (import.meta as any).env?.VITE_BACKEND_URL || 'http://localhost:4000';
    const url = `${backendUrl}/api/authentication/refresh`;
    const body: any = { type };
    if (refreshToken) body.refreshToken = refreshToken;
    const res = await axios.post(url, body, { withCredentials: true });
    return res.data as { access_token: string, refresh_token?: string, expires_in?: number };
}

/**
 * Get a valid access token. If the stored token is expired (or about to expire) this will attempt to refresh it.
 * Returns the (possibly refreshed) access token string.
 */
export const getAccessToken = async (type: string): Promise<string> => {
    const authenticationData = getAuthenticationData(type);
    if (!authenticationData) {
        throwError('No authentication data.');
    }

    const now = moment.utc().valueOf();
    const expiresAt = authenticationData!.expiresAt;

    // If we don't have an expiry, optimistically return the access token but it's risky.
    if (!expiresAt) return authenticationData!.accessToken;

    // Consider token expired if it's within 30 seconds of expiry to avoid races
    const willExpireSoon = expiresAt - now < 30_000;

    if (willExpireSoon) {
        try {
            const refreshToken = authenticationData!.refreshToken;
            const data = await refreshAccessToken(type, refreshToken);
            const { access_token, refresh_token, expires_in } = data;
            if (access_token) {
                saveAuthenticationData(type, access_token, refresh_token, expires_in);
                return access_token;
            }
            throw new Error('No access token in refresh response');
        } catch (err: any) {
            // Bubble up a clearer error through your app error handler
            throwError(`Failed to refresh access token: ${err?.message || err}`);
        }
    }

    return authenticationData!.accessToken;
}

/**
 * Attach an axios interceptor that will attempt to refresh the access token on 401 responses and retry the request.
 * Usage: import axios from 'axios'; import { attachAxiosAuthInterceptor } from './authentication-helper';
 * attachAxiosAuthInterceptor(axios);
 */
export const attachAxiosAuthInterceptor = (axiosInstance: AxiosInstance, type: string) => {
    let isRefreshing = false;
    let failedQueue: Array<{ resolve: (val?: any) => void, reject: (err: any) => void }> = [];

    const processQueue = (error: any, token: string | null = null) => {
        failedQueue.forEach(p => {
            if (error) p.reject(error);
            else p.resolve(token);
        });
        failedQueue = [];
    };

    axiosInstance.interceptors.response.use(
        res => res,
        async err => {
            const originalRequest = err.config;
            if (err.response && err.response.status === 401 && !originalRequest._retry) {
                originalRequest._retry = true;
                try {
                    if (isRefreshing) {
                        // queue the request
                        return new Promise((resolve, reject) => {
                            failedQueue.push({ resolve, reject });
                        }).then((token) => {
                            originalRequest.headers['Authorization'] = `Bearer ${token}`;
                            return axiosInstance(originalRequest);
                        });
                    }

                    isRefreshing = true;
                    const authData = getAuthenticationData(type);
                    if (!authData) throw new Error('No authentication data');
                    const refreshToken = authData.refreshToken;
                    const refreshResponse = await refreshAccessToken(type, refreshToken);
                    const { access_token, refresh_token, expires_in } = refreshResponse;
                    if (!access_token) throw new Error('No access token from refresh');
                    saveAuthenticationData(type, access_token, refresh_token, expires_in);
                    axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
                    processQueue(null, access_token);
                    originalRequest.headers['Authorization'] = `Bearer ${access_token}`;
                    return axiosInstance(originalRequest);
                } catch (e) {
                    processQueue(e, null);
                    throw e;
                } finally {
                    isRefreshing = false;
                }
            }
            throw err;
        }
    );
}

