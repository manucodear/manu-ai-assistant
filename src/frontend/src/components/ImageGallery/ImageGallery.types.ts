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
}

export interface ImageResponse {
  images: Array<{
    image: ImageData;
  }>;
}