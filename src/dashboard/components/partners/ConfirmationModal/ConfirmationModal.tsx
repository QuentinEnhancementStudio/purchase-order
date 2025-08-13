import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react';
import {
  Modal,
  MessageModalLayout,
  CustomModalLayout,
  Box,
  Text,
  Input,
  FormField,
  Dropdown,
  MessageBoxFunctionalLayout
} from '@wix/design-system';
import * as Icons from '@wix/wix-ui-icons-common';

import { StatusBadge } from '../../common';
import { ConfirmationModalProps } from './ConfirmationModal.types';
import { PartnerStatus } from '../../../types';
import { getStatusDisplayName, getAvailableStatusTransitions } from '../../../../backend/entities/partner';

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

function renderStatusChangeContent({
  partner,
  currentStatus,
  newStatus,
  onStatusChange
}: {
  partner: any;
  currentStatus: PartnerStatus;
  newStatus: PartnerStatus;
  onStatusChange: (status: PartnerStatus) => void;
}) {
  const availableTransitions = getAvailableStatusTransitions(currentStatus);
  const statusOptions = availableTransitions.map(status => ({
    id: status,
    value: getStatusDisplayName(status)
  }));

  return (
    <Box direction="vertical" gap="20px">
      <Box direction="vertical" gap="12px">
        <Text size="medium" secondary>
          You are changing the status for: <Text weight="bold">{partner.companyName}</Text>
        </Text>
      </Box>
      
      <Box direction="vertical" gap="16px">
        <Box align="space-between">
          <Box direction="vertical" gap="4px">
            <Text size="small" secondary>Current Status</Text>
            <StatusBadge status={currentStatus} />
          </Box>
          <Icons.ChevronRight />
          <Box direction="vertical" gap="4px">
            <Text size="small" secondary>New Status</Text>
            <StatusBadge status={newStatus} />
          </Box>
        </Box>

        <FormField
          label="Select New Status"
          labelPlacement="top"
        >
          <Dropdown
            placeholder="Select new status"
            options={statusOptions}
            selectedId={newStatus}
            onSelect={(option) => onStatusChange(option?.id as PartnerStatus || currentStatus)}
          />
        </FormField>

        <MessageBoxFunctionalLayout theme="blue">
          <Text size="small">
            Changing partner status will immediately affect their access to wholesale features and pricing.
          </Text>
        </MessageBoxFunctionalLayout>
      </Box>
    </Box>
  );
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = observer(({
  isOpen,
  type,
  partner,
  newStatus: initialNewStatus,
  isLoading,
  onConfirm,
  onCancel
}) => {
  const [confirmationText, setConfirmationText] = useState('');
  const [selectedNewStatus, setSelectedNewStatus] = useState<PartnerStatus>(
    initialNewStatus || 'active'
  );

  useEffect(() => {
    if (isOpen) {
      setConfirmationText('');
      if (initialNewStatus) {
        setSelectedNewStatus(initialNewStatus);
      }
    }
  }, [isOpen, initialNewStatus]);

  if (!partner) return null;

  function handleConfirm() {
    if (type === 'delete' && confirmationText !== 'DELETE') {
      return;
    }
    onConfirm();
  }

  function handleCancel() {
    if (!isLoading) {
      onCancel();
    }
  }

  const isDeleteConfirmation = type === 'delete';
  const canConfirm = isDeleteConfirmation 
    ? confirmationText === 'DELETE'
    : selectedNewStatus !== partner.status;

  const title = isDeleteConfirmation ? 'Delete Partner' : 'Change Partner Status';

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={handleCancel}
      shouldCloseOnOverlayClick={!isLoading}
      screen="desktop"
    >
      {isDeleteConfirmation ? (
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
      ) : (
        <CustomModalLayout
          title={title}
          primaryButtonText={isLoading ? 'Updating...' : 'Update Status'}
          secondaryButtonText="Cancel"
          primaryButtonOnClick={handleConfirm}
          secondaryButtonOnClick={handleCancel}
          onCloseButtonClick={handleCancel}
          primaryButtonProps={{ disabled: isLoading || !canConfirm }}
          secondaryButtonProps={{ disabled: isLoading }}
          content={
            renderStatusChangeContent({
              partner,
              currentStatus: partner.status,
              newStatus: selectedNewStatus,
              onStatusChange: setSelectedNewStatus
            })
          }
        />
      )}
    </Modal>
  );
});