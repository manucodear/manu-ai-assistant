import React from 'react';
import { Container } from '@mui/material';
import { Prompt } from '../../components/Prompt/Prompt';

const Image: React.FC = () => {
  return (
  <Container maxWidth={'lg'} sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1, md: 1 }, p: { xs: 1, md: 1 }, backgroundColor: '#1b1b1b' }}>
      <Prompt value={''} />
    </Container>
  );
};

export default Image;
