import './Image.css';
import React from 'react';
import { ImagePrompt } from '../../components/ImagePrompt';

const Image: React.FC = () => {
  return (
    <div>
      <h1>Image Page</h1>
      <ImagePrompt value={''} />
    </div>
  );
};

export default Image;
