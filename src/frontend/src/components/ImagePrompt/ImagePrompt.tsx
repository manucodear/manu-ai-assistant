import React, { useState, useRef } from 'react';
import { ImagePromptProps } from './ImagePrompt.types';
import styles from './ImagePrompt.module.css';
import { 
  Textarea, 
  Button, 
  Spinner, 
  MessageBar,
  Image
} from '@fluentui/react-components';
import { ImageSparkle20Regular, Add20Regular, Delete20Regular } from '@fluentui/react-icons';

const ImagePrompt: React.FC<ImagePromptProps> = ({ value }) => {
  const [prompt, setPrompt] = useState<string>(value ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [uploadedThumbnail, setUploadedThumbnail] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  // submitted becomes true when a generate request succeeds (res.ok)
  const [submitted, setSubmitted] = useState(false);
  // store the prompt that was used for generation so we can show it in a div
  const [generatedPrompt, setGeneratedPrompt] = useState<string>('');

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
      // consider the request a success if we received an OK response
      setGeneratedPrompt(prompt);
      setSubmitted(true);
    } catch (err: any) {
      setError(err?.message ?? 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleNew = () => {
    // Reset to original state: empty textarea, no images, errors cleared
    setPrompt('');
    setImages([]);
    setError(null);
    setLoading(false);
    setSubmitted(false);
    setGeneratedPrompt('');
    setUploadedThumbnail(null);
    setUploadedImageUrl(null);
    
    // Reset the file input to allow uploading again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // ref to hidden file input for uploads
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Trigger the hidden file input
  const handleUploadClick = () => {
    setError(null);
    if (fileInputRef.current) fileInputRef.current.click();
  };

  // Read selected file(s), upload to backend, and show returned thumbnail
  const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    // Only allow image files (defensive)
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file.');
      return;
    }

    setError(null);
    setUploading(true);
    setUploadedThumbnail(null);

    try {
      const form = new FormData();
      form.append('image', file);

      // Try to pick up an auth token from storage if present (optional)
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token') || sessionStorage.getItem('accessToken');

      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/userimage`, {
        method: 'POST',
        // Do NOT set Content-Type; browser will add multipart boundary
        headers: headers,
        credentials: 'include',
        body: form,
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `Upload failed: ${res.status}`);
      }

      const data = await res.json();

      // Expect object with thumbnailMedium and url fields per API example
      if (data && data.thumbnailMedium) {
        setUploadedThumbnail(data.thumbnailMedium);
        // Store the full image URL for deletion
        if (data.url) {
          setUploadedImageUrl(data.url);
        }
      }

      // Do not add the uploaded full image to the generated images area.
      // The API's thumbnailMedium is shown in the thumbTop area instead.
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err?.message ?? 'Upload failed');
    } finally {
      setUploading(false);
      // reset the input so the same file can be selected again later if needed
      e.currentTarget.value = '';
    }
  };

  // Delete the uploaded image
  const deleteUploadedImage = async () => {
    if (!uploadedImageUrl) {
      console.error('No image URL available for deletion');
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      // Extract filename from the full URL for the DELETE endpoint
      const filename = uploadedImageUrl.split('/').pop();
      if (!filename) {
        throw new Error('Could not extract filename from image URL');
      }

      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/userimage/${filename}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const txt = await response.text();
        throw new Error(txt || `Failed to delete image: ${response.status}`);
      }

      // Clear the thumbnail and URL after successful deletion
      setUploadedThumbnail(null);
      setUploadedImageUrl(null);
      
      // Reset the file input to allow uploading again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
    } catch (err: any) {
      console.error('Delete error:', err);
      setError(err?.message ?? 'Failed to delete image');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Buttons container: Add (+), thumbnail, and New button all in same row */}
      <div className={styles.buttonsRow}>
        <div className={styles.addButtonWrap}>
          {/* Only show + button if no thumbnail is uploaded and not uploading */}
          {!uploadedThumbnail && !uploading && (
            <Button
              appearance="subtle"
              shape="circular"
              title="Add Image"
              onClick={handleUploadClick}
              icon={<Add20Regular />}
            />
          )}
          
          {/* Show thumbnail or upload spinner in the same space as + button */}
          {uploading ? (
            <div className={styles.uploadThumbPlaceholder} aria-hidden>
              <Spinner size="small" />
            </div>
          ) : uploadedThumbnail ? (
            <div className={styles.thumbContainer}>
              <img src={uploadedThumbnail} alt="uploaded thumbnail" className={styles.uploadedThumb} />
              <Button
                appearance="subtle"
                shape="circular"
                size="small"
                className={styles.deleteButton}
                onClick={deleteUploadedImage}
                disabled={deleting}
                title={deleting ? "Deleting..." : "Delete image"}
                icon={deleting ? <Spinner size="extra-small" /> : <Delete20Regular />}
              />
            </div>
          ) : null}
          
          {/* Hidden file input used for uploads */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
        </div>

        <div className={styles.newButtonWrapInner}>
          <Button appearance="secondary" onClick={handleNew}>
            New
          </Button>
        </div>
      </div>

      <div className={styles.promptRow}>
        {/* If submitted (successful generate) hide the textarea and show the text as plain div */}
        {!submitted ? (
          <Textarea
            value={prompt}
            onChange={(_e, data) => setPrompt(data.value)}
            placeholder="Describe the image you want (multiline supported)"
            rows={6}
            resize="vertical"
            disabled={loading}
          />
        ) : (
          <div className={styles.promptCard} aria-live="polite">
            <div className={styles.promptText}>{generatedPrompt}</div>
          </div>
        )}

        <div className={styles.actions}>
          {!submitted && (
            <Button 
              appearance="primary"
              onClick={handleGenerate} 
              disabled={loading || !prompt.trim()}
              icon={<ImageSparkle20Regular />}
            >
              {loading ? 'Generating…' : 'Generate'}
            </Button>
          )}
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

      {(images.length > 0 || submitted) && (
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
