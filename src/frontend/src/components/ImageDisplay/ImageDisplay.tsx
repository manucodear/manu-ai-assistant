import React from 'react';
// imagePromptResult is fetched by parent via id; no local type import needed here
import Box from '@mui/material/Box';
import ClearIcon from '@mui/icons-material/Clear';
import CreateIcon from '@mui/icons-material/Create';
import { Fab } from '@mui/material';

interface ImageDisplayProps {
  imageUrl: string;
  // optional reset handler to return to initial input state
  onReset?: () => void;
  // imagePromptId for fetching prompt result (from ImageGallery)
  imagePromptId?: string | null;
  // optional handler for showing prompt result; receives the imagePromptId string
  onShowPromptResult?: (imagePromptId: string) => void;
}

const ImageDisplay: React.FC<ImageDisplayProps> = ({
  imageUrl,
  onReset,
  imagePromptId,
  onShowPromptResult,
}) => {
  const handleBackClick = () => {
    // Only pass the imagePromptId to the parent. If no id is present, fallback to onReset.
    if (typeof onShowPromptResult !== 'function') {
      if (onReset) onReset();
      return;
    }

    if (!imagePromptId) {
      if (onReset) onReset();
      return;
    }

    onShowPromptResult(imagePromptId);
  };

  // Show back button only when we have an imagePromptId and an onShowPromptResult handler
  const showBackButton = Boolean(imagePromptId) && typeof onShowPromptResult === 'function';

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
