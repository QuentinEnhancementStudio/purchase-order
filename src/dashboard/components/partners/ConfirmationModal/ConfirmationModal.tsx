import React from 'react';
import { observer } from 'mobx-react';
import {
  Modal,
  MessageModalLayout,
  Box,
  Text
} from '@wix/design-system';

import { ConfirmationModalProps } from './ConfirmationModal.types';


export const ConfirmationModal: React.FC<ConfirmationModalProps> = observer(({
  isOpen,
  type,
  partner,
  isLoading,
  onConfirm,
  onCancel
}) => {
  if (!partner) return null;

  function handleConfirm() {
    onConfirm();
  }

  function handleCancel() {
    if (!isLoading) {
      onCancel();
    }
  }

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
          disabled: isLoading, 
          skin: 'destructive' 
        }}
        secondaryButtonProps={{ disabled: isLoading }}
        content={
          <Box direction="vertical" gap="16px">
            <Text size="medium">
              You are about to permanently delete the partner:
            </Text>
            
            <Box 
              paddingTop="24px" 
              paddingBottom="24px" 
              align="center"
            >
              <Text size="medium" weight="bold">
                {partner.companyName}
              </Text>
            </Box>
          </Box>
        }
		footnote={
            <Text size="tiny" secondary>
              This action cannot be undone. All partner data will be permanently removed.
            </Text>
		}
      />
    </Modal>
  );
});