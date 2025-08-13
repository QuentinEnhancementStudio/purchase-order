import React from 'react';
import { MessageBoxFunctionalLayout, Button, Box, Text } from '@wix/design-system';
import * as Icons from '@wix/wix-ui-icons-common';

interface ErrorMessageProps {
  message: string;
  onClose?: () => void;
  onRetry?: () => void;
  retryLabel?: string;
  theme?: 'red' | 'blue';
  closable?: boolean;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ 
  message, 
  onClose, 
  onRetry,
  retryLabel = 'Retry',
  theme = 'red',
  closable = true
}) => {
  const handleClose = closable && onClose ? onClose : undefined;

  return (
    <MessageBoxFunctionalLayout
      theme={theme}
      onClose={handleClose}
    >
      <Box direction="vertical" gap="12px">
        <Text size="medium">{message}</Text>
        {onRetry && (
          <Box paddingTop="8px">
            <Button
              size="small"
              skin="light"
              prefixIcon={<Icons.Refresh />}
              onClick={onRetry}
            >
              {retryLabel}
            </Button>
          </Box>
        )}
      </Box>
    </MessageBoxFunctionalLayout>
  );
};