// Generates a random string of the specified length
const generateRandomString = (length: number): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    let result = '';
    const randomValues = new Uint8Array(length);
    window.crypto.getRandomValues(randomValues);  // Use window.crypto to generate random values
    randomValues.forEach((value) => {
        result += chars[value % chars.length];
    });
    return result;
};

// Base64 URL encoding function
const base64URLEncode = (arrayBuffer: ArrayBuffer): string => {
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer))); // Convert ArrayBuffer to Base64 string
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');  // URL-safe Base64 encoding
};

// SHA-256 hashing function
const sha256 = async (message: string): Promise<ArrayBuffer> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);  // Encode the message as bytes
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);  // Use Web Crypto API for SHA-256 hashing
    return hashBuffer;
};

export const generateRandomState = (): string => {
    const randomArray = new Uint8Array(32); // 32 bytes for a sufficiently long random string
    window.crypto.getRandomValues(randomArray);
    return Array.from(randomArray).map(byte => byte.toString(16).padStart(2, '0')).join('');
  };

// Function to generate the PKCE code verifier and code challenge
export const generatePKCECode = async (): Promise<{ codeVerifier: string; codeChallenge: string, state: string }> => {
    const codeVerifier = generateRandomString(128);  // Random 128-character string for code_verifier
    const hashBuffer = await sha256(codeVerifier);  // Hash the code_verifier using SHA-256
    const codeChallenge = base64URLEncode(hashBuffer);  // Base64 URL encode the SHA-256 hash
    const state = generateRandomState();
    return { codeVerifier, codeChallenge, state };
};
