import { ImageDataResponse } from './useImage.types';

/**
 * Upload a user-provided image file to the backend.
 * Expects the server endpoint POST /userimage to accept multipart/form-data with key `image`.
 * Returns the parsed ImageDataResponse on success.
 */
export const uploadUserImage = async (file: File): Promise<ImageDataResponse> => {
  const base = import.meta.env.VITE_BACKEND_URL || '';
  const form = new FormData();
  form.append('image', file);

  const response = await fetch(`${base}/userimage`, {
    method: 'POST',
    credentials: 'include',
    body: form,
  });

  if (!response.ok) {
    const txt = await response.text();
    throw new Error(txt || `Request failed: ${response.status}`);
  }

  const json = await response.json();
  return json as ImageDataResponse;
};

export const deleteUserImage = async (filename: string): Promise<boolean> => {
  const base = import.meta.env.VITE_BACKEND_URL || '';
  const response = await fetch(`${base}/userimage/${encodeURIComponent(filename)}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    const txt = await response.text();
    throw new Error(txt || `Request failed: ${response.status}`);
  }

  return true;
};
export default {
  uploadUserImage,
  deleteUserImage,
};
