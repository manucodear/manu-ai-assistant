import React from 'react';
import { Box, Skeleton } from '@mui/material';

const PromptInputSkeleton: React.FC = () => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Description section skeleton */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, p: 2, backgroundColor: 'action.hover', borderRadius: 1 }}>
        <Skeleton variant="circular" width={20} height={20} sx={{ mt: 0.25, flexShrink: 0 }} />
        <Box sx={{ flex: 1 }}>
          <Skeleton variant="text" width="100%" height={20} />
          <Skeleton variant="text" width="95%" height={20} />
          <Skeleton variant="text" width="88%" height={20} />
        </Box>
      </Box>

      {/* Input and button section skeleton */}
      <Box sx={{ position: 'relative', display: 'flex', gap: 1 }}>
        <Box sx={{ flex: 1, position: 'relative' }}>
          {/* Input field skeleton */}
          <Skeleton 
            variant="rectangular" 
            width="100%" 
            height={120}
            sx={{ borderRadius: 1 }}
          />
          
          {/* Send button skeleton - positioned for desktop */}
          <Skeleton 
            variant="rectangular" 
            width={80} 
            height={32}
            sx={{ 
              position: { xs: 'static', md: 'absolute' },
              bottom: { md: 8 },
              right: { md: 8 },
              borderRadius: 1,
              mt: { xs: 1, md: 0 }
            }}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default PromptInputSkeleton;