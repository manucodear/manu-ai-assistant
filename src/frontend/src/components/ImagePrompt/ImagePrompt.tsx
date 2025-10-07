import React, { useState } from 'react';
import { ImagePromptProps } from './ImagePrompt.types';
import { 
  Textarea, 
  Button, 
  Spinner, 
  MessageBar,
  makeStyles,
  Image
} from '@fluentui/react-components';
import { ImageSparkle20Regular } from '@fluentui/react-icons';

const useFluentStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  },
  promptRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end'
  },
  results: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '1rem',
    marginTop: '2rem'
  },
  resultImage: {
    width: '100%',
    height: 'auto',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  loadingContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '1rem'
  }
});

const ImagePrompt: React.FC<ImagePromptProps> = ({ value }) => {
  const fluentStyles = useFluentStyles();
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
    <div className={fluentStyles.container}>
      <div className={fluentStyles.promptRow}>
        <Textarea
          value={prompt}
          onChange={(_e, data) => setPrompt(data.value)}
          placeholder="Describe the image you want (multiline supported)"
          rows={6}
          resize="vertical"
        />
        <div className={fluentStyles.actions}>
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
        <div className={fluentStyles.loadingContainer}>
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
        <div className={fluentStyles.results}>
          {images.map((src) => (
            <Image 
              key={src} 
              src={src} 
              alt="AI generated image" 
              className={fluentStyles.resultImage}
              fit="cover"
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ImagePrompt;
