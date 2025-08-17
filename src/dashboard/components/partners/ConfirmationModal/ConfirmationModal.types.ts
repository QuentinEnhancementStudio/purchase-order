import { Partner } from '../../../types';

export interface ConfirmationModalProps {
  isOpen: boolean;
  type: 'delete';
  partner: Partner | null;
  isLoading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}