import './Image.css';
import React, { useState } from 'react';
import { ImagePrompt } from '../../components/ImagePrompt';
import { ImageGallery } from '../../components/ImageGallery';
import {
  Paper,
  Typography,
  Button,
  Divider
} from '@mui/material';
import {
  AutoAwesome as ImageSparkle,
  Collections as ImageMultiple
} from '@mui/icons-material';

const Image: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'generate' | 'gallery'>('generate');

  return (
    <div className="image-container">
      <div className="image-header">
        <Typography variant="h4" className="image-title">AI Image Studio</Typography>
        <div className="image-tabs">
          <Button
            variant={activeTab === 'generate' ? 'contained' : 'outlined'}
            startIcon={<ImageSparkle />}
            onClick={() => setActiveTab('generate')}
          >
            Generate
          </Button>
          <Button
            variant={activeTab === 'gallery' ? 'contained' : 'outlined'}
            startIcon={<ImageMultiple />}
            onClick={() => setActiveTab('gallery')}
            sx={{ ml: 1 }}
          >
            Gallery
          </Button>
        </div>
      </div>

      <Divider sx={{ my: 2 }} />

      {activeTab === 'generate' && (
        <Paper className="image-card" elevation={1} sx={{ p: 2 }}>
          <div className="image-card-header">
            <Typography variant="h5">AI Image Generation</Typography>
            <Typography variant="body1">Enter your prompt below to generate an image</Typography>
          </div>
          <ImagePrompt value={''} />
        </Paper>
      )}

      {activeTab === 'gallery' && (
        <ImageGallery />
      )}
    </div>
  );
};

export default Image;
