import React, { useRef, useState } from 'react';
import { IconButton, Typography, CircularProgress, Box, Paper } from '@mui/material';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import CloseIcon from '@mui/icons-material/Close';
import { uploadUserImage, deleteUserImage } from '../../hooks/useUserImage';
import { ImageDataResponse } from '../../hooks/useImage.types';
import { PromptAttachImageProps } from './PromptAttachImage.types';
import styles from './PromptAttachImage.module.css';

const PromptAttachImage: React.FC<PromptAttachImageProps> = ({
  onImageUploaded,
  onImageRemoved,
  disabled = false
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<ImageDataResponse | null>(null);
  const [removing, setRemoving] = useState<boolean>(false);

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    
    // Only accept image types
    if (!f.type.startsWith('image/')) {
      setUploadMessage('Please select an image file');
      return;
    }

    setUploading(true);
    setUploadMessage('Uploading...');
    try {
      const res = await uploadUserImage(f as File);
      // success - store uploaded image data for thumbnail
      setUploadedImage(res ?? null);
      setUploadMessage('Upload successful');
      
      // Notify parent component if callback is provided
      if (res && onImageUploaded) {
        onImageUploaded(res);
      }
    } catch (err: any) {
      setUploadMessage(err?.message ?? 'Upload failed');
    } finally {
      setUploading(false);
      // clear the file input so the same file can be selected again if needed
      if (fileInputRef.current) fileInputRef.current.value = '';
      window.setTimeout(() => setUploadMessage(null), 3000);
    }
  };

  const handleRemoveUploaded = async () => {
    if (!uploadedImage) return;
    setRemoving(true);
    setUploadMessage('Removing...');
    try {
      const url = uploadedImage.url || uploadedImage.largeUrl || uploadedImage.mediumUrl || uploadedImage.smallUrl || '';
      let filename = url;
      try {
        const u = new URL(url);
        filename = u.pathname.split('/').pop() || url;
      } catch {
        // leave filename as url if URL parsing fails
        filename = url;
      }
      // The backend expects the raw filename (UUID) without extensions or size suffixes.
      // Example: '8eeee82d-...-ce5c.small.png' -> '8eeee82d-...-ce5c'
      filename = String(filename).split('.')[0];
      await deleteUserImage(filename);
      setUploadedImage(null);
      setUploadMessage('Removed');
      
      // Notify parent component if callback is provided
      if (onImageRemoved) {
        onImageRemoved();
      }
    } catch (err: any) {
      setUploadMessage(err?.message ?? 'Remove failed');
    } finally {
      setRemoving(false);
      window.setTimeout(() => setUploadMessage(null), 2000);
    }
  };

  return (
    <Paper elevation={1} sx={{ p: 1 }}>
      <Box className={styles.attachImageContainer}>
        <input 
          ref={fileInputRef} 
          type="file" 
          accept="image/*" 
          className={styles.hiddenInput}
          onChange={handleFileChange} 
        />
      <IconButton 
        aria-label="attach" 
        onClick={handleAttachClick} 
        disabled={disabled || uploading || Boolean(uploadedImage)}
        className={styles.attachButton}
      >
        <AttachFileIcon />
      </IconButton>
      
      {uploading && <CircularProgress size={18} />}
      
      {uploadedImage && (
        <div className={styles.uploadedImageContainer}>
          <div className={styles.imagePreview}>
            <img 
              src={uploadedImage.smallUrl || uploadedImage.url} 
              alt="uploaded" 
              className={styles.imagePreviewImg}
            />
            <IconButton
              aria-label="remove-upload"
              size="small"
              onClick={handleRemoveUploaded}
              disabled={removing}
              sx={{
                position: 'absolute',
                top: -6,
                right: -6,
                width: 26,
                height: 26,
                bgcolor: 'background.paper',
                boxShadow: 1,
                p: 0.5,
                '&:hover': {
                  bgcolor: 'action.hover',
                }
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </div>
        </div>
      )}
      
        {uploadMessage && (
          <Typography variant="body2" className={styles.uploadMessage}>
            {uploadMessage}
          </Typography>
        )}
      </Box>
    </Paper>
  );
};

export default PromptAttachImage;