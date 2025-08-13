import { Partner, PartnerStatus } from '../../../types';

export type ConfirmationType = 'delete' | 'status-change';

export interface ConfirmationModalProps {
  isOpen: boolean;
  type: ConfirmationType;
  partner: Partner | null;
  newStatus?: PartnerStatus;
  isLoading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export interface DeleteConfirmationProps {
  partner: Partner;
  confirmationText: string;
  onConfirmationTextChange: (text: string) => void;
}

export interface StatusChangeConfirmationProps {
  partner: Partner;
  currentStatus: PartnerStatus;
  newStatus: PartnerStatus;
}