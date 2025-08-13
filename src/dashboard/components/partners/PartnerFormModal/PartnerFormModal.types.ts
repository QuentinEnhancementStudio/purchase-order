import { Partner, PartnerBase } from '../../../types';

export interface PartnerFormModalProps {
  isOpen: boolean;
  partner?: Partner | null;
  isLoading: boolean;
  onSave: (data: PartnerBase) => void;
  onCancel: () => void;
}