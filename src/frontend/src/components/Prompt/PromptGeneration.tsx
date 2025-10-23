import React from 'react';
import Box from '@mui/material/Box';
import ClearIcon from '@mui/icons-material/Clear';
import CreateIcon from '@mui/icons-material/Create';
import { Fab } from '@mui/material';

interface PromptGenerationProps {
  imageUrl: string;
  // optional reset handler to return to initial input state
  onReset?: () => void;
  // imagePromptId for fetching prompt result (from ImageGallery)
  imagePromptId?: string | null;
  // optional handler for showing prompt result
  onShowPromptResult?: (promptResult: any) => void;
}

const PromptGeneration: React.FC<PromptGenerationProps> = ({
  imageUrl,
  onReset,
  imagePromptId,
  onShowPromptResult,
}) => {
  const handleBackClick = () => {
    const promptId = imagePromptId;

    if (typeof onShowPromptResult !== 'function') {
      if (onReset) onReset();
      return;
    }

    if (!promptId) {
      // No id available — delegate to parent via onReset
      if (onReset) onReset();
      return;
    }

    // Delegate fetching to the parent: pass the id and let the Prompt component load the prompt result
    onShowPromptResult(promptId as any);
  };

  // Show back button if we have an imagePromptId or if we're from ImageGallery (has onShowPromptResult but no id)
  const isFromImageGallery = typeof onShowPromptResult === 'function' && !imagePromptId;
  const showBackButton = (Boolean(imagePromptId) || isFromImageGallery) && typeof onShowPromptResult === 'function';

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

export default PromptGeneration;
