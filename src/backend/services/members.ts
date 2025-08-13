import { members } from '@wix/members';
import { auth } from '@wix/essentials';
import { AppError } from '../../dashboard/services/AppError/AppError';
import { ErrorCategory, ErrorSeverity } from '../../dashboard/services/AppError/ErrorCategories';

/**
 * Partner Service - Pure functional service for partner operations
 * This service provides utilities for interacting with external Wix APIs
 * It should be side-effect-free and reusable across the application
 */

// Elevated permissions for accessing member and contact data
const elevatedGetMember = auth.elevate(members.getMember);
const elevatedQueryMembers = auth.elevate(members.queryMembers);

/**
 * Retrieves email address from a Wix member ID by fetching the associated contact
 * @param memberId - The Wix member ID
 * @returns Promise<string> - The member's primary email address
 * @throws AppError if member or contact not found, or if no email is available
 */
export async function getEmailFromMemberId(memberId: string): Promise<string> {
  try {
    // Get the member first to get the contact ID
    const member = await elevatedGetMember(memberId);
	
	if (!member?.loginEmail) {
	  throw new AppError({
	    category: ErrorCategory.SERVER,
	    technicalMessage: `Member not found or has no login email: ${memberId}`,
	    userMessage: 'Member information could not be retrieved',
	    source: 'getEmailFromMemberId',
	    layer: 'service',
	    severity: ErrorSeverity.HIGH,
	    context: { memberId }
	  });
	}
	
    // Return primary email or first available email
    return member.loginEmail;
  } catch (error) {
    console.error('Error getting email from member ID:', error);    
    // Wrap other errors
    throw AppError.wrap(error as Error, {
      category: ErrorCategory.SERVER,
      technicalMessage: `Failed to retrieve email for member ID: ${memberId}`,
      userMessage: 'Unable to retrieve member information',
      source: 'getEmailFromMemberId',
      layer: 'service',
      severity: ErrorSeverity.HIGH,
      context: { memberId }
    });
  }
}

export interface MemberOption {
  id: string;
  displayName: string;
  email: string;
}

/**
 * Retrieves Wix members for use in dropdowns/selectors with optional status filtering
 * @param statusFilter - Array of member statuses to include. If empty array, returns all members. Default: ['APPROVED']
 * @returns Promise<MemberOption[]> - Array of member options with id, displayName, and email
 */
export async function getAllMembers(statusFilter: string[] = ['APPROVED']): Promise<MemberOption[]> {
  try {
    // Need to use EXTENDED fieldset to get status field for filtering
    const query = elevatedQueryMembers({ 
      fieldsets: ['EXTENDED'] 
    });
    
    const response = await query.find();
    
    if (!response?.items) {
      return [];
    }
    
    // Filter by status after fetching (Wix Members API doesn't support status filtering in query)
    let filteredMembers = response.items;
    if (statusFilter.length > 0) {
      filteredMembers = response.items.filter((member: any) => 
        statusFilter.includes(member.status)
      );
    }
    // If statusFilter is empty array, no filtering is applied (returns all members)
    
    return filteredMembers.map((member: any) => ({
      id: member._id!,
      displayName: `${member.profile?.firstName || ''} ${member.profile?.lastName || ''}`.trim() || member.loginEmail || member._id!,
      email: member.loginEmail || ''
    })).filter((member: MemberOption) => member.id && member.email); // Only include members with valid id and email
  } catch (error) {
    console.error('Error fetching members:', error);
    
    // Re-throw AppError without wrapping
    if (AppError.isAppError(error)) {
      throw error;
    }
    
    // Wrap other errors
    throw AppError.wrap(error as Error, {
      category: ErrorCategory.SERVER,
      technicalMessage: 'Failed to fetch members list from Wix Members API',
      userMessage: 'Unable to load member list',
      source: 'getAllMembers',
      layer: 'service',
      severity: ErrorSeverity.MEDIUM,
      context: { statusFilter }
    });
  }
}