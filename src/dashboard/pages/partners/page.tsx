import React, { type FC, useEffect, useState } from 'react';
import { observer, useLocalObservable } from 'mobx-react';
import { runInAction, reaction, IReactionDisposer } from 'mobx';
import { Page, WixDesignSystemProvider, Box, MessageBoxFunctionalLayout } from '@wix/design-system';
import '@wix/design-system/styles.global.css';

import { useStore } from '../../stores/StoreContext';
import { PartnerFilter, PartnerSorting } from '../../stores/partnersStore';
import { Pagination } from '../../services/Pagination';
import {
	PartnersTable,
	PartnerFormModal,
	ConfirmationModal,
	SortField,
	SortDirection
} from '../../components/partners';
import { GlobalErrorHandler, SuccessMessage } from '../../components/common';
import { Partner } from '../../types';
import { PartnerBase } from '../../../backend/entities/partner/schemas';
import { AppError } from '../../services/AppError/AppError';

const PartnersPage: FC = observer(() => {
	const { partnersStore, membersStore } = useStore();

	// React state for non-reactive values
	const [successMessage, setSuccessMessage] = useState<string | null>(null);

	// MobX reactive state for values that benefit from reactivity
	const localState = useLocalObservable(() => ({
		// Modal state - reactive for UI updates
		isFormModalOpen: false,
		isConfirmationModalOpen: false,
		editingPartner: null as Partner | null,
		confirmationPartner: null as Partner | null,
		localError: null as AppError | null,

		// Grouped filter state
		filters: {
			keyword: '',
			status: ''
		} as PartnerFilter,

		// Grouped sorting state
		sorting: {
			field: 'companyName',
			direction: 'asc'
		} as PartnerSorting,

		// Grouped pagination state
		pagination: {
			currentPage: 1,
			pageSize: 25
		},

		// Computed filtered and sorted partners
		get filteredSortedPartners(): Partner[] {
			return partnersStore.getFilteredSortedPartners(this.filters, this.sorting);
		},

		// Computed paginated partners (using Pagination service)
		get paginatedPartners(): Partner[] {
			return Pagination.getPageItems(
				this.filteredSortedPartners,
				this.pagination.currentPage,
				this.pagination.pageSize
			);
		},

		// Computed pagination metadata (using Pagination service)
		get paginationMetadata() {
			return Pagination.getPaginationMetadata(
				this.filteredSortedPartners.length,
				this.pagination.currentPage,
				this.pagination.pageSize
			);
		}
	}));

	// Load partners and members on mount and setup reactions
	useEffect(() => {
		partnersStore.loadPartners();
		membersStore.loadMembers();

		// Create reaction disposers array
		const disposers: IReactionDisposer[] = [];

		// Reaction for partnersStore error
		disposers.push(
			reaction(
				() => partnersStore.error,
				(reason) => {
					if (!reason) return;
					localState.localError = reason;
				}
			)
		);
		// Reaction for membersStore error
		disposers.push(
			reaction(
				() => membersStore.error,
				(reason) => {
					if (!reason) return;
					localState.localError = reason;
				}
			)
		);
		// Reaction for createPartnerRequest
		disposers.push(
			reaction(
				() => partnersStore.loadPartnersRequest,
				(request) => {
					request.case({
						fulfilled: partners => { },
						rejected: (reason) => {
							runInAction(() => {
								localState.isFormModalOpen = false;
								localState.editingPartner = null;
							});
						},
					});
				}
			)
		);
		// Reaction for createPartnerRequest
		disposers.push(
			reaction(
				() => partnersStore.createPartnerRequest,
				(request) => {
					request.case({
						fulfilled: newPartner => {
							if (!newPartner) return;

							runInAction(() => {
								localState.isFormModalOpen = false;
								localState.editingPartner = null;
							});
							setSuccessMessage(`Partner "${newPartner.companyName}" has been created successfully.`);

							// Fade out success message after 3 seconds
							setTimeout(() => setSuccessMessage(null), 3000);
						},
						rejected: (reason) => {
							runInAction(() => {
								localState.isFormModalOpen = false;
								localState.editingPartner = null;
							});
						},
					});
				}
			)
		);

		// Reaction for updatePartnerRequest
		disposers.push(
			reaction(
				() => partnersStore.updatePartnerRequest,
				(request) => {
					request.case({
						fulfilled: updatedPartner => {
							if (!updatedPartner) return;

							runInAction(() => {
								localState.isFormModalOpen = false;
								localState.editingPartner = null;
								localState.isConfirmationModalOpen = false;
								localState.confirmationPartner = null;
							});
							setSuccessMessage(`Partner "${updatedPartner.companyName}" has been updated successfully.`);

							// Fade out success message after 3 seconds
							setTimeout(() => setSuccessMessage(null), 3000);
						},
						rejected: () => {
							runInAction(() => {
								localState.isFormModalOpen = false;
								localState.editingPartner = null;
								localState.isConfirmationModalOpen = false;
								localState.confirmationPartner = null;
							});
						},
					});
				}
			)
		);

		// Reaction for deletePartnerRequest
		disposers.push(
			reaction(
				() => partnersStore.deletePartnerRequest,
				(request) => {
					request.case({
						fulfilled: deletedPartner => {
							if (!deletedPartner) return;

							runInAction(() => {
								localState.isConfirmationModalOpen = false;
								localState.confirmationPartner = null;
							});
							setSuccessMessage(`Partner "${deletedPartner.companyName}" has been deleted successfully.`);

							// Fade out success message after 3 seconds
							setTimeout(() => setSuccessMessage(null), 3000);
						},
						rejected: () => {
							runInAction(() => {
								localState.isConfirmationModalOpen = false;
								localState.confirmationPartner = null;
							});
						},
					});
				}
			)
		);

		// Cleanup function
		return () => {
			disposers.forEach(dispose => dispose());
		};
	}, []);

	function getMemberDisplayName(memberId: string): string {
		const member = membersStore.getMemberById(memberId);
		return member?.contact?.displayName || 'Unknown Member';
	}

	function handleAddPartner() {
		localState.editingPartner = null;
		localState.isFormModalOpen = true;
	}

	function handleEditPartner(partner: Partner) {
		localState.editingPartner = partner;
		localState.isFormModalOpen = true;
	}

	function handleDeletePartner(partner: Partner) {
		localState.confirmationPartner = partner;
		localState.isConfirmationModalOpen = true;
	}

	function handleFormSave(data: PartnerBase) {
		if (localState.editingPartner) {
			// Update existing partner - merge with existing data
			const updatedPartner = {
				...localState.editingPartner,
				companyName: data.companyName,
				memberId: data.memberId,
				status: data.status,
				globalDiscountPercentage: data.globalDiscountPercentage
			};

			partnersStore.updatePartner(updatedPartner);
		} else {
			// Create new partner - only include fields that match Partner entity
			const partnerData = {
				companyName: data.companyName,
				memberId: data.memberId,
				status: data.status,
				globalDiscountPercentage: data.globalDiscountPercentage
			};

			console.log('Creating new partner with data:', partnerData);

			partnersStore.createPartner(partnerData);
		}
	}

	function handleFormCancel() {
		localState.isFormModalOpen = false;
		localState.editingPartner = null;
	}

	function handleConfirmationConfirm() {
		if (!localState.confirmationPartner) return;
		partnersStore.deletePartner(localState.confirmationPartner._id);
	}

	function handleConfirmationCancel() {
		localState.isConfirmationModalOpen = false;
		localState.confirmationPartner = null;
	}

	function handleSearchChange(query: string) {
		localState.filters.keyword = query;
		localState.pagination.currentPage = 1; // Reset to first page on search
	}

	function handleStatusFilterChange(status: string) {
		localState.filters.status = status;
		localState.pagination.currentPage = 1; // Reset to first page on filter change
	}

	// Filtered partners are now computed in localState

	function handleSortChange(field: SortField, direction: SortDirection) {
		localState.sorting.field = field as PartnerSorting['field'];
		localState.sorting.direction = direction;
		localState.pagination.currentPage = 1; // Reset to first page on sort change
	}

	function handlePageChange(page: number) {
		// Validate page number against pagination metadata
		if (page >= 1 && page <= localState.paginationMetadata.totalPages) {
			localState.pagination.currentPage = page;
		}
	}

	return (
		<WixDesignSystemProvider features={{ newColorsBranding: true }}>
			{/* Global Error Handler */}
			<GlobalErrorHandler
				error={localState.localError}
				onClose={() => localState.localError = null}
			/>

			<Page>
				<Page.Header
					title="Partners"
					subtitle="Manage your wholesale partners and their settings"
				/>
				<Page.Content>
					<Box direction="vertical" gap="16px">
						{/* Success Message */}
						{successMessage && (
							<SuccessMessage
								message={successMessage}
								onClose={() => setSuccessMessage(null)}
								autoClose
							/>
						)}

						{/* Partners Table */}
						<PartnersTable
							partners={localState.paginatedPartners}
							isLoading={partnersStore.isLoadingPartners}
							searchQuery={localState.filters.keyword || ''}
							statusFilter={localState.filters.status || ''}
							sortField={localState.sorting.field as SortField}
							sortDirection={localState.sorting.direction}
							currentPage={localState.paginationMetadata.currentPage}
							totalPages={localState.paginationMetadata.totalPages}
							itemsPerPage={localState.paginationMetadata.pageSize}
							getMemberDisplayName={getMemberDisplayName}
							onSearchChange={handleSearchChange}
							onStatusFilterChange={handleStatusFilterChange}
							onSortChange={handleSortChange}
							onPageChange={handlePageChange}
							onAddPartner={handleAddPartner}
							onEditPartner={handleEditPartner}
							onDeletePartner={handleDeletePartner}
						/>
					</Box>

					{/* Partner Form Modal */}
					<PartnerFormModal
						isOpen={localState.isFormModalOpen}
						partner={localState.editingPartner}
						isLoading={partnersStore.isCreatingPartner || partnersStore.isUpdatingPartner}
						members={membersStore.membersAsArray}
						isLoadingMembers={membersStore.isLoadingMembers}
						onSave={handleFormSave}
						onCancel={handleFormCancel}
					/>

					{/* Confirmation Modal */}
					<ConfirmationModal
						isOpen={localState.isConfirmationModalOpen}
						type="delete"
						partner={localState.confirmationPartner}
						isLoading={partnersStore.isDeletingPartner}
						onConfirm={handleConfirmationConfirm}
						onCancel={handleConfirmationCancel}
					/>
				</Page.Content>
			</Page>
		</WixDesignSystemProvider>
	);
});

export default PartnersPage;
