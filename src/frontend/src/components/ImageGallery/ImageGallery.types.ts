export interface ImageGalleryProps {
  value?: string;
  // notify parent when a prompt result needs to be shown.
  // When an image is clicked the gallery will call the handler with the
  // full ImagePromptResponse (non-null). The gallery will not call the
  // handler with undefined/null for selection events.
  // The handler receives the full ImageResponse so the parent has both
  // the prompt and the image metadata available.
  onShowPromptResult?: (payload: import('../../hooks/useImage.types').ImageResponse) => void;
}

export type ImageSize = 'small' | 'medium' | 'large';