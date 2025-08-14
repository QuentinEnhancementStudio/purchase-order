import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react';
import {
  Modal,
  MessageModalLayout,
  Box,
  Text,
  Input,
  FormField,
  MessageBoxFunctionalLayout
} from '@wix/design-system';

import { ConfirmationModalProps } from './ConfirmationModal.types';

function renderDeleteConfirmationContent({ 
  partner, 
  confirmationText, 
  onConfirmationTextChange, 
  isLoading 
}: {
  partner: any;
  confirmationText: string;
  onConfirmationTextChange: (text: string) => void;
  isLoading: boolean;
}) {
  return (
    <Box direction="vertical" gap="16px">
      <MessageBoxFunctionalLayout theme="red">
        <Text size="medium" weight="bold">
          {partner.companyName}
        </Text>
      </MessageBoxFunctionalLayout>
      <Box direction="vertical" gap="8px">
        <Text size="medium" secondary>
          This action cannot be undone. All partner data will be permanently removed.
        </Text>
        <Text size="medium" weight="bold">
          To confirm, please type "DELETE" in the field below:
        </Text>
      </Box>
      <FormField labelPlacement="top">
        <Input
          value={confirmationText}
          onChange={(e) => onConfirmationTextChange(e.target.value)}
          placeholder="Type DELETE to confirm"
          disabled={isLoading}
          autoFocus
        />
      </FormField>
    </Box>
  );
}


export const ConfirmationModal: React.FC<ConfirmationModalProps> = observer(({
  isOpen,
  type,
  partner,
  isLoading,
  onConfirm,
  onCancel
}) => {
  const [confirmationText, setConfirmationText] = useState('');

  useEffect(() => {
    if (isOpen) {
      setConfirmationText('');
    }
  }, [isOpen]);

  if (!partner) return null;

  function handleConfirm() {
    if (confirmationText !== 'DELETE') {
      return;
    }
    onConfirm();
  }

  function handleCancel() {
    if (!isLoading) {
      onCancel();
    }
  }

  const canConfirm = confirmationText === 'DELETE';
  const title = 'Delete Partner';

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={handleCancel}
      shouldCloseOnOverlayClick={!isLoading}
      screen="desktop"
    >
      <MessageModalLayout
        title={title}
        primaryButtonText={isLoading ? 'Deleting...' : 'Delete Partner'}
        secondaryButtonText="Cancel"
        primaryButtonOnClick={handleConfirm}
        secondaryButtonOnClick={handleCancel}
        onCloseButtonClick={handleCancel}
        primaryButtonProps={{ 
          disabled: isLoading || !canConfirm, 
          skin: 'destructive' 
        }}
        secondaryButtonProps={{ disabled: isLoading }}
        content={
          <Box direction="vertical" gap="16px">
            <Text size="medium">
              You are about to permanently delete the partner:
            </Text>
            {renderDeleteConfirmationContent({
              partner,
              confirmationText,
              onConfirmationTextChange: setConfirmationText,
              isLoading
            })}
          </Box>
        }
      />
    </Modal>
  );
});