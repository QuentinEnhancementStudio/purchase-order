import React, { useState } from 'react';
import { observer } from 'mobx-react';
import {
  MessageBoxFunctionalLayout,
  Button,
  Box,
  Modal,
  Text,
  TextButton
} from '@wix/design-system';
import * as Icons from '@wix/wix-ui-icons-common';

import { AppError } from '../../../services/AppError';

interface GlobalErrorHandlerProps {
  error: AppError | null;
  onClose: () => void;
}

interface ErrorDetailsModalProps {
  isOpen: boolean;
  error: AppError;
  onClose: () => void;
}

const ErrorDetailsModal: React.FC<ErrorDetailsModalProps> = ({ isOpen, error, onClose }) => {
  const formatTimestamp = (date: Date) => {
    return date.toLocaleString();
  };

  const copyToClipboard = () => {
    const errorInfo = `
Error Details:
- Error ID: ${error.id}
- Category: ${error.category}
- Code: ${error.code || 'N/A'}
- Timestamp: ${formatTimestamp(error.timestamp)}
- Technical Message: ${error.technicalMessage || 'N/A'}
- User Message: ${error.userMessage || 'N/A'}
    `.trim();

    navigator.clipboard.writeText(errorInfo).catch(() => {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = errorInfo;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      screen="desktop"
    >
      <Box direction="vertical" gap="20px" padding="24px">
        <Box direction="vertical" gap="8px">
          <Text size="medium" weight="bold">Error Details</Text>
          <Text size="small" secondary>
            Technical information about the error that occurred
          </Text>
        </Box>
        
        <Box direction="vertical" gap="16px">
          <Box direction="vertical" gap="8px">
            <Text size="small" weight="bold">Error ID</Text>
            <Text size="small" weight="bold">{error.id}</Text>
          </Box>
          
          <Box direction="vertical" gap="8px">
            <Text size="small" weight="bold">Category</Text>
            <Text size="small">{error.category.toUpperCase().replace('_', ' ')}</Text>
          </Box>
          
          {error.code && (
            <Box direction="vertical" gap="8px">
              <Text size="small" weight="bold">Error Code</Text>
              <Text size="small">{error.code}</Text>
            </Box>
          )}
          
          <Box direction="vertical" gap="8px">
            <Text size="small" weight="bold">Timestamp</Text>
            <Text size="small">{formatTimestamp(error.timestamp)}</Text>
          </Box>
          
          {error.technicalMessage && (
            <Box direction="vertical" gap="8px">
              <Text size="small" weight="bold">Technical Details</Text>
              <Box 
                padding="12px" 
                backgroundColor="#F8F9FA" 
                borderRadius="4px"
                border="1px solid #E5E5E5"
              >
                <Text size="small" secondary>{error.technicalMessage}</Text>
              </Box>
            </Box>
          )}
        </Box>
        
        <Box direction="horizontal" align="space-between" paddingTop="16px" borderTop="1px solid #E5E5E5">
          <TextButton
            size="small"
            prefixIcon={<Icons.DuplicateSmall />}
            onClick={copyToClipboard}
          >
            Copy Details
          </TextButton>
          <Button onClick={onClose}>Close</Button>
        </Box>
      </Box>
    </Modal>
  );
};

export const GlobalErrorHandler: React.FC<GlobalErrorHandlerProps> = observer(({ 
  error, 
  onClose 
}) => {
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  if (!error) return null;

  const handlePrimaryAction = () => {
    onClose();
  };

  const handleSecondaryAction = () => {
    setIsDetailsModalOpen(true);
  };

  return (
    <>
      <Box position="fixed" top="0" left="0" right="0" zIndex={1000}>
        <MessageBoxFunctionalLayout
          theme="red"
          onClose={onClose}
        >
          <Box direction="vertical" gap="12px">
            <Box direction="horizontal" align="space-between" verticalAlign="middle">
              <Box direction="vertical" gap="4px">
                <Text size="medium" weight="bold">Something went wrong</Text>
                <Text size="small" secondary>Error ID: {error.id}</Text>
              </Box>
            </Box>
            
            <Text size="medium">{error.effectiveUserMessage}</Text>
            
            <Box direction="horizontal" gap="12px" paddingTop="8px">
              <Button
                size="small"
                skin="destructive"
                onClick={handlePrimaryAction}
              >
                Dismiss
              </Button>
              <TextButton
                size="small"
                onClick={handleSecondaryAction}
              >
                View Details
              </TextButton>
            </Box>
          </Box>
        </MessageBoxFunctionalLayout>
      </Box>
      
      {isDetailsModalOpen && (
        <ErrorDetailsModal
          isOpen={isDetailsModalOpen}
          error={error}
          onClose={() => setIsDetailsModalOpen(false)}
        />
      )}
    </>
  );
});