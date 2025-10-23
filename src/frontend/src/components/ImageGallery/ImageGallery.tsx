import React, { useState, useEffect } from 'react';
import { ImageGalleryProps, ImageSize, ImageData } from './ImageGallery.types';
import {
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Box,
  Chip,
  ToggleButtonGroup,
  ToggleButton,
  IconButton
} from '@mui/material';
import {
  Collections as ImageMultiple,
  Warning as WarningIcon,
  Close as DismissIcon,
  CropFree as SmallIcon,
  CropSquare as MediumIcon,
  AspectRatio as LargeIcon
} from '@mui/icons-material';
import PromptGeneration from '../Prompt/PromptGeneration';
import { fetchImagesApi, deleteUserImageApi } from '../../hooks/useImage';

const ImageGallery: React.FC<ImageGalleryProps> = ({ onShowPromptResult }: ImageGalleryProps) => {
  const [images, setImages] = useState<ImageData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<ImageSize>('large');
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [imagePromptId, setImagePromptId] = useState<string | null>(null);

  const fetchImages = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchImagesApi();
      if (data.images && Array.isArray(data.images)) {
        const mapped = data.images.map((item: any) => {
          const img = item.image as ImageData;
          if (!img.imagePromptId && (item as any).imagePromptId) img.imagePromptId = (item as any).imagePromptId;
          return img;
        });
        setImages(mapped);
        setImagePromptId((data as any).imagePromptId || null);
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

  const getImageUrl = (img: ImageData) => img.url || img.largeUrl || img.mediumUrl || img.smallUrl || '';

  const formatTimestamp = (ts?: string) => {
    if (!ts) return '';
    try {
      const d = new Date(ts);
      return d.toLocaleString();
    } catch {
      return ts;
    }
  };

  const deleteUserImage = async (image: ImageData) => {
    if (!image.url) return;
    setDeletingImageId(image.id);
    try {
      await deleteUserImageApi(image.url);
      setImages((prev) => prev.filter((i) => i.id !== image.id));
    } catch (err: any) {
      console.error('Delete image failed', err);
      setError(err.message || 'Failed to delete image');
    } finally {
      setDeletingImageId(null);
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
              <Box key={`${image.id}-${selectedSize}`} sx={{ position: 'relative', aspectRatio: '1', borderRadius: { xs: '8px', md: '12px' }, overflow: 'hidden', cursor: 'pointer', transition: 'all 0.3s ease', '&:hover': { transform: 'translateY(-4px)', boxShadow: 4, '& .image-overlay': { transform: 'translateY(0)' }, '& .delete-button': { opacity: 1, transform: 'scale(1)' }, '& img': { transform: 'scale(1.05)' } } }} onClick={() => { setSelectedImageUrl(image.url ?? getImageUrl(image)); setImagePromptId(image.imagePromptId ?? null); }}>
                <Box component="img" src={getImageUrl(image)} alt={image.prompt} sx={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease' }} />
                {image.isUserUpload && (
                  <IconButton className="delete-button" onClick={(e) => { e.stopPropagation(); deleteUserImage(image); }} disabled={deletingImageId === image.id} title={deletingImageId === image.id ? 'Deleting...' : 'Delete this image'} size="small" sx={{ position: 'absolute', top: { xs: 4, md: 8 }, right: { xs: 4, md: 8 }, zIndex: 10, backgroundColor: 'rgba(0, 0, 0, 0.8)', color: 'white', border: '1px solid rgba(255, 255, 255, 0.2)', opacity: { xs: 1, md: 0 }, transform: { xs: 'scale(1)', md: 'scale(0.9)' }, transition: 'all 0.3s ease', width: { xs: 28, md: 32 }, height: { xs: 28, md: 32 }, '&:hover': { backgroundColor: 'error.main', transform: 'scale(1)' } }}>{deletingImageId === image.id ? <CircularProgress size={16} /> : <DismissIcon fontSize="small" />}</IconButton>
                )}
                <Box className="image-overlay" sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(to top, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0.4) 50%, transparent 100%)', p: { xs: 1, md: 1.5 }, transform: { xs: 'translateY(0)', md: 'translateY(100%)' }, transition: 'transform 0.3s ease' }}>
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: { xs: '0.75rem', md: '0.875rem' } }}>{formatTimestamp(image.timestamp)}</Typography>
                </Box>
              </Box>
            ))}
          </Box>

          {selectedImageUrl && (
            <PromptGeneration
              imageUrl={selectedImageUrl}
              imagePromptId={imagePromptId}
              onReset={() => setSelectedImageUrl(null)}
              onShowPromptResult={(result) => {
                setSelectedImageUrl(null);
                if (typeof onShowPromptResult === 'function') onShowPromptResult(result);
              }}
            />
          )}
        </>
      )}
    </Box>
  );
};

export default ImageGallery;
