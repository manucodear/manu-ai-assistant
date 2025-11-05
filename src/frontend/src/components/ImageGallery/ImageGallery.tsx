import React, { useState, useEffect, useMemo } from 'react';
import { ImageGalleryProps, ImageSize } from './ImageGallery.types';
import {
  Paper,
  Typography,
  Alert,
  Skeleton,
  Box,
  Chip,
  ToggleButtonGroup,
  ToggleButton,
  ImageList,
  ImageListItem
} from '@mui/material';
import styles from './ImageGallery.module.css';
import ImageDisplay from '../ImageDisplay/ImageDisplay';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import {
  Collections as ImageMultiple,
  Warning as WarningIcon,

  CropFree as SmallIcon,
  CropSquare as MediumIcon,
  AspectRatio as LargeIcon
} from '@mui/icons-material';
import { fetchImagesApi } from '../../hooks/useImage';
import { ImageDataResponse, ImageResponse } from '../../hooks/useImage.types';

const ImageGallery: React.FC<ImageGalleryProps> = (_props: ImageGalleryProps) => {
  const [images, setImages] = useState<ImageResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<ImageSize>('large');
  const [selectedImage, setSelectedImage] = useState<ImageResponse | null>(null);
  const navigate = useNavigate();
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

  const theme = useTheme();
  const isSm = useMediaQuery(theme.breakpoints.up('sm'));
  const isMd = useMediaQuery(theme.breakpoints.up('md'));
  const isLg = useMediaQuery(theme.breakpoints.up('lg'));
  const isXl = useMediaQuery(theme.breakpoints.up('xl'));

  const cols = useMemo(() => {
    // Choose columns based on selected size and breakpoint. Aim to show more columns on larger screens.
    if (selectedSize === 'small') {
      if (isXl) return 12;
      if (isLg) return 10;
      if (isMd) return 6;
      if (isSm) return 4;
      return 3;
    }
    if (selectedSize === 'medium') {
      if (isXl) return 8;
      if (isLg) return 6;
      if (isMd) return 4;
      if (isSm) return 3;
      return 2;
    }
    // large
    if (isXl) return 6;
    if (isLg) return 5;
    if (isMd) return 4;
    if (isSm) return 2;
    return 1;
  }, [selectedSize, isSm, isMd, isLg, isXl]);

  return (
    <Box className={styles.container}>
      <Paper elevation={1} className={styles.headerPaper}>
        <Box className={styles.headerBox}>
          <ToggleButtonGroup
            value={selectedSize}
            exclusive
            onChange={(_, newSize: ImageSize | null) => { if (newSize !== null) setSelectedSize(newSize); }}
            size="small"
            color='standard'
            className={styles.toggleGroup}
          >
            <ToggleButton value="small" aria-label="Small size"><Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><SmallIcon fontSize="small" /><span>Small</span></Box></ToggleButton>
            <ToggleButton value="medium" aria-label="Medium size"><Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><MediumIcon fontSize="small" /><span>Medium</span></Box></ToggleButton>
            <ToggleButton value="large" aria-label="Large size"><Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><LargeIcon fontSize="small" /><span>Large</span></Box></ToggleButton>
          </ToggleButtonGroup>
          <Chip label={`${images.length} ${images.length === 1 ? 'image' : 'images'}`} color="default" size="small" variant="filled" />
        </Box>
      </Paper>

      {loading && (
        <Paper elevation={0} className={styles.loadingPaper}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <ImageList cols={cols} gap={12} className={styles.imageList}>
              {Array.from({ length: cols * 3 }).map((_, i) => (
                <ImageListItem key={`sk-${i}`} className={styles.imageItem}>
                  <div className={styles.imageWrapper}>
                    <Skeleton variant="rectangular" sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} />
                  </div>
                </ImageListItem>
              ))}
            </ImageList>
          </Box>
        </Paper>
      )}

      {error && (
        <Alert severity="error" icon={<WarningIcon />} className={styles.alertCustom}>{error}</Alert>
      )}

      {!loading && !error && images.length === 0 && (
        <Paper elevation={0} className={styles.emptyPaper}>
          <Box className={styles.emptyBox}>
            <ImageMultiple className={styles.emptyIcon} sx={{ opacity: 0.5 }} />
            <Typography className={styles.emptyTitle} variant="h6">No Images Found</Typography>
            <Typography className={styles.emptyBody} variant="body1">Generate some images to see them here in the gallery.</Typography>
          </Box>
        </Paper>
      )}

      {!loading && !error && images.length > 0 && (
        <>
          <ImageList cols={cols} gap={12} className={styles.imageList}>
            {images.map((image) => (
              <ImageListItem key={`${image.id}-${selectedSize}`} className={styles.imageItem} onClick={() => {
                // show the ImageDisplay overlay locally
                setSelectedImage(image);
              }}>
                <div className={styles.imageWrapper}>
                  <img className={styles.galleryImage} src={getImageUrl(image.imageData)} alt={image.imagePrompt.improvedPrompt} />
                  <div className={styles.imageOverlay}>
                    <Typography className={styles.overlayText} variant="body2">{formatTimestamp(image.timestamp)}</Typography>
                  </div>
                </div>
              </ImageListItem>
            ))}
          </ImageList>

          {/* ImageDisplay overlay shown locally when an image is clicked. */}
          {selectedImage && (
            <ImageDisplay
              image={selectedImage}
              onReset={() => setSelectedImage(null)}
              onShowPromptResult={() => {
                // redirect to placeholder URL when ImageDisplay requests to show prompt result
                navigate(`/create/${selectedImage?.imagePrompt.id}`);
              }}
            />
          )}
        </>
      )}
    </Box>
  );
};

export default ImageGallery;
