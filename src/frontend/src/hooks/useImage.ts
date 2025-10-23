export interface ImageResponse { images?: any[]; imagePromptId?: string | null }

export const fetchImagesApi = async () => {
  const base = import.meta.env.VITE_BACKEND_URL || '';
  const response = await fetch(`${base}/image`, {
    method: 'GET',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) {
    const txt = await response.text();
    throw new Error(txt || `Request failed: ${response.status}`);
  }
  const json = await response.json();
  return json as ImageResponse;
};

export const deleteUserImageApi = async (imageUrl: string) => {
  const base = import.meta.env.VITE_BACKEND_URL || '';
  const response = await fetch(`${base}/userimage`, {
    method: 'DELETE',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageUrl }),
  });
  if (!response.ok) {
    const txt = await response.text();
    throw new Error(txt || `Request failed: ${response.status}`);
  }
  return true;
};

export default {
  fetchImagesApi,
  deleteUserImageApi,
};
