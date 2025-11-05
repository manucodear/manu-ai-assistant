import React from 'react';
import { Box, Paper, Skeleton, useTheme, useMediaQuery } from '@mui/material';

const PromptResultSkeleton: React.FC = () => {
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Box sx={{ position: 'relative', pb: '72px' }}>
      {/* Improved prompt section skeleton */}
      <Paper elevation={2} sx={{ p: 1, position: 'relative' }}>
        <Box sx={{ fontWeight: 600, mb: 1 }}>
          <Skeleton variant="text" width={140} height={24} />
        </Box>
        
        {/* Improved prompt content */}
        <Box sx={{ mb: 1 }}>
          <Skeleton variant="text" width="100%" height={20} />
          <Skeleton variant="text" width="95%" height={20} />
          <Skeleton variant="text" width="88%" height={20} />
          <Skeleton variant="text" width="92%" height={20} />
        </Box>

        {/* Action buttons row */}
        <Box sx={{ mt: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Skeleton variant="rectangular" width={80} height={32} sx={{ borderRadius: 1 }} />
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Skeleton variant="rectangular" width={100} height={32} sx={{ borderRadius: 1 }} />
              <Skeleton variant="rectangular" width={80} height={32} sx={{ borderRadius: 1 }} />
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* Point of views section skeleton */}
      <Paper elevation={2} sx={{ p: 1, mt: 1 }}>
        <Box sx={{ fontWeight: 600, mb: 1 }}>
          <Skeleton variant="text" width={120} height={24} />
        </Box>
        
        {isSmall ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <Skeleton variant="rectangular" width={160} height={32} sx={{ borderRadius: 1 }} />
          </Box>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Skeleton variant="rectangular" width={88} height={32} sx={{ borderRadius: 1 }} />
            <Skeleton variant="rectangular" width={120} height={32} sx={{ borderRadius: 1 }} />
            <Skeleton variant="rectangular" width={90} height={32} sx={{ borderRadius: 1 }} />
          </Box>
        )}
      </Paper>

      {/* Tags section skeleton */}
      <Paper elevation={2} sx={{ p: 1, mt: 1 }}>
        <Box sx={{ fontWeight: 600, mb: 1 }}>
          <Skeleton variant="text" width={60} height={24} />
        </Box>
        
        {/* Tag buttons */}
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center', mb: 2 }}>
          <Skeleton variant="rectangular" width={100} height={32} sx={{ borderRadius: 1 }} />
          <Skeleton variant="rectangular" width={120} height={32} sx={{ borderRadius: 1 }} />
        </Box>

        {/* Selected tags chips */}
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
          <Skeleton variant="rectangular" width={70} height={24} sx={{ borderRadius: 12 }} />
          <Skeleton variant="rectangular" width={85} height={24} sx={{ borderRadius: 12 }} />
          <Skeleton variant="rectangular" width={95} height={24} sx={{ borderRadius: 12 }} />
          <Skeleton variant="rectangular" width={75} height={24} sx={{ borderRadius: 12 }} />
          <Skeleton variant="rectangular" width={110} height={24} sx={{ borderRadius: 12 }} />
          <Skeleton variant="rectangular" width={80} height={24} sx={{ borderRadius: 12 }} />
          <Skeleton variant="rectangular" width={90} height={24} sx={{ borderRadius: 12 }} />
        </Box>
      </Paper>

      {/* Image styles section skeleton */}
      <Paper elevation={2} sx={{ p: 1, mt: 1 }}>
        <Box sx={{ fontWeight: 600, mb: 1 }}>
          <Skeleton variant="text" width={100} height={24} />
        </Box>
        
        {isSmall ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <Skeleton variant="rectangular" width={140} height={32} sx={{ borderRadius: 1 }} />
          </Box>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Skeleton variant="rectangular" width={110} height={32} sx={{ borderRadius: 1 }} />
            <Skeleton variant="rectangular" width={95} height={32} sx={{ borderRadius: 1 }} />
            <Skeleton variant="rectangular" width={105} height={32} sx={{ borderRadius: 1 }} />
            <Skeleton variant="rectangular" width={85} height={32} sx={{ borderRadius: 1 }} />
          </Box>
        )}
      </Paper>

      {/* Accordions section skeleton */}
      <Paper elevation={2} sx={{ p: 1, mt: 1 }}>
        {/* Source prompt accordion */}
        <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, mb: 1 }}>
          <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Skeleton variant="text" width={120} height={24} />
            <Skeleton variant="circular" width={24} height={24} />
          </Box>
        </Box>
        
        {/* Main differences accordion */}
        <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}>
          <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Skeleton variant="text" width={140} height={24} />
            <Skeleton variant="circular" width={24} height={24} />
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default PromptResultSkeleton;