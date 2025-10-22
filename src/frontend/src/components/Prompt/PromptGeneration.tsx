import React from 'react';
import Box from '@mui/material/Box';
import ClearIcon from '@mui/icons-material/Clear';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Fab } from '@mui/material';

interface PromptGenerationProps {
  imageUrl: string;
  // optional reset handler to return to initial input state
  onReset?: () => void;
  // imagePromptId for fetching prompt result (from ImageGallery)
  imagePromptId?: string | null;
  // id for prompt result (from Prompt component)
  id?: string | null;
  // optional handler for showing prompt result
  onShowPromptResult?: (promptResult: any) => void;
}

const PromptGeneration: React.FC<PromptGenerationProps> = ({ 
  imageUrl, 
  onReset, 
  imagePromptId, 
  id, 
  onShowPromptResult 
}) => {
  const handleBackClick = async () => {
    const promptId = imagePromptId || id;
    
    if (typeof onShowPromptResult !== 'function') {
      console.warn('onShowPromptResult not provided');
      return;
    }

    if (!promptId) {
      console.warn('No imagePromptId or id provided, cannot fetch prompt result');
      // For now, just call onReset as fallback
      if (onReset) {
        onReset();
      }
      return;
    }

    try {
      const base = import.meta.env.VITE_BACKEND_URL || '';
      const response = await fetch(`${base}/imagePrompt/${promptId}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch prompt result: ${response.status} ${response.statusText}`);
      }

      const promptResult = await response.json();
      onShowPromptResult(promptResult);
    } catch (error) {
      console.error('Error fetching prompt result:', error);
      // Fallback to reset if API call fails
      if (onReset) {
        onReset();
      }
    }
  };

  // Show back button if we have an imagePromptId, id, or if we're from ImageGallery (has onShowPromptResult but no id)
  const isFromImageGallery = typeof onShowPromptResult === 'function' && !id;
  const showBackButton = (imagePromptId || id || isFromImageGallery) && typeof onShowPromptResult === 'function';
  
  // Log for debugging - remove after testing
  React.useEffect(() => {
    console.log('PromptGeneration Debug:', {
      imagePromptId,
      id,
      isFromImageGallery,
      hasOnShowPromptResult: typeof onShowPromptResult === 'function',
      showBackButton
    });
  }, [imagePromptId, id, isFromImageGallery, onShowPromptResult, showBackButton]);

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
            <ArrowBackIcon />
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
