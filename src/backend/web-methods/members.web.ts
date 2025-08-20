import { webMethod, Permissions } from '@wix/web-methods';
import { Member, MemberBase } from '../entities/member';
import MemberService from '../services/members';
import { AppError } from '../../dashboard/services/AppError/AppError';
import { ErrorCategory, ErrorSeverity } from '../../dashboard/services/AppError/ErrorCategories';
import { handleWebMethodErrorResponse } from './utils';

/**
 * Get all members with optional filtering
 */
export const queryMembers = webMethod(
  Permissions.Admin,
  async (): Promise<Member[]> => {
	try {
		return MemberService.getAllMembers();
	} catch (error) {
		return handleWebMethodErrorResponse(error, undefined, 'Failed to query members', 'queryMembers', ErrorSeverity.MEDIUM);
	}
}
);

/**
 * Get member by ID
*/
export const getMemberById = webMethod(
	Permissions.Admin,
	async (memberId: string): Promise<Member | null> => {
	  try {
		  // Validate memberId is provided
		  if (!memberId || memberId.trim() === '') {
			  throw new AppError({
				  category: ErrorCategory.INPUT,
				  technicalMessage: 'Member ID is required',
				  userMessage: 'Member ID is required',
				  source: 'getMemberById',
				  layer: 'webMethod',
				  severity: ErrorSeverity.LOW,
				  context: { memberId }
			  });
		  }

		  return MemberService.getMemberById(memberId);
	  } catch (error) {
		  return handleWebMethodErrorResponse(error, undefined, 'Failed to get member by ID', 'getMemberById', ErrorSeverity.MEDIUM);
	  }
  }
);
