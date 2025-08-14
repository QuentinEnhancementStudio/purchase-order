import { webMethod, Permissions } from '@wix/web-methods';
import { Member, MemberBase } from '../entities/member';
import MemberService from '../services/members';
import { AppError } from '../../dashboard/services/AppError/AppError';
import { ErrorCategory, ErrorSeverity } from '../../dashboard/services/AppError/ErrorCategories';

/**
 * Get all members with optional filtering
 */
export const queryMembers = webMethod(
  Permissions.Admin,
  async (): Promise<Member[]> => {
	try {
		return MemberService.getAllMembers();
	} catch (error) {
		const appError = new AppError({
			category: ErrorCategory.SERVER,
			technicalMessage: `Failed to query members: ${error instanceof Error ? error.message : String(error)}`,
			userMessage: 'Unable to load members list',
			source: 'queryMembers',
			layer: 'webMethod',
			severity: ErrorSeverity.MEDIUM,
			context: { }
		});
		
		appError.log();

		return Promise.reject(appError.toJSON());
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
		  // If error is already an AppError, re-throw it
		  if (error instanceof AppError) {
			  error.log();
			  return Promise.reject(error.toJSON());
		  }

		  // Wrap other errors in AppError
		  const appError = new AppError({
			  category: ErrorCategory.SERVER,
			  technicalMessage: `Failed to get member by ID: ${error instanceof Error ? error.message : String(error)}`,
			  userMessage: 'Unable to load member details',
			  source: 'getMemberById',
			  layer: 'webMethod',
			  severity: ErrorSeverity.MEDIUM,
			  context: { memberId}
		  });

		  appError.log();
		  return Promise.reject(appError.toJSON());
	  }
  }
);
