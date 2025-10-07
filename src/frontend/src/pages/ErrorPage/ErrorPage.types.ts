export interface ErrorPageProps {
  type?: 'auth-error' | 'unauthorized' | 'general';
  title?: string;
  message?: string;
  details?: string;
}