import { members } from '@wix/members';
import { auth } from '@wix/essentials';
import { AppError } from '../../dashboard/services/AppError/AppError';
import { ErrorCategory, ErrorSeverity } from '../../dashboard/services/AppError/ErrorCategories';
import { Member, MemberSchema, MemberStatus } from '../entities/member';

export interface MemberFilter {
	status?: MemberStatus[];
}


/**
 * Members Service - Class-based service for member operations
 * This service provides utilities for interacting with external Wix APIs
 * It should be side-effect-free and reusable across the application
 */
export class MembersService {
	// Elevated permissions for accessing member and contact data
	private static elevatedGetMember = auth.elevate(members.getMember);
	private static elevatedQueryMembers = auth.elevate(members.queryMembers);
	private static elevatedGetMemberExtended = auth.elevate(members.getMember);

	/**
	 * Retrieves email address from a Wix member ID by fetching the associated contact
	 * @param memberId - The Wix member ID
	 * @returns Promise<string> - The member's primary email address
	 * @throws AppError if member or contact not found, or if no email is available
	 */
	static async getEmailFromMemberId(memberId: string): Promise<string> {
		try {
			// Get the member first to get the contact ID
			const member = await MembersService.elevatedGetMember(memberId);

			if (!member?.loginEmail) {
				throw new AppError({
					category: ErrorCategory.CONFIGURATION,
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
			if (AppError.isAppError(error)) throw error

			throw AppError.wrap(error as Error, {
				category: ErrorCategory.WIXPLATFORM,
				technicalMessage: `Failed to retrieve email for member ID: ${memberId}`,
				userMessage: 'Unable to retrieve member information',
				source: 'getEmailFromMemberId',
				layer: 'service',
				severity: ErrorSeverity.HIGH,
				context: { memberId }
			});
		}
	}

	/**
	 * Retrieves a single Wix member by ID
	 * @param memberId - The Wix member ID
	 * @returns Promise<Member> - The member object with profile and status information
	 * @throws AppError if retrieval fails
	 */
	static async getMemberById(memberId: string): Promise<Member> {
		try {
			// Get the member with extended fieldset to include profile and status
			const member = await MembersService.elevatedGetMemberExtended(memberId, { fieldsets: ['EXTENDED'] });

			return MemberSchema.parse(member);
		} catch (error) {
			// Wrap other errors
			throw AppError.wrap(error as Error, {
				category: ErrorCategory.WIXPLATFORM,
				technicalMessage: `Failed to retrieve member by ID: ${memberId}`,
				userMessage: 'Unable to retrieve member information',
				source: 'getMemberById',
				layer: 'service',
				severity: ErrorSeverity.HIGH,
				context: { memberId }
			});
		}
	}

	/**
	 * Retrieves Wix members with optional filtering
	 * @param filter - Filter object with status array. Default: { status: ['APPROVED'] }
	 * @returns Promise<Member[]> - Array of member objects
	 */
	static async getAllMembers(filter: MemberFilter = { status: ['APPROVED'] }): Promise<Member[]> {
		try {
			const query = MembersService.elevatedQueryMembers({fieldsets: ['EXTENDED']});

			const response = await query.find();

			if (!response?.items) {
				return [];
			}

			// Filter by status after fetching (Wix Members API doesn't support status filtering in query)
			let filteredMembers = response.items;
			if (filter.status && filter.status.length > 0) {
				filteredMembers = response.items.filter((member: any) => filter.status!.includes(member.status));
			}

			return filteredMembers.map(member => MemberSchema.parse(member))
		} catch (error) {
			// Wrap other errors
			throw AppError.wrap(error as Error, {
				category: ErrorCategory.WIXPLATFORM,
				technicalMessage: 'Failed to fetch members list from Wix Members API',
				userMessage: 'Unable to load member list',
				source: 'getAllMembers',
				layer: 'service',
				severity: ErrorSeverity.MEDIUM,
				context: { statusFilter: filter.status }
			});
		}
	}
}

export default MembersService;
