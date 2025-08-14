import { webMethod, Permissions } from '@wix/web-methods';
import { z } from 'zod';
import { validateStatusTransition } from '../entities/partner';
import { PartnersRepository } from '../repositories/partners';
import { ValidationService } from '../services/validation';
import { Partner, PartnerStatusSchema, PartnerSchema } from '../entities/partner/schemas';
import { CompanyNameStrictSchema, MemberIdSchema, GlobalDiscountPercentageSchema, PartnerBase, PartnerBaseSchema } from '../entities/partner/schemas';
import { PaginationSchema, PartnerSortingSchema } from '../services/validation';
import { AppError } from '../../dashboard/services/AppError/AppError';
import { ErrorCategory, ErrorSeverity } from '../../dashboard/services/AppError/ErrorCategories';

const partnersRepository = new PartnersRepository();

/**
 * TODO
 * - add custom logger
 * - add custom error handling with proper error codes so that frontend can handle them
 * - seek difference between queryPartners and searchPartners
 */

const PartnerIdParamSchema = z.string().min(1, 'Partner ID is required').trim();


const QueryPartnersFiltersSchema = z.object({
	status: PartnerStatusSchema.optional(),
	searchTerm: z.string().optional(),
	pagination: PaginationSchema.optional(),
	sorting: PartnerSortingSchema.optional()
}).optional();

const SearchPartnersCriteriaSchema = z.object({
	searchTerm: z.string().default(''),
	status: PartnerStatusSchema.optional(),
	pagination: PaginationSchema.default({ number: 1, size: 25 }),
	sorting: PartnerSortingSchema.default({ field: 'companyName', direction: 'asc' })
});

// Note: PartnerUpdateInputSchema removed - updatePartner now uses complete Partner objects

// Type aliases for better readability
type QueryPartnersFilters = z.infer<typeof QueryPartnersFiltersSchema>;
// Input type for search (allowing partial input since schema has defaults)
type SearchPartnersInput = z.input<typeof SearchPartnersCriteriaSchema>;

/**
 * Get all partners with optional filtering and pagination
 */
export const queryPartners = webMethod(
	Permissions.Admin,
	async (filters?: QueryPartnersFilters): Promise<Partner[]> => {
		try {
			const validationResult = ValidationService.validate(QueryPartnersFiltersSchema, filters, 'Query filters');
			if (!validationResult.success) {
				throw new Error(`Invalid filters: ${validationResult.errors?.join(', ')}`);
			}

			const validatedFilters = validationResult.data;

			if (validatedFilters && Object.keys(validatedFilters).length > 0) {
				// Use search with filters
				const pagination = validatedFilters.pagination;
				const searchFilters = {
					status: validatedFilters.status,
					companyName: validatedFilters.searchTerm,
					email: validatedFilters.searchTerm,
					limit: pagination?.size,
					skip: pagination ? (pagination.number - 1) * pagination.size : undefined
				};

				return await partnersRepository.searchPartners(searchFilters);
			}

			// Return all partners if no filters
			return await partnersRepository.getAllPartners();
		} catch (error) {
			const appError = new AppError({
				category: ErrorCategory.SERVER,
				technicalMessage: `Failed to query partners: ${error instanceof Error ? error.message : String(error)}`,
				userMessage: 'Unable to load partners list',
				source: 'queryPartners',
				layer: 'webMethod',
				severity: ErrorSeverity.MEDIUM,
				context: { filters }
			});

			appError.log();

			return Promise.reject(appError.toJSON());
		}
	}
);

/**
 * Get partner by ID
 */
export const getPartnerById = webMethod(
	Permissions.Admin,
	async (partnerId: string): Promise<Partner> => {
		try {
			const validationResult = ValidationService.validate(PartnerIdParamSchema, partnerId, 'Partner ID');
			if (!validationResult.success) {
				throw new Error(`Invalid partner ID: ${validationResult.errors?.join(', ')}`);
			}

			const partner = await partnersRepository.getPartnerById(validationResult.data!);
			if (!partner) {
				throw new Error('Partner not found');
			}

			return partner;
		} catch (error) {
			const appError = new AppError({
				category: ErrorCategory.SERVER,
				technicalMessage: `Failed to get partner by ID: ${error instanceof Error ? error.message : String(error)}`,
				userMessage: 'Unable to load partner details',
				source: 'getPartnerById',
				layer: 'webMethod',
				severity: ErrorSeverity.MEDIUM,
				context: { partnerId }
			});

			appError.log();

			return Promise.reject(appError.toJSON());
		}
	}
);

