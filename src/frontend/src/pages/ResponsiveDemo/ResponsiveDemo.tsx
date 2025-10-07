import React, { useState } from 'react';
import {
  makeStyles,
  Title1,
  Title2,
  Body1,
  Card,
  CardHeader,
  Button,
  MessageBar,
  Divider,
  Input,
  Textarea,
  Switch,
  Badge
} from '@fluentui/react-components';
import { 
  Phone20Regular, 
  Tablet20Regular, 
  Desktop20Regular,
  CheckmarkCircle20Regular 
} from '@fluentui/react-icons';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
    maxWidth: '1000px',
    margin: '0 auto',
    padding: '1rem',
    '@media (min-width: 768px)': {
      gap: '2rem',
      padding: '2rem'
    }
  },
  card: {
    padding: '1rem',
    '@media (min-width: 768px)': {
      padding: '1.5rem'
    }
  },
  deviceGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '1rem',
    '@media (min-width: 768px)': {
      gridTemplateColumns: 'repeat(3, 1fr)'
    }
  },
  deviceCard: {
    padding: '1rem',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem'
  },
  icon: {
    fontSize: '2rem',
    color: '#0078d4'
  },
  testSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '1rem',
    '@media (min-width: 768px)': {
      gridTemplateColumns: '1fr 1fr'
    }
  },
  buttonGroup: {
    display: 'flex',
    gap: '0.75rem',
    flexWrap: 'wrap',
    justifyContent: 'center',
    '@media (max-width: 480px)': {
      flexDirection: 'column',
      gap: '0.5rem'
    }
  },
  responsiveFeatures: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '0.75rem',
    '@media (min-width: 768px)': {
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '1rem'
    }
  },
  featureItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem',
    backgroundColor: '#f8f9fa',
    borderRadius: '4px'
  }
});

const ResponsiveDemo: React.FC = () => {
  const styles = useStyles();
  const [inputValue, setInputValue] = useState('');
  const [textareaValue, setTextareaValue] = useState('');
  const [switchValue, setSwitchValue] = useState(false);

  const responsiveFeatures = [
    'Mobile-first design approach',
    'Flexible grid layouts',
    'Touch-friendly button sizes',
    'Optimized typography scaling',
    'Adaptive spacing and padding',
    'Responsive navigation',
    'Device-specific breakpoints',
    'Cross-platform compatibility'
  ];

  return (
    <div className={styles.container}>
      <Card className={styles.card}>
        <CardHeader
          header={<Title1>📱 Mobile Responsiveness Demo</Title1>}
          description={<Body1>This page demonstrates the mobile-responsive design implementation across your application.</Body1>}
        />
      </Card>

      <MessageBar intent="success">
        <CheckmarkCircle20Regular />
        Your application is now optimized for mobile devices, tablets, and desktops!
      </MessageBar>

      {/* Device Support Section */}
      <Card className={styles.card}>
        <Title2>Device Support</Title2>
        <div className={styles.deviceGrid}>
          <Card className={styles.deviceCard}>
            <Phone20Regular className={styles.icon} />
            <Title2>Mobile</Title2>
            <Body1>≤ 480px</Body1>
            <Badge appearance="filled" color="success">Optimized</Badge>
          </Card>
          <Card className={styles.deviceCard}>
            <Tablet20Regular className={styles.icon} />
            <Title2>Tablet</Title2>
            <Body1>481px - 767px</Body1>
            <Badge appearance="filled" color="success">Optimized</Badge>
          </Card>
          <Card className={styles.deviceCard}>
            <Desktop20Regular className={styles.icon} />
            <Title2>Desktop</Title2>
            <Body1>≥ 768px</Body1>
            <Badge appearance="filled" color="success">Optimized</Badge>
          </Card>
        </div>
      </Card>

      {/* Interactive Test Section */}
      <Card className={styles.card}>
        <Title2>Interactive Elements Test</Title2>
        <Body1>Try these interactive elements on different screen sizes:</Body1>
        
        <div className={styles.testSection}>
          <div className={styles.formGrid}>
            <div>
              <label>Text Input</label>
              <Input
                value={inputValue}
                onChange={(_e, data) => setInputValue(data.value)}
                placeholder="Type something..."
              />
            </div>
            <div>
              <label>Toggle Switch</label>
              <Switch
                checked={switchValue}
                onChange={(_e, data) => setSwitchValue(data.checked)}
                label="Enable feature"
              />
            </div>
          </div>
          
          <div>
            <label>Textarea</label>
            <Textarea
              value={textareaValue}
              onChange={(_e, data) => setTextareaValue(data.value)}
              placeholder="Enter multiline text..."
              rows={3}
            />
          </div>
          
          <div className={styles.buttonGroup}>
            <Button appearance="primary">Primary Action</Button>
            <Button appearance="secondary">Secondary</Button>
            <Button appearance="outline">Outline</Button>
            <Button appearance="subtle">Subtle</Button>
          </div>
        </div>
      </Card>

      {/* Responsive Features */}
      <Card className={styles.card}>
        <Title2>Responsive Features Implemented</Title2>
        <div className={styles.responsiveFeatures}>
          {responsiveFeatures.map((feature, index) => (
            <div key={index} className={styles.featureItem}>
              <CheckmarkCircle20Regular style={{ color: '#107c10' }} />
              <Body1>{feature}</Body1>
            </div>
          ))}
        </div>
      </Card>

      <Divider />

      <Card className={styles.card}>
        <Title2>Testing Instructions</Title2>
        <Body1>
          To test the responsive design:
        </Body1>
        <ul>
          <li><strong>Desktop:</strong> Resize your browser window to see layout changes</li>
          <li><strong>Mobile:</strong> Open the app on your smartphone or use browser dev tools</li>
          <li><strong>Tablet:</strong> Test on a tablet device or use responsive design mode</li>
          <li><strong>Dev Tools:</strong> Use F12 → Toggle device toolbar in Chrome/Edge</li>
        </ul>
        
        <MessageBar intent="info">
          All pages (Login, Home, Image, Error, Showcase) have been optimized for mobile devices.
        </MessageBar>
      </Card>
    </div>
  );
};

export default ResponsiveDemo;