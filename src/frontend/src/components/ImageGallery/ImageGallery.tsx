import React, { useState, useEffect } from 'react';
import { ImageGalleryProps, ImageSize } from './ImageGallery.types';
import {
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Box,
  Chip,
  ToggleButtonGroup,
  ToggleButton
} from '@mui/material';
import {
  Collections as ImageMultiple,
  Warning as WarningIcon,
  
  CropFree as SmallIcon,
  CropSquare as MediumIcon,
  AspectRatio as LargeIcon
} from '@mui/icons-material';
import { fetchImagesApi } from '../../hooks/useImage';
import { ImageDataResponse, ImageResponse } from '../../hooks/useImage.types';

const ImageGallery: React.FC<ImageGalleryProps> = ({ onShowPromptResult }: ImageGalleryProps) => {
  const [images, setImages] = useState<ImageResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<ImageSize>('large');
  // Gallery does not own the full-screen ImageDisplay view anymore.
  // Parent `Prompt` will render ImageDisplay when notified via onShowPromptResult.

  const fetchImages = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchImagesApi();
      if (data.images && Array.isArray(data.images)) {
        setImages(data.images);
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

  const getImageUrl = (img: ImageDataResponse) => img.url || img.largeUrl || img.mediumUrl || img.smallUrl || '';

  const formatTimestamp = (ts?: string) => {
    if (!ts) return '';
    try {
      const d = new Date(ts);
      return d.toLocaleString();
    } catch {
      return ts;
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1.5, md: 2 }, width: '100%', maxWidth: 1200, margin: '0 auto', padding: { xs: 0.5, sm: 1, md: 1.5 }, alignItems: 'stretch' }}>
      <Paper elevation={1} sx={{ p: { xs: 1.5, sm: 2, md: 2.5 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: { xs: 1.5, sm: 2 } }}>
          <ToggleButtonGroup
            value={selectedSize}
            exclusive
            onChange={(_, newSize: ImageSize | null) => { if (newSize !== null) setSelectedSize(newSize); }}
            size="small"
            sx={{ '& .MuiToggleButton-root': { px: { xs: 1.5, sm: 2 }, py: { xs: 0.5, sm: 0.75 }, fontSize: { xs: '0.8rem', md: '0.875rem' }, minWidth: { xs: 60, sm: 80 }, border: '1px solid', borderColor: 'action.disabled', color: 'text.secondary' } }}
          >
            <ToggleButton value="small" aria-label="Small size"><Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><SmallIcon fontSize="small" /><span>Small</span></Box></ToggleButton>
            <ToggleButton value="medium" aria-label="Medium size"><Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><MediumIcon fontSize="small" /><span>Medium</span></Box></ToggleButton>
            <ToggleButton value="large" aria-label="Large size"><Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><LargeIcon fontSize="small" /><span>Large</span></Box></ToggleButton>
          </ToggleButtonGroup>
          <Chip label={`${images.length} ${images.length === 1 ? 'image' : 'images'}`} color="default" size="small" variant="filled" />
        </Box>
      </Paper>

      {loading && (
        <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, textAlign: 'center' }}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'center', justifyContent: 'center', gap: { xs: 1.5, sm: 2 } }}>
            <CircularProgress size={28} />
            <Typography variant="body1" sx={{ fontSize: { xs: '0.9rem', md: '1rem' } }}>Loading images...</Typography>
          </Box>
        </Paper>
      )}

      {error && (
        <Alert severity="error" icon={<WarningIcon />} sx={{ '& .MuiAlert-message': { fontSize: { xs: '0.875rem', md: '0.875rem' } } }}>{error}</Alert>
      )}

      {!loading && !error && images.length === 0 && (
        <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, textAlign: 'center' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: { xs: 1.5, md: 2 }, color: 'text.secondary' }}>
            <ImageMultiple sx={{ fontSize: { xs: '2.5rem', md: '3rem' }, opacity: 0.5 }} />
            <Typography variant="h6" sx={{ fontSize: { xs: '1.1rem', md: '1.25rem' } }}>No Images Found</Typography>
            <Typography variant="body1" sx={{ fontSize: { xs: '0.9rem', md: '1rem' } }}>Generate some images to see them here in the gallery.</Typography>
          </Box>
        </Paper>
      )}

      {!loading && !error && images.length > 0 && (
        <>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: selectedSize === 'large' ? '1fr' : 'repeat(auto-fill, minmax(120px, 1fr))', sm: selectedSize === 'small' ? 'repeat(auto-fill, minmax(100px, 1fr))' : selectedSize === 'medium' ? 'repeat(auto-fill, minmax(180px, 1fr))' : 'repeat(auto-fill, minmax(280px, 1fr))', md: selectedSize === 'small' ? 'repeat(auto-fill, minmax(150px, 1fr))' : selectedSize === 'medium' ? 'repeat(auto-fill, minmax(250px, 1fr))' : 'repeat(auto-fill, minmax(350px, 1fr))' }, gap: { xs: selectedSize === 'small' ? 0.5 : selectedSize === 'medium' ? 1 : 1.5, sm: selectedSize === 'small' ? 1 : selectedSize === 'medium' ? 1.5 : 2, md: selectedSize === 'small' ? 1 : selectedSize === 'medium' ? 2 : 2.5 }, width: '100%', justifyContent: 'center' }}>
            {images.map((image) => (
                <Box key={`${image.id}-${selectedSize}`} sx={{ position: 'relative', aspectRatio: '1', borderRadius: { xs: '8px', md: '12px' }, overflow: 'hidden', cursor: 'pointer', transition: 'all 0.3s ease', '&:hover': { transform: 'translateY(-4px)', boxShadow: 4, '& .image-overlay': { transform: 'translateY(0)' }, '& .delete-button': { opacity: 1, transform: 'scale(1)' }, '& img': { transform: 'scale(1.05)' } } }} onClick={() => {
                  // notify parent that an image was clicked; parent (Prompt) will show ImageDisplay
                  if (typeof onShowPromptResult === 'function') {
                    onShowPromptResult({ imageUrl: getImageUrl(image.imageData), imagePromptId: image.imagePrompt.id ?? null });
                  }
                }}>
                <Box component="img" src={getImageUrl(image.imageData)} alt={image.imagePrompt.improvedPrompt} sx={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease' }} />
                <Box className="image-overlay" sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(to top, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0.4) 50%, transparent 100%)', p: { xs: 1, md: 1.5 }, transform: { xs: 'translateY(0)', md: 'translateY(100%)' }, transition: 'transform 0.3s ease' }}>
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: { xs: '0.75rem', md: '0.875rem' } }}>{formatTimestamp(image.timestamp)}</Typography>
                </Box>
              </Box>
            ))}
          </Box>

          {/* ImageDisplay is rendered by the parent `Prompt` component when it receives an imagePromptId via `onShowPromptResult` */}
        </>
      )}
    </Box>
  );
};

export default ImageGallery;
