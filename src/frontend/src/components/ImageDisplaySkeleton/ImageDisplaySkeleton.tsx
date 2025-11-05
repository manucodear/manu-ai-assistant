import React from 'react';
import { Box, Skeleton } from '@mui/material';

const ImageDisplaySkeleton: React.FC = () => {
  return (
    <Box sx={{ position: 'fixed', inset: 0, zIndex: 1300, bgcolor: 'common.black', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* Full-viewport image skeleton */}
      <Skeleton 
        variant="rectangular" 
        sx={{
          width: '80vw',
          height: '60vh',
          maxWidth: '100vw',
          maxHeight: '100vh',
          bgcolor: 'grey.800'
        }}
      />

      {/* Back FAB skeleton (left side) */}
      <Box sx={{ position: 'fixed', bottom: 16, left: 16, zIndex: 1400 }}>
        <Skeleton variant="circular" width={56} height={56} />
      </Box>

      {/* Reset FAB skeleton (right side) */}
      <Box sx={{ position: 'fixed', bottom: 16, right: 16, zIndex: 1400 }}>
        <Skeleton variant="circular" width={56} height={56} />
      </Box>
    </Box>
  );
};

export default ImageDisplaySkeleton;