import React, { useState } from 'react';
import { ImageGallery } from '../../components/ImageGallery';
import { Box, Button, Divider, Container } from '@mui/material';
import {
  Collections as ImageMultiple,
} from '@mui/icons-material';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import { Prompt } from '../../components/Prompt';

const Image: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'generate' | 'gallery'>('generate');
  const [isShowingPromptResult, setIsShowingPromptResult] = useState<boolean>(false);

  return (
    <Container maxWidth="lg" sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1, md: 1 }, p: { xs: 1, md: 1 }, backgroundColor: '#1b1b1b' }}>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, alignItems: { xs: 'flex-start', md: 'center' }, width: '100%' }}>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mx: 'auto', width: { xs: '100%', md: 'auto' }, justifyContent: 'center' }}>
          <Button
            variant={isShowingPromptResult || activeTab === 'generate' ? 'contained' : 'outlined'}
            startIcon={<AutoFixHighIcon />}
            onClick={() => {
              setActiveTab('generate');
              setIsShowingPromptResult(false);
            }}
            fullWidth={false}
          >
            Create
          </Button>
          <Button
            variant={!isShowingPromptResult && activeTab === 'gallery' ? 'contained' : 'outlined'}
            startIcon={<ImageMultiple />}
            onClick={() => {
              setActiveTab('gallery');
              setIsShowingPromptResult(false);
            }}
            sx={{ ml: { xs: 0, md: 1 } }}
          >
            Gallery
          </Button>
        </Box>
      </Box>

      <Divider />

  {activeTab === 'generate' && <Prompt value={''} onResetShowGallery={() => setActiveTab('gallery')} />}
  {activeTab === 'gallery' && <ImageGallery onShowPromptResult={(result) => setIsShowingPromptResult(Boolean(result))} onRequestShowGenerate={() => { setIsShowingPromptResult(false); setActiveTab('generate'); }} />}
    </Container>
  );
};

export default Image;
