import React, { useState } from 'react';
import { ImagePromptProps } from './ImagePrompt.types';
import styles from './ImagePrompt.module.css';
import { 
  Textarea, 
  Button, 
  Spinner, 
  MessageBar,
  Image
} from '@fluentui/react-components';
import { ImageSparkle20Regular } from '@fluentui/react-icons';

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

      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/Image/Generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `Request failed: ${res.status}`);
      }

      const data = await res.json();

      // The backend returns a JSON object with image.url for 200 responses
      const urls: string[] = [];
      if (data && data.image && data.image.url) {
        urls.push(data.image.url);
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
        <Textarea
          value={prompt}
          onChange={(_e, data) => setPrompt(data.value)}
          placeholder="Describe the image you want (multiline supported)"
          rows={6}
          resize="vertical"
        />
        <div className={styles.actions}>
          <Button 
            appearance="primary"
            onClick={handleGenerate} 
            disabled={loading || !prompt.trim()}
            icon={<ImageSparkle20Regular />}
          >
            {loading ? 'Generating…' : 'Generate'}
          </Button>
        </div>
      </div>

      {loading && (
        <div className={styles.loadingContainer}>
          <Spinner size="small" />
          <span>Generating your image...</span>
        </div>
      )}

      {error && (
        <MessageBar intent="error">
          Error: {error}
        </MessageBar>
      )}

      {images.length > 0 && (
        <div className={styles.results}>
          {images.map((src) => (
            <Image 
              key={src} 
              src={src} 
              alt="AI generated image" 
              className={styles.resultImage}
              fit="cover"
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ImagePrompt;