/**
 * Create a new partner
 */
export const createPartner = webMethod(
	Permissions.Admin,
	async (partnerData: PartnerBase): Promise<Partner> => {
		try {
			// Validate input using PartnerCreateInputSchema
			const validationResult = ValidationService.validate(PartnerBaseSchema, partnerData, 'Partner creation data');
			if (!validationResult.success) {
				throw new Error(`Validation failed: ${validationResult.errors?.join(', ')}`);
			}

			const validatedInput = validationResult.data!;

			// Prepare complete input data
			const validatedData: Omit<Partner, '_id' | '_createdDate' | '_updatedDate' | '_owner'> = {
				companyName: validatedInput.companyName,
				memberId: validatedInput.memberId,
				globalDiscountPercentage: validatedInput.globalDiscountPercentage,
				status: validatedInput.status,
			};

			// Check for duplicate Wix member ID
			const isMemberIdTaken = await partnersRepository.isMemberIdTaken(validatedData.memberId!);
			if (isMemberIdTaken) {
				throw new Error('A partner with this member already exists');
			}

			// Create partner
			const partner = await partnersRepository.createPartner(validatedData);

			console.log(`Partner created successfully: ${partner.companyName} (${partner._id})`);
			return partner;
		} catch (error) {
			const appError = new AppError({
				category: ErrorCategory.SERVER,
				technicalMessage: `Failed to create partner: ${error instanceof Error ? error.message : String(error)}`,
				userMessage: 'Unable to create partner',
				source: 'createPartner',
				layer: 'webMethod',
				severity: ErrorSeverity.HIGH,
				context: { partnerData }
			});

			appError.log();

			return Promise.reject(appError.toJSON());
		}
	}
);

/**
 * Update an existing partner
 */
export const updatePartner = webMethod(
	Permissions.Admin,
	async (partner: Partner): Promise<Partner> => {
		try {
			// Validate complete partner object using Zod schema
			const validationResult = ValidationService.validate(PartnerSchema, partner, 'Partner');
			if (!validationResult.success) {
				throw new Error(`Invalid partner data: ${validationResult.errors?.join(', ')}`);
			}

			const validatedPartner = validationResult.data!;

			// Check that partner exists
			const existingPartner = await partnersRepository.getPartnerById(validatedPartner._id);
			if (!existingPartner) {
				throw new Error('Partner not found');
			}

			// Validate status transition if status changed
			if (validatedPartner.status !== existingPartner.status) {
				const isValidTransition = validateStatusTransition(existingPartner.status, validatedPartner.status);
				if (!isValidTransition) {
					throw new Error(`Invalid status transition from ${existingPartner.status} to ${validatedPartner.status}`);
				}
			}

			// Check memberId uniqueness if memberId changed
			if (validatedPartner.memberId !== existingPartner.memberId) {
				const existingPartnerWithMemberId = await partnersRepository.getPartnerByMemberId(validatedPartner.memberId);
				if (existingPartnerWithMemberId && existingPartnerWithMemberId._id !== validatedPartner._id) {
					throw new Error('Another partner is already using this Wix member ID');
				}
			}

			// Update partner using repository
			const updatedPartner = await partnersRepository.updatePartner(validatedPartner);

			console.log(`Partner updated successfully: ${updatedPartner.companyName} (${updatedPartner._id})`);
			return updatedPartner;
		} catch (error) {
			const appError = new AppError({
				category: ErrorCategory.SERVER,
				technicalMessage: `Failed to update partner: ${error instanceof Error ? error.message : String(error)}`,
				userMessage: 'Unable to update partner',
				source: 'updatePartner',
				layer: 'webMethod',
				severity: ErrorSeverity.HIGH,
				context: { partner }
			});

			appError.log();

			return Promise.reject(appError.toJSON());
		}
	}
);

/**
 * Delete a partner (hard delete)
 */
