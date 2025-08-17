import { Partner, PartnerBase, PartnerBaseSchema } from '../entities/partner/schemas';
import { WixCollectionsRepository } from './wix-data/wix-collections';
import { DataOperationOptions } from '../types/base-entity';

export class PartnersRepository extends WixCollectionsRepository<Partner> {
	protected readonly collectionName = '@code-enhancement-studio/purchase-order/Partners';
	protected readonly debugEnabled = false;

	/**
	 * Create a new partner
	 */
	async createPartner(partner: PartnerBase): Promise<Partner> {
		// Validate using PartnerBaseSchema
		const validatedData = PartnerBaseSchema.parse(partner);

		return await this.create(validatedData);
	}

	/**
	 * Get all partners
	 */
	async getAllPartners(): Promise<Partner[]> {
		return await this.findAll();
	}

	/**
	 * Find partner by ID
	 */
	async getPartnerById(id: string): Promise<Partner | null> {
		return await this.findById(id);
	}

	/**
	 * Find partner by member ID
	 */
	async getPartnerByMemberId(memberId: string): Promise<Partner | null> {
		return await this.findOneByField('memberId', memberId);
	}

	/**
	 * Find partner by email address
	 */
	async getPartnerByEmail(email: string): Promise<Partner | null> {
		throw new Error('Method not implemented. Please implement getPartnerByEmail in PartnersRepository.');

		/**
		 * @Claude
		 * Implementation using partner service to retrieve the member by email address
		 * Then look up the partner by the memberId
		 */
	}

	/**
	 * Update partner
	 */
	async updatePartner(updates: Partial<Partner> & { _id: string }): Promise<Partner> {
		return await this.update(updates);
	}

	/**
	 * Hard delete partner (removes from collection)
	 */
	async removePartner(id: string): Promise<Partner> {
		return await this.remove(id);
	}

	/**
	 * Search partners with advanced filters
	 */
	async searchPartners(filters: {
		status?: Partner['status'];
		companyName?: string;
		email?: string;
		memberId?: string;
		minDiscount?: number;
		maxDiscount?: number;
		limit?: number;
		skip?: number;
	}, options?: DataOperationOptions): Promise<Partner[]> {
		let query = this.query();

		// Apply filters
		if (filters.status) {
			query = query.eq('status', filters.status);
		}

		if (filters.companyName) {
			query = query.contains('companyName', filters.companyName);
		}

		if (filters.email) {
			throw new Error('Method not implemented. Please implement search Member by emails in PartnersRepository.');
			/**
			 * @Claude
			 * Implementation using  wix members API and querying the members by email address
			 * Then look up the partner by the memberId
			 */
		}

		if (filters.memberId) {
			query = query.eq('memberId', filters.memberId);
		}

		if (filters.minDiscount !== undefined) {
			query = query.ge('globalDiscountPercentage', filters.minDiscount);
		}

		if (filters.maxDiscount !== undefined) {
			query = query.le('globalDiscountPercentage', filters.maxDiscount);
		}

		// Apply pagination
		if (filters.limit) {
			query = query.limit(filters.limit);
		}

		if (filters.skip) {
			query = query.skip(filters.skip);
		}

		const result = await query.find(options);
		return result.items as unknown as Partner[];
	}

	/**
	 * Count partners by status
	 */
	async countPartnersByStatus(status: Partner['status'], options?: DataOperationOptions): Promise<number> {
		return await this.countByField('status', status, options);
	}


	/**
	 * Check if wixMemberId is already used by another partner
	 */
	async isMemberIdTaken(memberId: string): Promise<boolean> {
		const partners = await this.findByField('memberId', memberId);

		return partners.length > 0;
	}
}