import { ImageDataResponse } from '../../hooks/useImage.types';

export interface PromptAttachImageProps {
  onImageUploaded?: (image: ImageDataResponse) => void;
  onImageRemoved?: () => void;
  disabled?: boolean;
}

export interface PromptAttachImageState {
  uploading: boolean;
  uploadMessage: string | null;
  uploadedImage: ImageDataResponse | null;
  removing: boolean;
}