export const deletePartner = webMethod(
	Permissions.Admin,
	async (partnerId: string): Promise<Partner> => {
		try {
			// Validate partner ID using Zod schema
			const validationResult = ValidationService.validate(PartnerIdParamSchema, partnerId, 'Partner ID');
			if (!validationResult.success) {
				throw new Error(`Invalid partner ID: ${validationResult.errors?.join(', ')}`);
			}

			const validatedPartnerId = validationResult.data!;

			// Get partner first to validate it exists
			const existingPartner = await partnersRepository.getPartnerById(validatedPartnerId);
			if (!existingPartner) {
				throw new Error('Partner not found');
			}

			// Perform hard delete
			const deletedPartner = await partnersRepository.removePartner(validatedPartnerId);

			console.log(`Partner deleted successfully: ${deletedPartner.companyName} (${deletedPartner._id})`);

			return deletedPartner;
		} catch (error) {
			const appError = new AppError({
				category: ErrorCategory.SERVER,
				technicalMessage: `Failed to delete partner: ${error instanceof Error ? error.message : String(error)}`,
				userMessage: 'Unable to delete partner',
				source: 'deletePartner',
				layer: 'webMethod',
				severity: ErrorSeverity.HIGH,
				context: { partnerId }
			});

			appError.log();

			return Promise.reject(appError.toJSON());
		}
	}
);

/**
 * Search partners with advanced filtering
 */
export const searchPartners = webMethod(
	Permissions.Admin,
	async (searchCriteria: SearchPartnersInput = {}): Promise<{
		items: Partner[];
		totalItems: number;
		totalPages: number;
		currentPage: number;
		pageSize: number;
		hasNextPage: boolean;
		hasPreviousPage: boolean;
	}> => {
		try {
			// Validate search criteria using Zod schema
			const validationResult = ValidationService.validate(SearchPartnersCriteriaSchema, searchCriteria, 'Search criteria');
			if (!validationResult.success) {
				throw new Error(`Invalid search criteria: ${validationResult.errors?.join(', ')}`);
			}

			const validatedCriteria = validationResult.data!;

			// Use repository search capabilities with proper filtering and pagination
			const searchFilters = {
				status: validatedCriteria.status,
				companyName: validatedCriteria.searchTerm,
				email: validatedCriteria.searchTerm,
				limit: validatedCriteria.pagination.size,
				skip: (validatedCriteria.pagination.number - 1) * validatedCriteria.pagination.size
			};

			// Get filtered results first (without pagination) to get accurate count
			const allFilteredItems = await partnersRepository.searchPartners({
				...searchFilters,
				limit: undefined,
				skip: undefined
			});
			const totalItems = allFilteredItems.length;
			const totalPages = Math.ceil(totalItems / validatedCriteria.pagination.size);

			// Get paginated results
			const items = await partnersRepository.searchPartners(searchFilters);

			return {
				items,
				totalItems,
				totalPages,
				currentPage: validatedCriteria.pagination.number,
				pageSize: validatedCriteria.pagination.size,
				hasNextPage: validatedCriteria.pagination.number < totalPages,
				hasPreviousPage: validatedCriteria.pagination.number > 1
			};
		} catch (error) {
			const appError = new AppError({
				category: ErrorCategory.SERVER,
				technicalMessage: `Failed to search partners: ${error instanceof Error ? error.message : String(error)}`,
				userMessage: 'Unable to search partners',
				source: 'searchPartners',
				layer: 'webMethod',
				severity: ErrorSeverity.MEDIUM,
				context: { searchCriteria }
			});

			appError.log();

			return Promise.reject(appError.toJSON());
		}
	}
);

/**
 * Get partner statistics for dashboard
 */
export const getPartnerStats = webMethod(
	Permissions.Admin,
	async (): Promise<{
		totalPartners: number;
		activePartners: number;
		pendingPartners: number;
		inactivePartners: number;
		averageDiscount: number;
	}> => {
		try {
			const [total, active, pending, inactive] = await Promise.all([
				partnersRepository.count(),
				partnersRepository.countPartnersByStatus('active'),
				partnersRepository.countPartnersByStatus('pending'),
				partnersRepository.countPartnersByStatus('inactive')
			]);

			// Calculate average discount
			const allPartners = await partnersRepository.getAllPartners();
			const averageDiscount = allPartners.length > 0
				? allPartners.reduce((sum, partner) => sum + (partner.globalDiscountPercentage || 0), 0) / allPartners.length
				: 0;

			return {
				totalPartners: total,
				activePartners: active,
				pendingPartners: pending,
				inactivePartners: inactive,
				averageDiscount: Math.round(averageDiscount * 100) / 100 // Round to 2 decimal places
			};
		} catch (error) {
			const appError = new AppError({
				category: ErrorCategory.SERVER,
				technicalMessage: `Failed to get partner statistics: ${error instanceof Error ? error.message : String(error)}`,
				userMessage: 'Unable to load partner statistics',
				source: 'getPartnerStats',
				layer: 'webMethod',
				severity: ErrorSeverity.MEDIUM,
				context: {}
			});

			appError.log();

			return Promise.reject(appError.toJSON());
		}
	}
);