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

const ImageGallery: React.FC<ImageGalleryProps> = () => {
  const [images, setImages] = useState<ImageData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<ImageSize>('large');
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);

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
      
      if (data.images && Array.isArray(data.images)) {
        setImages(data.images.map(item => item.image));
      } else {
        setImages([]);
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
                  <Box component="img" src={getImageUrl(image)} alt={image.prompt} className={styles.galleryImage} />
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
        </>
      )}
    </div>
  );
};

export default ImageGallery;
