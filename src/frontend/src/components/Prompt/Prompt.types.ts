import { PromptController } from './usePromptController';

export interface PromptProps {
  value?: string;
  /** Optional controller returned from usePromptController for external control */
  controller?: PromptController | null;
}
