import React from 'react';
import { Box, LinearProgress, Typography } from '@mui/material';

const ProgressBar = ({ progress, label }) => {
  return (
    <Box sx={{ width: '100%', mb: 2 }}>
      {label && (
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {label}
        </Typography>
      )}
      <LinearProgress 
        variant="determinate" 
        value={progress} 
        sx={{ 
          height: 8,
          borderRadius: 4
        }}
      />
      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
        {progress}%
      </Typography>
    </Box>
  );
};

export default ProgressBar;