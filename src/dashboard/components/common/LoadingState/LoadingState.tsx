import React from 'react';
import { Box, Loader, Text } from '@wix/design-system';

interface LoadingStateProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
  fullHeight?: boolean;
}

export const LoadingSpinner: React.FC<LoadingStateProps> = ({ 
  message = 'Loading...', 
  size = 'medium',
  fullHeight = false 
}) => {
  const padding = fullHeight ? '80px' : '40px';
  
  return (
    <Box 
      align="center" 
      direction="vertical" 
      gap="16px" 
      padding={padding}
      height={fullHeight ? '100vh' : undefined}
      verticalAlign="middle"
    >
      <Loader size={size} />
      <Text size="medium" secondary>{message}</Text>
    </Box>
  );
};