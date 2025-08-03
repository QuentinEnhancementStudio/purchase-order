import { Partner, PartnerStatus } from '../../types/entities/partner';
import { InputValidationService } from '../../services/validation/input-validation';

export class PartnerEntity {
  static validateCreateInput(data: Partial<Partner>): { isValid: boolean; errors?: string[] } {
    const errors: string[] = [];

    if (!data.companyName || data.companyName.trim().length === 0) {
      errors.push('Company name is required');
    }

    if (!data.contactInfo?.email || !InputValidationService.isValidEmail(data.contactInfo.email)) {
      errors.push('Valid email is required');
    }

    if (!data.contactInfo?.firstName || data.contactInfo.firstName.trim().length === 0) {
      errors.push('First name is required');
    }

    if (!data.contactInfo?.lastName || data.contactInfo.lastName.trim().length === 0) {
      errors.push('Last name is required');
    }

    return {
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
  }

  static validateStatusTransition(currentStatus: PartnerStatus, newStatus: PartnerStatus): boolean {
    const allowedTransitions: Record<PartnerStatus, PartnerStatus[]> = {
      pending: ['active', 'inactive'],
      active: ['inactive'],
      inactive: ['active']
    };

    return allowedTransitions[currentStatus]?.includes(newStatus) || false;
  }

  static generateIdentifier(companyName: string): string {
    const sanitized = companyName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    
    const timestamp = Date.now().toString(36);
    return `${sanitized}-${timestamp}`;
  }

  static isActive(partner: Partner): boolean {
    return partner.status === 'active';
  }

  static canCreateOrders(partner: Partner): boolean {
    return this.isActive(partner);
  }
}