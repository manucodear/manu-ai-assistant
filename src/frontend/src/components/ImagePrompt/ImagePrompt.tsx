import React, { useState } from 'react';
import { ImagePromptProps } from './ImagePrompt.types';
import styles from './ImagePrompt.module.css';

const ImagePrompt: React.FC<ImagePromptProps> = ({ value }) => {
  const [prompt, setPrompt] = useState<string>(value ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>([]);

  const handleGenerate = async () => {
    setError(null);
    setLoading(true);
    setImages([]);
    try {
      // Only send the prompt for now; backend will populate the rest of the properties.
      const payload = {
        Prompt: prompt,
      } as any;

      const res = await fetch('/api/Image/Generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `Request failed: ${res.status}`);
      }

      const data = await res.json();

      // The backend returns a JSON object which contains a 'data' array with url(s)
      const urls: string[] = [];
      if (data && Array.isArray(data.data)) {
        for (const item of data.data) {
          if (item.url) urls.push(item.url);
        }
      }

      setImages(urls);
    } catch (err: any) {
      setError(err?.message ?? 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.promptRow}>
        <textarea
          className={styles.textarea}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe the image you want (multiline supported)"
          rows={6}
        />
        <div className={styles.actions}>
          <button className={styles.generateButton} onClick={handleGenerate} disabled={loading || !prompt.trim()}>
            {loading ? 'Generating…' : 'Generate'}
          </button>
        </div>
      </div>

      {error && <div className={styles.error}>Error: {error}</div>}

      {images.length > 0 && (
        <div className={styles.results}>
          {images.map((src) => (
            <img key={src} src={src} alt="generated" className={styles.resultImage} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ImagePrompt;
