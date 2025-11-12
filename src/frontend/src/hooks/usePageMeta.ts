import { useEffect } from 'react';

export default function usePageMeta({ title, description }: { title?: string; description?: string }) {
  useEffect(() => {
    const prevTitle = document.title;
    const prevMeta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    const prevDescription = prevMeta?.getAttribute('content') ?? null;

    if (title) document.title = title;

    if (description) {
      if (prevMeta) {
        prevMeta.setAttribute('content', description);
      } else {
        const meta = document.createElement('meta');
        meta.name = 'description';
        meta.content = description;
        document.head.appendChild(meta);
      }
    }

    return () => {
      // restore previous values
      document.title = prevTitle;
      if (prevMeta) {
        prevMeta.setAttribute('content', prevDescription ?? '');
      } else if (description) {
        const current = document.querySelector('meta[name="description"]');
        if (current) document.head.removeChild(current);
      }
    };
  }, [title, description]);
}
