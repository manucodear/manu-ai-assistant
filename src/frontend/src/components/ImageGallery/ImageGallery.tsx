import React, { useState, useEffect } from 'react';
import { ImageGalleryProps, ImageResponse, ImageSize, ImageData } from './ImageGallery.types';
import styles from './ImageGallery.module.css';
import {
  Title2,
  Title3,
  Body1,
  Card,
  CardHeader,
  Spinner,
  MessageBar,
  Image,
  RadioGroup,
  Radio,
  Badge,
  Button
} from '@fluentui/react-components';
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
      <Card className={styles.headerCard}>
        <CardHeader
          header={
            <div className={styles.header}>
              <Title2>
                <ImageMultiple className={styles.headerIcon} />
                Image Gallery
              </Title2>
              <Badge appearance="filled" color="brand">
                {images.length} {images.length === 1 ? 'image' : 'images'}
              </Badge>
            </div>
          }
          description={<Body1>Browse your generated images with different size options</Body1>}
        />
      </Card>

      {/* Size Selection */}
      <Card className={styles.controlsCard}>
        <div className={styles.controls}>
          <Title3>Image Size</Title3>
          <RadioGroup
            value={selectedSize}
            onChange={(_e, data) => setSelectedSize(data.value as ImageSize)}
            layout="horizontal"
            className={styles.sizeSelector}
          >
            <Radio value="small" label="Small" />
            <Radio value="medium" label="Medium" />
            <Radio value="large" label="Large" />
          </RadioGroup>
        </div>
      </Card>

      {/* Loading State */}
      {loading && (
        <Card className={styles.statusCard}>
          <div className={styles.loadingContainer}>
            <Spinner size="medium" />
            <Body1>Loading images...</Body1>
          </div>
        </Card>
      )}

      {/* Error State */}
        {error && (
        <MessageBar intent="error" icon={<WarningIcon />}>
          {error}
        </MessageBar>
      )}

      {/* Empty State */}
      {!loading && !error && images.length === 0 && (
        <Card className={styles.emptyCard}>
          <div className={styles.emptyState}>
            <ImageMultiple className={styles.emptyIcon} />
            <Title3>No Images Found</Title3>
            <Body1>Generate some images to see them here in the gallery.</Body1>
          </div>
        </Card>
      )}

      {/* Success State with Images */}
      {!loading && !error && images.length > 0 && (
        <>
          <MessageBar intent="success" icon={<CheckCircleIcon />}>
            Showing {images.length} {images.length === 1 ? 'image' : 'images'} in {selectedSize} size layout
          </MessageBar>

          <div className={styles.gallery} data-size={selectedSize}>
            {images.map((image) => (
              <div key={`${image.id}-${selectedSize}`} className={styles.imageCard}>
                <div className={styles.imageContainer}>
                  <Image
                    src={getImageUrl(image)}
                    alt={image.prompt}
                    className={styles.galleryImage}
                    fit="cover"
                  />
                  {/* X button for user-uploaded images */}
                  {image.isUserUpload && (
                    <Button
                      appearance="subtle"
                      shape="circular"
                      size="small"
                      icon={deletingImageId === image.id ? <Spinner size="extra-small" /> : <DismissIcon />}
                      className={styles.deleteButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteUserImage(image);
                      }}
                      disabled={deletingImageId === image.id}
                      title={deletingImageId === image.id ? "Deleting..." : "Delete this image"}
                    />
                  )}
                  <div className={styles.imageOverlay}>
                    <div className={styles.imageInfo}>
                      <Body1 className={styles.imageTimestamp}>
                        {formatTimestamp(image.timestamp)}
                      </Body1>
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
