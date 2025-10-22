import React, { useState, useEffect } from 'react';
import { ImageGalleryProps, ImageResponse, ImageSize, ImageData } from './ImageGallery.types';
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
import PromptResult from '../Prompt/PromptResult';

const ImageGallery: React.FC<ImageGalleryProps> = ({ onShowPromptResult, onRequestShowGenerate }: ImageGalleryProps) => {
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
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: { xs: 1.5, md: 2 },
        width: '100%',
        maxWidth: 1200,
        margin: '0 auto',
        padding: { xs: 0.5, sm: 1, md: 1.5 },
        alignItems: 'stretch'
      }}
    >
      {/* Show gallery UI only when no promptResult is present. When promptResult is set (e.g., user pressed Back and we fetched the prompt), hide the gallery and show only the prompt result */}
      {!promptResult && (
        <>
          <Paper 
            elevation={1} 
            sx={{ 
              p: { xs: 1.5, sm: 2, md: 2.5 }
            }}
          >            
            {/* Size buttons and image counter on same level */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: { xs: 1.5, sm: 2 }
              }}
            >
              <ToggleButtonGroup
                value={selectedSize}
                exclusive
                onChange={(_, newSize: ImageSize | null) => {
                  if (newSize !== null) {
                    setSelectedSize(newSize);
                  }
                }}
                size="small"
                sx={{
                  '& .MuiToggleButton-root': {
                    px: { xs: 1.5, sm: 2 },
                    py: { xs: 0.5, sm: 0.75 },
                    fontSize: { xs: '0.8rem', md: '0.875rem' },
                    minWidth: { xs: 60, sm: 80 },
                    border: '1px solid',
                    borderColor: 'action.disabled',
                    color: 'text.secondary',
                    '&:hover': {
                      backgroundColor: 'action.hover',
                      borderColor: 'text.secondary'
                    },
                    '&.Mui-selected': {
                      backgroundColor: 'text.secondary',
                      color: 'background.paper',
                      borderColor: 'text.secondary',
                      '&:hover': {
                        backgroundColor: 'text.primary'
                      }
                    }
                  }
                }}
              >
                <ToggleButton value="small" aria-label="Small size">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <SmallIcon fontSize="small" />
                    <span>Small</span>
                  </Box>
                </ToggleButton>
                <ToggleButton value="medium" aria-label="Medium size">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <MediumIcon fontSize="small" />
                    <span>Medium</span>
                  </Box>
                </ToggleButton>
                <ToggleButton value="large" aria-label="Large size">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <LargeIcon fontSize="small" />
                    <span>Large</span>
                  </Box>
                </ToggleButton>
              </ToggleButtonGroup>
              
              <Chip 
                label={`${images.length} ${images.length === 1 ? 'image' : 'images'}`} 
                color="default"
                size="small"
                variant="filled"
              />
            </Box>
          </Paper>

          {/* Loading State */}
          {loading && (
            <Paper 
              elevation={0} 
              sx={{ 
                p: { xs: 2, md: 3 },
                textAlign: 'center'
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: { xs: 1.5, sm: 2 }
                }}
              >
                <CircularProgress size={28} />
                <Typography 
                  variant="body1"
                  sx={{
                    fontSize: { xs: '0.9rem', md: '1rem' }
                  }}
                >
                  Loading images...
                </Typography>
              </Box>
            </Paper>
          )}

          {/* Error State */}
          {error && (
            <Alert 
              severity="error" 
              icon={<WarningIcon />}
              sx={{
                '& .MuiAlert-message': {
                  fontSize: { xs: '0.875rem', md: '0.875rem' }
                }
              }}
            >
              {error}
            </Alert>
          )}

          {/* Empty State */}
          {!loading && !error && images.length === 0 && (
            <Paper 
              elevation={0} 
              sx={{ 
                p: { xs: 3, md: 4 },
                textAlign: 'center'
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: { xs: 1.5, md: 2 },
                  color: 'text.secondary'
                }}
              >
                <ImageMultiple 
                  sx={{ 
                    fontSize: { xs: '2.5rem', md: '3rem' },
                    opacity: 0.5
                  }} 
                />
                <Typography 
                  variant="h6"
                  sx={{
                    fontSize: { xs: '1.1rem', md: '1.25rem' }
                  }}
                >
                  No Images Found
                </Typography>
                <Typography 
                  variant="body1"
                  sx={{
                    fontSize: { xs: '0.9rem', md: '1rem' }
                  }}
                >
                  Generate some images to see them here in the gallery.
                </Typography>
              </Box>
            </Paper>
          )}

          {/* Success State with Images */}
          {!loading && !error && images.length > 0 && (
            <>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: selectedSize === 'large' ? '1fr' : 'repeat(auto-fill, minmax(120px, 1fr))',
                    sm: selectedSize === 'small' ? 'repeat(auto-fill, minmax(100px, 1fr))' :
                        selectedSize === 'medium' ? 'repeat(auto-fill, minmax(180px, 1fr))' :
                        'repeat(auto-fill, minmax(280px, 1fr))',
                    md: selectedSize === 'small' ? 'repeat(auto-fill, minmax(150px, 1fr))' :
                        selectedSize === 'medium' ? 'repeat(auto-fill, minmax(250px, 1fr))' :
                        'repeat(auto-fill, minmax(350px, 1fr))'
                  },
                  gap: {
                    xs: selectedSize === 'small' ? 0.5 : selectedSize === 'medium' ? 1 : 1.5,
                    sm: selectedSize === 'small' ? 1 : selectedSize === 'medium' ? 1.5 : 2,
                    md: selectedSize === 'small' ? 1 : selectedSize === 'medium' ? 2 : 2.5
                  },
                  width: '100%',
                  justifyContent: 'center'
                }}
              >
                {images.map((image) => (
                  <Box
                    key={`${image.id}-${selectedSize}`}
                    sx={{
                      position: 'relative',
                      aspectRatio: '1',
                      borderRadius: { xs: '8px', md: '12px' },
                      overflow: 'hidden',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 4,
                        '& .image-overlay': {
                          transform: 'translateY(0)'
                        },
                        '& .delete-button': {
                          opacity: 1,
                          transform: 'scale(1)'
                        },
                        '& img': {
                          transform: 'scale(1.05)'
                        }
                      }
                    }}
                    onClick={() => {
                      setSelectedImageUrl(image.url ?? getImageUrl(image));
                      setImagePromptId(image.imagePromptId ?? null);
                    }}
                  >
                    <Box
                      component="img"
                      src={getImageUrl(image)}
                      alt={image.prompt}
                      sx={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transition: 'transform 0.3s ease'
                      }}
                    />
                    
                    {/* Delete button for user-uploaded images */}
                    {image.isUserUpload && (
                      <IconButton
                        className="delete-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteUserImage(image);
                        }}
                        disabled={deletingImageId === image.id}
                        title={deletingImageId === image.id ? 'Deleting...' : 'Delete this image'}
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: { xs: 4, md: 8 },
                          right: { xs: 4, md: 8 },
                          zIndex: 10,
                          backgroundColor: 'rgba(0, 0, 0, 0.8)',
                          color: 'white',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          opacity: { xs: 1, md: 0 },
                          transform: { xs: 'scale(1)', md: 'scale(0.9)' },
                          transition: 'all 0.3s ease',
                          width: { xs: 28, md: 32 },
                          height: { xs: 28, md: 32 },
                          '&:hover': {
                            backgroundColor: 'error.main',
                            transform: 'scale(1)'
                          }
                        }}
                      >
                        {deletingImageId === image.id ? <CircularProgress size={16} /> : <DismissIcon fontSize="small" />}
                      </IconButton>
                    )}
                    
                    {/* Image overlay with timestamp */}
                    <Box
                      className="image-overlay"
                      sx={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        background: 'linear-gradient(to top, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0.4) 50%, transparent 100%)',
                        p: { xs: 1, md: 1.5 },
                        transform: { xs: 'translateY(0)', md: 'translateY(100%)' },
                        transition: 'transform 0.3s ease'
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          color: 'rgba(255, 255, 255, 0.9)',
                          fontSize: { xs: '0.75rem', md: '0.875rem' }
                        }}
                      >
                        {formatTimestamp(image.timestamp)}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
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
            // request parent to show the prompt input (switch to generate tab) first
            if (typeof onRequestShowGenerate === 'function') {
              try { onRequestShowGenerate(); } catch (e) { /* ignore */ }
            }

            // then clear local prompt result and notify parent
            setPromptResult(null);
            if (typeof onShowPromptResult === 'function') onShowPromptResult(null as any);
          }}
          onGenerate={async (result) => {
            // Handle image generation from prompt result if needed
            console.log('Generate requested from ImageGallery:', result);
          }}
        />
      )}
    </Box>
  );
};

export default ImageGallery;
