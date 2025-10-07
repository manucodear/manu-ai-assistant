import './Image.css';
import React from 'react';
import { ImagePrompt } from '../../components/ImagePrompt';
import { 
  Title1, 
  Card, 
  CardHeader,
  Body1
} from '@fluentui/react-components';

const Image: React.FC = () => {

  return (
    <div className="image-container">
      <Title1>Image Generation</Title1>
      <Card className="image-card">
        <CardHeader
          header={<Title1>AI Image Prompt</Title1>}
          description={<Body1>Enter your prompt below to generate an image</Body1>}
        />
        <ImagePrompt value={''} />
      </Card>
    </div>
  );
};

export default Image;
