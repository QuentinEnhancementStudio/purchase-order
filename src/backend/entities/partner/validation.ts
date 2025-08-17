import { ValidationService, type ValidationResult } from '../../services/validation/validation';
import {
  PartnerSchema,

  type Partner,

} from './schemas';

/**
 * Partner status validation with business logic
 */
export function validateStatusTransition(currentStatus: Partner['status'], newStatus: Partner['status']): boolean {
  const allowedTransitions: Record<Partner['status'], Partner['status'][]> = {
    active: ['inactive'],
    inactive: ['active']
  };

  return allowedTransitions[currentStatus]?.includes(newStatus) || false;
}

