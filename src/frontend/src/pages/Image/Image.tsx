import './Image.css';
import React from 'react';
import { ImagePrompt } from '../../components/ImagePrompt';
import { 
  makeStyles, 
  Title1, 
  Card, 
  CardHeader,
  Body1
} from '@fluentui/react-components';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem',
    maxWidth: '800px',
    margin: '0 auto'
  },
  card: {
    padding: '1rem'
  }
});

const Image: React.FC = () => {
  const styles = useStyles();

  return (
    <div className={styles.container}>
      <Title1>Image Generation</Title1>
      <Card className={styles.card}>
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
