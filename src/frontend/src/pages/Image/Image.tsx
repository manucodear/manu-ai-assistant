import './Image.css';
import React, { useState } from 'react';
import { ImagePrompt } from '../../components/ImagePrompt';
import { ImageGallery } from '../../components/ImageGallery';
import { 
  Title1, 
  Card, 
  CardHeader,
  Body1,
  Button,
  Divider
} from '@fluentui/react-components';
import { 
  ImageSparkle20Regular, 
  ImageMultiple20Regular
} from '@fluentui/react-icons';

const Image: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'generate' | 'gallery'>('generate');

  return (
    <div className="image-container">
      <div className="image-header">
        <Title1 className="image-title">AI Image Studio</Title1>
        <div className="image-tabs">
          <Button
            appearance={activeTab === 'generate' ? 'primary' : 'secondary'}
            icon={<ImageSparkle20Regular />}
            onClick={() => setActiveTab('generate')}
          >
            Generate
          </Button>
          <Button
            appearance={activeTab === 'gallery' ? 'primary' : 'secondary'}
            icon={<ImageMultiple20Regular />}
            onClick={() => setActiveTab('gallery')}
          >
            Gallery
          </Button>
        </div>
      </div>

      <Divider />

      {activeTab === 'generate' && (
        <Card className="image-card">
          <CardHeader
            header={<Title1>AI Image Generation</Title1>}
            description={<Body1>Enter your prompt below to generate an image</Body1>}
          />
          <ImagePrompt value={''} />
        </Card>
      )}

      {activeTab === 'gallery' && (
        <ImageGallery />
      )}
    </div>
  );
};

export default Image;
