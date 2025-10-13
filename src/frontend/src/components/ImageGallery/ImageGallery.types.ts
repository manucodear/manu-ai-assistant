export interface ImageGalleryProps {
  value?: string;
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
  isUserUpload?: boolean; // Flag to identify user-uploaded images
  deleteUrl?: string; // URL to use for deleting user-uploaded images
}

export interface ImageResponse {
  images: Array<{
    image: ImageData;
  }>;
}