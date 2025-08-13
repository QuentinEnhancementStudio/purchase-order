import React from 'react';
import { MessageBoxFunctionalLayout, Text } from '@wix/design-system';

interface SuccessMessageProps {
  message: string;
  onClose?: () => void;
  autoClose?: boolean;
  duration?: number;
  closable?: boolean;
}

export const SuccessMessage: React.FC<SuccessMessageProps> = ({ 
  message, 
  onClose, 
  autoClose = false,
  duration = 3000,
  closable = true
}) => {
  React.useEffect(() => {
    if (autoClose && onClose) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [autoClose, onClose, duration]);

  const handleClose = closable && onClose ? onClose : undefined;

  return (
    <MessageBoxFunctionalLayout
      theme="blue"
      onClose={handleClose}
    >
      <Text size="medium">{message}</Text>
    </MessageBoxFunctionalLayout>
  );
};