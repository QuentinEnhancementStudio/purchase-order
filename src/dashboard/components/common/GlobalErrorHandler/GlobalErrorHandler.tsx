import React, { useState } from 'react';
import { observer } from 'mobx-react';
import {
  Notification,
  MessageModalLayout,
  Modal,
  Text,
  TextButton,
  Box
} from '@wix/design-system';
import * as Icons from '@wix/wix-ui-icons-common';

import { AppError } from '../../../services/AppError';

interface GlobalErrorHandlerProps {
  error: AppError | null;
  onClose: () => void;
  onRetry?: () => void;
  retryLabel?: string;
  theme?: 'error' | 'warning' | 'success' | 'standard' | 'premium';
  show?: boolean;
}

interface ErrorDetailsModalProps {
  isOpen: boolean;
  error: AppError;
  onClose: () => void;
  onDismiss: () => void;
}

const ErrorDetailsModal: React.FC<ErrorDetailsModalProps> = ({ isOpen, error, onClose, onDismiss }) => {
  const formatTimestamp = (date: Date) => {
    return date.toLocaleString();
  };

  const copyToClipboard = async () => {
    const errorInfo = `
Error Details:
- Error ID: ${error.id}
- Category: ${error.category}
- Code: ${error.code || 'N/A'}
- Timestamp: ${formatTimestamp(error.timestamp)}
- Technical Message: ${error.technicalMessage || 'N/A'}
- User Message: ${error.userMessage || 'N/A'}
    `.trim();

    try {
      // Modern clipboard API
      await navigator.clipboard.writeText(errorInfo);
    } catch (err) {
      // Fallback for older browsers or when clipboard API is not available
      const textArea = document.createElement('textarea');
      textArea.value = errorInfo;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      textArea.style.left = '-9999px';
      document.body.appendChild(textArea);
      textArea.select();
      textArea.setSelectionRange(0, 99999); // For mobile devices
      try {
        // Keep the deprecated method as fallback - it still works
        const successful = document.execCommand('copy');
        if (!successful) {
          console.warn('Fallback copy method failed');
        }
      } catch (fallbackErr) {
        console.warn('Copy to clipboard failed:', fallbackErr);
      }
      document.body.removeChild(textArea);
    }
  };

  if (!isOpen) return null;

  const errorDetailsContent = (
    <Box direction="vertical" gap="12px">
      <Box direction="horizontal" gap="8px" verticalAlign="middle">
        <Text size="small" weight="bold" secondary>
          Category:
        </Text>
        <Text size="medium">
          {error.category.toUpperCase().replace('_', ' ')}
        </Text>
      </Box>
      
      {error.code && (
        <Box direction="vertical" gap="4px">
          <Text size="small" weight="bold" secondary>
            Error Code
          </Text>
          <Text size="medium">
            {error.code}
          </Text>
        </Box>
      )}
      
      <Box direction="horizontal" gap="8px" verticalAlign="middle">
        <Text size="small" weight="bold" secondary>
          Timestamp:
        </Text>
        <Text size="medium">
          {formatTimestamp(error.timestamp)}
        </Text>
      </Box>
      
      {error.technicalMessage && (
        <Box direction="vertical" gap="8px">
          <Text size="small" weight="bold" secondary>
            Technical Details:
          </Text>
          <Box 
            paddingTop="0px"
            paddingBottom="12px" 
            backgroundColor="D80" 
            borderRadius="8px"
            border="1px solid D60"
          >
            <Text size="small">
              {error.technicalMessage}
            </Text>
          </Box>
        </Box>
      )}
    </Box>
  );

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      shouldCloseOnOverlayClick={true}
      screen="desktop"
    >
      <MessageModalLayout
        title={error.effectiveUserMessage}
        primaryButtonText="Dismiss"
        secondaryButtonText="Close"
        onCloseButtonClick={onClose}
        primaryButtonOnClick={onDismiss}
        secondaryButtonOnClick={onClose}
        footnote={
          <Text size="small">
            Error ID: <a 
              onClick={async () => {
                try {
                  // Modern clipboard API
                  await navigator.clipboard.writeText(error.id);
                } catch (err) {
                  // Fallback for older browsers or when clipboard API is not available
                  const textArea = document.createElement('textarea');
                  textArea.value = error.id;
                  textArea.style.position = 'fixed';
                  textArea.style.opacity = '0';
                  textArea.style.left = '-9999px';
                  document.body.appendChild(textArea);
                  textArea.select();
                  textArea.setSelectionRange(0, 99999); // For mobile devices
                  try {
                    // Keep the deprecated method as fallback - it still works
                    const successful = document.execCommand('copy');
                    if (!successful) {
                      console.warn('Fallback copy method failed');
                    }
                  } catch (fallbackErr) {
                    console.warn('Copy error ID to clipboard failed:', fallbackErr);
                  }
                  document.body.removeChild(textArea);
                }
              }}
              style={{ cursor: 'pointer' }}
            >
              {error.id}
            </a>
          </Text>
        }
        sideActions={
          <TextButton
            size="tiny"
            prefixIcon={<Icons.DuplicateSmall />}
            onClick={copyToClipboard}
          >
            Copy Details
          </TextButton>
        }
      >
        {errorDetailsContent}
      </MessageModalLayout>
    </Modal>
  );
};

export const GlobalErrorHandler: React.FC<GlobalErrorHandlerProps> = observer(({ 
  error, 
  onClose,
  onRetry,
  retryLabel = 'Retry',
  theme = 'error',
  show = true
}) => {
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  if (!error || !show) return null;

  const handleSecondaryAction = () => {
    setIsDetailsModalOpen(true);
  };

  const handleDismiss = () => {
    setIsDetailsModalOpen(false);
    onClose();
  };

  const handleModalClose = () => {
    setIsDetailsModalOpen(false);
  };

  return (
    <>
      <Notification 
        theme={theme}
        show={show}
      >
        <Notification.TextLabel>
          {error.effectiveUserMessage}
        </Notification.TextLabel>
        
        {onRetry ? (
          <Notification.ActionButton onClick={onRetry}>
            {retryLabel}
          </Notification.ActionButton>
        ) : (
          <Notification.ActionButton type="textLink" onClick={handleSecondaryAction}>
            View Details
          </Notification.ActionButton>
        )}
        
        <Notification.CloseButton onClick={onClose} />
      </Notification>
      
      <ErrorDetailsModal
        isOpen={isDetailsModalOpen}
        error={error}
        onClose={handleModalClose}
        onDismiss={handleDismiss}
      />
    </>
  );
});