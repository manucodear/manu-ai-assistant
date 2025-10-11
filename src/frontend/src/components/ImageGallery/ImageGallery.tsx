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
  Badge
} from '@fluentui/react-components';
import { 
  ImageMultiple20Regular,
  Warning20Regular,
  CheckmarkCircle20Regular
} from '@fluentui/react-icons';

const ImageGallery: React.FC<ImageGalleryProps> = () => {
  const [images, setImages] = useState<ImageData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<ImageSize>('large');

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
      return new Date(timestamp).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return timestamp;
    }
  };

  return (
    <div className={styles.container}>
      <Card className={styles.headerCard}>
        <CardHeader
          header={
            <div className={styles.header}>
              <Title2>
                <ImageMultiple20Regular className={styles.headerIcon} />
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
        <MessageBar intent="error" icon={<Warning20Regular />}>
          {error}
        </MessageBar>
      )}

      {/* Empty State */}
      {!loading && !error && images.length === 0 && (
        <Card className={styles.emptyCard}>
          <div className={styles.emptyState}>
            <ImageMultiple20Regular className={styles.emptyIcon} />
            <Title3>No Images Found</Title3>
            <Body1>Generate some images to see them here in the gallery.</Body1>
          </div>
        </Card>
      )}

      {/* Success State with Images */}
      {!loading && !error && images.length > 0 && (
        <>
          <MessageBar intent="success" icon={<CheckmarkCircle20Regular />}>
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
