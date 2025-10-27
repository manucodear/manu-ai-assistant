export interface ImageGalleryProps {
  value?: string;
  // notify parent when a prompt result needs to be shown. The handler may be
  // called in one of three ways:
  // - no args: switch to the generate/input view
  // - string id: parent should fetch the prompt result by id
  // - object { imageUrl?, imagePromptId? }: parent should use the imageUrl for
  //   generation and optionally fetch the prompt result by id
  onShowPromptResult?: (payload?: string | { imageUrl?: string; imagePromptId?: string | null } | null) => void;
}

export type ImageSize = 'small' | 'medium' | 'large';