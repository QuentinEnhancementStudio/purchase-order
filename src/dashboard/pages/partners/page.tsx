import React, { type FC, useEffect, useState } from 'react';
import { observer, useLocalObservable } from 'mobx-react';
import { runInAction, reaction, IReactionDisposer } from 'mobx';
import { Page, WixDesignSystemProvider, Box, MessageBoxFunctionalLayout } from '@wix/design-system';
import '@wix/design-system/styles.global.css';

import { useStore } from '../../stores/StoreContext';
import {
	PartnersTable,
	PartnerFormModal,
	ConfirmationModal,
	SortField,
	SortDirection
} from '../../components/partners';
import { GlobalErrorHandler, SuccessMessage, ErrorMessage } from '../../components/common';
import { Partner, PartnerStatus } from '../../types';
import { PartnerBase } from '../../../backend/entities/partner/schemas';
import { AppError } from '../../services/AppError/AppError';

const PartnersPage: FC = observer(() => {
	const { partnersStore } = useStore();

	// React state for non-reactive values
	const [successMessage, setSuccessMessage] = useState<string | null>(null);
	const [confirmationType, setConfirmationType] = useState<'delete' | 'status-change'>('delete');
	const [pendingStatus, setPendingStatus] = useState<PartnerStatus>('active');

	// MobX reactive state for values that benefit from reactivity
	const localState = useLocalObservable(() => ({
		// Modal state - reactive for UI updates
		isFormModalOpen: false,
		isConfirmationModalOpen: false,
		editingPartner: null as Partner | null,
		confirmationPartner: null as Partner | null,
		localError: null as AppError | null,

		// Filter state - reactive for filtering
		statusFilter: '',

		// Computed filtered partners - reactive to statusFilter changes
		get filteredPartners(): Partner[] {
			const filter = this.statusFilter;
			return filter === ''
				? partnersStore.partnersAsArray
				: partnersStore.getFilteredPartners({ status: filter });
		}
	}));

	// Load partners on mount and setup reactions
	useEffect(() => {
		partnersStore.loadPartners();

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
		setConfirmationType('delete');
		localState.isConfirmationModalOpen = true;
	}

	function handleChangeStatus(partner: Partner) {
		localState.confirmationPartner = partner;
		setConfirmationType('status-change');
		setPendingStatus(partner.status === 'active' ? 'inactive' : 'active');
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

		if (confirmationType === 'delete') {
			partnersStore.deletePartner(localState.confirmationPartner._id);
		} else {
			partnersStore.updatePartner({ ...localState.confirmationPartner, status: pendingStatus });
		}
	}

	function handleConfirmationCancel() {
		localState.isConfirmationModalOpen = false;
		localState.confirmationPartner = null;
	}

	function handleSearchChange(query: string) {
		// TODO: Implement search functionality
		console.log('Search query:', query);
	}

	function handleStatusFilterChange(status: string) {
		localState.statusFilter = status;
	}

	// Filtered partners are now computed in localState

	function handleSortChange(field: SortField, direction: SortDirection) {
		// TODO: Implement sorting
		console.log('Sort:', field, direction);
	}

	function handlePageChange(page: number) {
		// TODO: Implement pagination
		console.log('Page change:', page);
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
							partners={localState.filteredPartners}
							isLoading={partnersStore.isLoadingPartners}
							searchQuery=""
							statusFilter={localState.statusFilter}
							sortField="companyName"
							sortDirection="asc"
							currentPage={1}
							totalPages={1}
							itemsPerPage={10}
							onSearchChange={handleSearchChange}
							onStatusFilterChange={handleStatusFilterChange}
							onSortChange={handleSortChange}
							onPageChange={handlePageChange}
							onAddPartner={handleAddPartner}
							onEditPartner={handleEditPartner}
							onDeletePartner={handleDeletePartner}
							onChangeStatus={handleChangeStatus}
						/>
					</Box>

					{/* Partner Form Modal */}
					<PartnerFormModal
						isOpen={localState.isFormModalOpen}
						partner={localState.editingPartner}
						isLoading={partnersStore.isCreatingPartner || partnersStore.isUpdatingPartner}
						onSave={handleFormSave}
						onCancel={handleFormCancel}
					/>

					{/* Confirmation Modal */}
					<ConfirmationModal
						isOpen={localState.isConfirmationModalOpen}
						type={confirmationType}
						partner={localState.confirmationPartner}
						newStatus={pendingStatus}
						isLoading={partnersStore.isDeletingPartner || partnersStore.isUpdatingPartner}
						onConfirm={handleConfirmationConfirm}
						onCancel={handleConfirmationCancel}
					/>
				</Page.Content>
			</Page>
		</WixDesignSystemProvider>
	);
});

export default PartnersPage;
