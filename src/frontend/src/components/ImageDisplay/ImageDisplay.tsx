import React from 'react';
import { ImagePromptResponse } from '../../hooks/useImagePrompt.types';
import { ImageResponse } from '../../hooks/useImage.types';
import Box from '@mui/material/Box';
import ClearIcon from '@mui/icons-material/Clear';
import CreateIcon from '@mui/icons-material/Create';
import { Fab } from '@mui/material';

interface ImageDisplayProps {
  image: ImageResponse;
  // optional reset handler to return to initial input state
  onReset?: () => void;
  // optional handler for showing prompt result; receives the ImagePromptResponse
  onShowPromptResult?: (imagePrompt: ImagePromptResponse) => void;
  // when true, hides the "Back to prompt" button even if onShowPromptResult is provided
  hideBackButton?: boolean;
}

const ImageDisplay: React.FC<ImageDisplayProps> = ({
  image,
  onReset,
  onShowPromptResult,
  hideBackButton,
}) => {
  const handleBackClick = () => {
    // Prefer to call onShowPromptResult with the full ImagePromptResponse when available.
    if (typeof onShowPromptResult === 'function' && image?.imagePrompt) {
      onShowPromptResult(image.imagePrompt);
      return;
    }

    // Fallback: if we don't have the full prompt, call onReset so the parent can handle it.
    if (onReset) onReset();
  };

  // Show back button only when we have an imagePrompt and an onShowPromptResult handler, and it's not explicitly hidden
  const showBackButton = Boolean(image?.imagePrompt) && typeof onShowPromptResult === 'function' && !hideBackButton;

  return (
    <Box sx={{ position: 'fixed', inset: 0, zIndex: 1300, bgcolor: 'common.black', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* full-viewport image (contained so entire image is visible) */}
      <Box
        component="img"
        src={image?.imageData?.url ?? ''}
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

      {/* Back FAB fixed in viewport (left side) */}
      {showBackButton && (
        <Box sx={{ position: 'fixed', bottom: 16, left: 16, zIndex: 1400 }}>
          <Fab color="primary" aria-label="Back to prompt" onClick={handleBackClick}>
            <CreateIcon />
          </Fab>
        </Box>
      )}


      {/* Reset FAB fixed in viewport (right side) */}
      {typeof onReset === 'function' && (
        <Box sx={{ position: 'fixed', bottom: 16, right: 16, zIndex: 1400 }}>
          <Fab color="default" aria-label="Reset prompt" onClick={() => onReset && onReset()}>
            <ClearIcon />
          </Fab>
        </Box>
      )}
    </Box>
  );
};

export default ImageDisplay;
