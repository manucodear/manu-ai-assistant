import React, { useState, useEffect } from 'react';
import { ImageGalleryProps, ImageResponse, ImageSize, ImageData } from './ImageGallery.types';
import styles from './ImageGallery.module.css';
import {
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Box,
  Chip,
  RadioGroup,
  FormControlLabel,
  Radio,
  IconButton
} from '@mui/material';
import {
  Collections as ImageMultiple,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Close as DismissIcon
} from '@mui/icons-material';
import PromptGeneration from '../Prompt/PromptGeneration';
import PromptResult from '../Prompt/PromptResult';

const ImageGallery: React.FC<ImageGalleryProps> = ({ onShowPromptResult }: ImageGalleryProps) => {
  const [images, setImages] = useState<ImageData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<ImageSize>('large');
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [imagePromptId, setImagePromptId] = useState<string | null>(null);
  const [promptResult, setPromptResult] = useState<any>(null);

  const fetchImages = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/image`, {
        method: 'GET',
        credentials: 'include', // Include cookies for authentication
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch images: ${response.status} ${response.statusText}`);
      }

      const data: ImageResponse = await response.json();
      
      // Debug logging - remove after testing
      console.log('ImageGallery API Response:', data);
      
      if (data.images && Array.isArray(data.images)) {
        // Map images and preserve per-image prompt ids if present on each item
        const mapped = data.images.map(item => {
          const img = item.image as ImageData;
          // some API versions might include imagePromptId at the top-level or per-image
          if (!img.imagePromptId && (item as any).imagePromptId) {
            img.imagePromptId = (item as any).imagePromptId;
          }
          return img;
        });
        setImages(mapped);
        // Keep legacy top-level imagePromptId if present
        setImagePromptId(data.imagePromptId || null);
        console.log('Set imagePromptId to:', data.imagePromptId);
      } else {
        setImages([]);
        setImagePromptId(null);
      }
    } catch (err: any) {
      console.error('Error fetching images:', err);
      setError(err.message || 'Failed to load images');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);

  const getImageUrl = (image: ImageData): string => {
    switch (selectedSize) {
      case 'small':
        return image.smallUrl || image.url;
      case 'large':
        return image.largeUrl || image.url;
      case 'medium':
      default:
        return image.mediumUrl || image.url;
    }
  };

  const formatTimestamp = (timestamp: string): string => {
    try {
      const d = new Date(timestamp);
      if (Number.isNaN(d.getTime())) return timestamp;
      const datePart = d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      const timePart = d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
      return `${datePart} · ${timePart}`;
    } catch {
      return timestamp;
    }
  };

  const deleteUserImage = async (image: ImageData) => {
    if (!image.isUserUpload || !image.url) {
      console.error('Cannot delete: not a user upload or missing URL');
      return;
    }

    setDeletingImageId(image.id);
    setError(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/userimage`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageUrl: image.url }),
      });

      if (!response.ok) {
        throw new Error(`Failed to delete image: ${response.status} ${response.statusText}`);
      }

      // Remove the image from the local state
      setImages(prevImages => prevImages.filter(img => img.id !== image.id));
      
    } catch (err: any) {
      console.error('Error deleting image:', err);
      setError(err.message || 'Failed to delete image');
    } finally {
      setDeletingImageId(null);
    }
  };

  return (
    <div className={styles.container}>
      {/* Show gallery UI only when no promptResult is present. When promptResult is set (e.g., user pressed Back and we fetched the prompt), hide the gallery and show only the prompt result */}
      {!promptResult && (
        <>
          <Paper className={styles.headerCard} elevation={1} sx={{ padding: 2 }}>
            <div className={styles.header}>
              <Typography variant="h5" component="div">
                <ImageMultiple className={styles.headerIcon} />
                Image Gallery
              </Typography>
              <Chip label={`${images.length} ${images.length === 1 ? 'image' : 'images'}`} color="primary" />
            </div>
            <Typography variant="body2" sx={{ mt: 1 }}>Browse your generated images with different size options</Typography>
          </Paper>

          {/* Size Selection */}
          <Paper className={styles.controlsCard} elevation={1} sx={{ padding: 2 }}>
            <div className={styles.controls}>
              <Typography variant="h6">Image Size</Typography>
              <RadioGroup
                value={selectedSize}
                onChange={(e) => setSelectedSize((e.target as HTMLInputElement).value as ImageSize)}
                row
                className={styles.sizeSelector}
              >
                <FormControlLabel value="small" control={<Radio />} label="Small" />
                <FormControlLabel value="medium" control={<Radio />} label="Medium" />
                <FormControlLabel value="large" control={<Radio />} label="Large" />
              </RadioGroup>
            </div>
          </Paper>

          {/* Loading State */}
          {loading && (
            <Paper className={styles.statusCard} elevation={0} sx={{ padding: 2 }}>
              <div className={styles.loadingContainer}>
                <CircularProgress size={28} />
                <Typography variant="body1">Loading images...</Typography>
              </div>
            </Paper>
          )}

          {/* Error State */}
          {error && (
            <Alert severity="error" icon={<WarningIcon />}>{error}</Alert>
          )}

          {/* Empty State */}
          {!loading && !error && images.length === 0 && (
            <Paper className={styles.emptyCard} elevation={0} sx={{ padding: 2 }}>
              <div className={styles.emptyState}>
                <ImageMultiple className={styles.emptyIcon} />
                <Typography variant="h6">No Images Found</Typography>
                <Typography variant="body1">Generate some images to see them here in the gallery.</Typography>
              </div>
            </Paper>
          )}

          {/* Success State with Images */}
          {!loading && !error && images.length > 0 && (
            <>
              <Alert severity="success" icon={<CheckCircleIcon />}>
                Showing {images.length} {images.length === 1 ? 'image' : 'images'} in {selectedSize} size layout
              </Alert>

              <div className={styles.gallery} data-size={selectedSize}>
                {images.map((image) => (
                  <div key={`${image.id}-${selectedSize}`} className={styles.imageCard}>
                    <div className={styles.imageContainer}>
                      <Box
                        component="img"
                        src={getImageUrl(image)}
                        alt={image.prompt}
                        className={styles.galleryImage}
                        onClick={() => {
                          setSelectedImageUrl(image.url ?? getImageUrl(image));
                          // also set the per-image prompt id if available so PromptGeneration can fetch it
                          setImagePromptId(image.imagePromptId ?? null);
                        }}
                        sx={{ cursor: 'pointer' }}
                      />
                      {/* X button for user-uploaded images */}
                      {image.isUserUpload && (
                        <IconButton
                          className={styles.deleteButton}
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteUserImage(image);
                          }}
                          disabled={deletingImageId === image.id}
                          title={deletingImageId === image.id ? 'Deleting...' : 'Delete this image'}
                          size="small"
                        >
                          {deletingImageId === image.id ? <CircularProgress size={16} /> : <DismissIcon />}
                        </IconButton>
                      )}
                      <div className={styles.imageOverlay}>
                        <div className={styles.imageInfo}>
                          <Typography className={styles.imageTimestamp} variant="body2">
                            {formatTimestamp(image.timestamp)}
                          </Typography>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {/* Fullscreen viewer when an image is selected */}
              {selectedImageUrl && (
                <PromptGeneration 
                  imageUrl={selectedImageUrl} 
                  imagePromptId={imagePromptId}
                  onReset={() => setSelectedImageUrl(null)}
                  onShowPromptResult={(result) => {
                    setPromptResult(result);
                    setSelectedImageUrl(null);
                    if (typeof onShowPromptResult === 'function') onShowPromptResult(result);
                  }}
                />
              )}
            </>
          )}
        </>
      )}

      {/* Show prompt result when available */}
      {promptResult && (
        <PromptResult 
          imageResult={promptResult}
          onReset={() => {
            setPromptResult(null);
            // notify parent that prompt result is closed
            if (typeof onShowPromptResult === 'function') onShowPromptResult(null as any);
          }}
          onGenerate={async (result) => {
            // Handle image generation from prompt result if needed
            console.log('Generate requested from ImageGallery:', result);
          }}
        />
      )}
    </div>
  );
};

export default ImageGallery;
