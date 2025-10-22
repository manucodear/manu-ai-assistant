export interface ImageGalleryProps {
  value?: string;
  // notify parent when a prompt result is shown from the gallery (image -> prompt result)
  onShowPromptResult?: (result: any) => void;
}

export type ImageSize = 'small' | 'medium' | 'large';

export interface ImageData {
  id: string;
  timestamp: string;
  prompt: string;
  url: string;
  smallUrl: string;
  mediumUrl: string;
  largeUrl: string;
  // prompt id returned by the server that relates this image to its ImagePromptResult
  imagePromptId?: string | null;
  isUserUpload?: boolean; // Flag to identify user-uploaded images
  deleteUrl?: string; // URL to use for deleting user-uploaded images
}

export interface ImageResponse {
  imagePromptId: string;
  images: Array<{
    image: ImageData;
  }>;
}