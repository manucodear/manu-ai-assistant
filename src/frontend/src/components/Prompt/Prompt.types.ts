export interface PromptProps {
  value: string;
  // optional callback to switch the surrounding page to the gallery view when prompt flow is reset
  onResetShowGallery?: () => void;
}