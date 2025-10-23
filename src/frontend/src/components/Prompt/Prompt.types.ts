export interface PromptProps {
  value: string;
}

export interface ImagePromptTags {
  included: string[];
  notIncluded: string[];
}

export interface ImagePromptResult {
  id: string;
  originalPrompt: string;
  improvedPrompt: string;
  mainDifferences: string;
  tags: ImagePromptTags;
  pointOfViews: string[];
  // possible image styles returned by server
  imageStyles: string[];
  // raw singular PointOfView from server when present (may be empty string)
  pointOfViewRaw?: string | null;
  // raw singular ImageStyle from server when present (may be empty string)
  imageStyleRaw?: string | null;
  // selected image style (normalized)
  imageStyle?: string | null;
  // Conversation identifier returned by the backend for this prompt result
  conversationId: string;
}