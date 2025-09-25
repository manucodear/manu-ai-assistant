import moment from 'moment';
import { throwError } from './customError';
import axios from 'axios';

interface IAuthenticationData {
    type: string,
    accessToken: string,
    refreshToken: string | undefined,
    expiresIn: number | undefined,
}

export const saveAuthenticationData = (type: string, accessToken: string, refreshToken: string | undefined, expiresIn: number | undefined) => {
    const expiration = moment.utc().add(expiresIn);
    console.log('expiration', expiration.format('YYYY-MM-DD HH:mm:ss.SSS'));
    const authenticationData: IAuthenticationData = {
        type,
        accessToken: accessToken,
        refreshToken: refreshToken,
        expiresIn: expiration.valueOf()
    }
    sessionStorage.setItem(`authentication${type}`, JSON.stringify(authenticationData));
}

export const getAccessToken = (type: string): string => {
    const authenticationDataString = sessionStorage.getItem(`authentication${type}`);
    if (!authenticationDataString) {
        throwError('No access token.');
    }

    // Parse the string as a JSON object
    const authenticationData: IAuthenticationData = JSON.parse(authenticationDataString as string);
    if (!authenticationData) {
        throwError('Bad data.');
    }

    if (authenticationData.expiresIn && authenticationData.expiresIn > moment.utc().valueOf()) {
        axios
            .post(`http://localhost:4000/auth/token`, {
                type: type,
                refreshToken: authenticationData.accessToken
            })
            .then((response) => {
                console.log('response.data', response.data);
                const { access_token, refresh_token, expires_in } = response.data;
                if (access_token) {
                    // Store the access token in localStorage (or sessionStorage)
                    saveAuthenticationData(type as string, access_token, refresh_token, expires_in);
                    console.log('Access token stored:', access_token);
                    console.log('Refresh token stored:', refresh_token);
                    console.log('Expiration:', expires_in);
                }
            })
            .catch((err) => {
                throwError(`No access token.${err}`);
            });
    }

    return authenticationData.accessToken;
}

