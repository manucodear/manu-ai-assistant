import React from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { Fab } from '@mui/material';

interface PromptGenerationProps {
  imageUrl: string;
  // optional reset handler to return to initial input state
  onReset?: () => void;
}

const PromptGeneration: React.FC<PromptGenerationProps> = ({ imageUrl, onReset }) => {
  return (
    <Box sx={{ width: '100%', maxWidth: 980, mx: 'auto', px: 0 }}>
      <Box component="img" src={imageUrl} alt="Generated" sx={{ maxWidth: '100%', borderRadius: 1 }} />
      {typeof onReset === 'function' && (
        <Box sx={{ position: 'relative', bottom: 8, left: 0 }}>
          <Fab color="default" aria-label="Reset prompt" onClick={() => onReset && onReset()}>
            <RestartAltIcon />
          </Fab>
        </Box>
      )}
    </Box>
  );
};

export default PromptGeneration;
