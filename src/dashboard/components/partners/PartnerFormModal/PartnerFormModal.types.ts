import { Partner, PartnerBase } from '../../../types';
import { Member } from '../../../../backend/entities/member';

export interface PartnerFormModalProps {
  isOpen: boolean;
  partner?: Partner | null;
  isLoading: boolean;
  members: Member[];
  isLoadingMembers: boolean;
  onSave: (data: PartnerBase) => void;
  onCancel: () => void;
}