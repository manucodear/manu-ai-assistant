import React from 'react';
import Box from '@mui/material/Box';
import ClearIcon from '@mui/icons-material/Clear';
import { Fab } from '@mui/material';

interface PromptGenerationProps {
  imageUrl: string;
  // optional reset handler to return to initial input state
  onReset?: () => void;
}

const PromptGeneration: React.FC<PromptGenerationProps> = ({ imageUrl, onReset }) => {
  return (
    <Box sx={{ position: 'fixed', inset: 0, zIndex: 1300, bgcolor: 'common.black', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* full-viewport image (contained so entire image is visible) */}
      <Box
        component="img"
        src={imageUrl}
        alt="Generated"
        sx={{
          maxWidth: '100vw',
          maxHeight: '100vh',
          width: 'auto',
          height: 'auto',
          objectFit: 'contain',
          display: 'block',
        }}
      />

      {/* Reset FAB fixed in viewport */}
      {typeof onReset === 'function' && (
        <Box sx={{ position: 'fixed', bottom: 16, left: 16, zIndex: 1400 }}>
          <Fab color="default" aria-label="Reset prompt" onClick={() => onReset && onReset()}>
            <ClearIcon />
          </Fab>
        </Box>
      )}
    </Box>
  );
};

export default PromptGeneration;
