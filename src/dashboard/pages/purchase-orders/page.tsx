import React, { type FC, useEffect, useState } from 'react';
import { observer, useLocalObservable } from 'mobx-react';
import { runInAction, reaction, IReactionDisposer } from 'mobx';
import { Page, WixDesignSystemProvider, Box, MessageBoxFunctionalLayout } from '@wix/design-system';
import '@wix/design-system/styles.global.css';

import { useStore } from '../../stores/StoreContext';
import { PurchaseOrderFilter, PurchaseOrderSorting } from '../../stores/purchaseOrdersStore';
import { Pagination } from '../../services/Pagination';
import { Links } from '../../services/Links';
import {
	PurchaseOrdersTable,
	SortField,
	SortDirection
} from '../../components/purchase-orders';
import { GlobalErrorHandler } from '../../components/common';
import { PurchaseOrder } from '../../types';
import { PurchaseOrderBase } from '../../../backend/entities/purchase-order/schemas';
import { AppError } from '../../services/AppError/AppError';

const PurchaseOrdersPage: FC = observer(() => {
	const { purchaseOrdersStore, partnersStore, membersStore } = useStore();

	// React state for non-reactive values

	// MobX reactive state for values that benefit from reactivity
	const localState = useLocalObservable(() => ({
		// Modal state - reactive for UI updates
		isFormModalOpen: false,
		isConfirmationModalOpen: false,
		editingPurchaseOrder: null as PurchaseOrder | null,
		confirmationPurchaseOrder: null as PurchaseOrder | null,
		localError: null as AppError | null,

		// Grouped filter state
		filters: {
			keyword: '',
			status: '',
			partnerId: ''
		} as PurchaseOrderFilter,

		// Grouped sorting state
		sorting: {
			field: 'identifier',
			direction: 'asc'
		} as PurchaseOrderSorting,

		// Grouped pagination state
		pagination: {
			currentPage: 1,
			pageSize: 25
		},

		// Computed filtered and sorted purchase orders with default status filtering
		get filteredSortedPurchaseOrders(): PurchaseOrder[] {
			// Handle special case for "all" filter to show truly all orders
			if (this.filters.status === 'all') {
				const filterWithoutStatus = {
					...this.filters,
					status: undefined
				};
				return purchaseOrdersStore.getFilteredSortedPurchaseOrders(filterWithoutStatus, this.sorting);
			}
			
			// Get all purchase orders with filtering and sorting
			const filtered = purchaseOrdersStore.getFilteredSortedPurchaseOrders(this.filters, this.sorting);
			
			// Apply default status filtering if no specific status filter is set (empty string)
			if (!this.filters.status) {
				return filtered.filter(po => 
					po.status === 'pending' || 
					po.status === 'approved' || 
					po.status === 'rejected'
				);
			}
			
			return filtered;
		},

		// Computed paginated purchase orders (using Pagination service)
		get paginatedPurchaseOrders(): PurchaseOrder[] {
			return Pagination.getPageItems(
				this.filteredSortedPurchaseOrders,
				this.pagination.currentPage,
				this.pagination.pageSize
			);
		},

		// Computed pagination metadata (using Pagination service)
		get paginationMetadata() {
			return Pagination.getPaginationMetadata(
				this.filteredSortedPurchaseOrders.length,
				this.pagination.currentPage,
				this.pagination.pageSize
			);
		}
	}));

	// Load purchase orders and members on mount and setup reactions
	useEffect(() => {
		purchaseOrdersStore.loadPurchaseOrders();
		partnersStore.loadPartners();
		membersStore.loadMembers();

		// Create reaction disposers array
		const disposers: IReactionDisposer[] = [];

		// Reaction for purchaseOrdersStore error
		disposers.push(
			reaction(
				() => purchaseOrdersStore.error,
				(reason) => {
					if (!reason) return;
					localState.localError = reason;
				}
			)
		);
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
		// Reaction for loadPurchaseOrdersRequest
		disposers.push(
			reaction(
				() => purchaseOrdersStore.loadPurchaseOrdersRequest,
				(request) => {
					request.case({
						fulfilled: purchaseOrders => { },
						rejected: (reason) => {
							runInAction(() => {
								localState.isFormModalOpen = false;
								localState.editingPurchaseOrder = null;
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

	function getPartnerDisplayName(partnerId: string): string {
		const partner = partnersStore.getPartnerById(partnerId);
		return partner?.companyName || 'Unknown Partner';
	}

	function handleAddPurchaseOrder() {
		localState.editingPurchaseOrder = null;
		localState.isFormModalOpen = true;
	}

	function handleEditPurchaseOrder(purchaseOrder: PurchaseOrder) {
		localState.editingPurchaseOrder = purchaseOrder;
		localState.isFormModalOpen = true;
	}

	function handleDeletePurchaseOrder(purchaseOrder: PurchaseOrder) {
		localState.confirmationPurchaseOrder = purchaseOrder;
		localState.isConfirmationModalOpen = true;
	}

	function handleFormSave(data: PurchaseOrderBase) {
		if (localState.editingPurchaseOrder) {
			// Update existing purchase order - merge with existing data
			const updatedPurchaseOrder = {
				...localState.editingPurchaseOrder,
				identifier: data.identifier,
				partnerId: data.partnerId,
				orderId: data.orderId,
				status: data.status,
				lastUpdate: data.lastUpdate
			};

			purchaseOrdersStore.updatePurchaseOrderOptimistic(updatedPurchaseOrder);
		} else {
			// Create new purchase order - only include fields that match PurchaseOrder entity
			const purchaseOrderData = {
				identifier: data.identifier,
				partnerId: data.partnerId,
				orderId: data.orderId,
				status: data.status,
				lastUpdate: data.lastUpdate
			};

			// Note: createPurchaseOrderOptimistic method would need to be added to the store
			// For now, we'll use updatePurchaseOrderOptimistic as a placeholder
			// purchaseOrdersStore.createPurchaseOrderOptimistic(purchaseOrderData);
		}

		// Close modal immediately (optimistic UI)
		localState.isFormModalOpen = false;
		localState.editingPurchaseOrder = null;
	}

	function handleFormCancel() {
		localState.isFormModalOpen = false;
		localState.editingPurchaseOrder = null;
	}

	function handleConfirmationConfirm() {
		if (!localState.confirmationPurchaseOrder) return;
		
		// Use optimistic delete for immediate UI feedback
		purchaseOrdersStore.deletePurchaseOrderOptimistic(localState.confirmationPurchaseOrder._id);
		
		// Close modal immediately (optimistic UI)
		localState.isConfirmationModalOpen = false;
		localState.confirmationPurchaseOrder = null;
	}

	function handleConfirmationCancel() {
		localState.isConfirmationModalOpen = false;
		localState.confirmationPurchaseOrder = null;
	}

	function handleGoToOrder(purchaseOrder: PurchaseOrder) {
		Links.Navigation.toOrder(purchaseOrder.orderId!);
	}

	function handleViewPurchaseOrder(purchaseOrder: PurchaseOrder) {
		Links.Navigation.editDraftOrder(purchaseOrder.draftOrderId!);
	}

	function handleSearchChange(query: string) {
		localState.filters.keyword = query;
		localState.pagination.currentPage = 1; // Reset to first page on search
	}

	function handleStatusFilterChange(status: string) {
		localState.filters.status = status;
		localState.pagination.currentPage = 1; // Reset to first page on filter change
	}

	// Filtered purchase orders are now computed in localState

	function handleSortChange(field: SortField, direction: SortDirection) {
		localState.sorting.field = field as PurchaseOrderSorting['field'];
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
					title="Purchase Orders"
					subtitle="Manage purchase orders and track their status"
				/>
				<Page.Content>
					<Box direction="vertical" gap="16px">
						{/* Purchase Orders Table */}
						<PurchaseOrdersTable
							purchaseOrders={localState.paginatedPurchaseOrders}
							isLoading={purchaseOrdersStore.isLoadingPurchaseOrders}
							searchQuery={localState.filters.keyword || ''}
							statusFilter={localState.filters.status || ''}
							sortField={localState.sorting.field as SortField}
							sortDirection={localState.sorting.direction}
							currentPage={localState.paginationMetadata.currentPage}
							totalPages={localState.paginationMetadata.totalPages}
							itemsPerPage={localState.paginationMetadata.pageSize}
							getPartnerDisplayName={getPartnerDisplayName}
							onSearchChange={handleSearchChange}
							onStatusFilterChange={handleStatusFilterChange}
							onSortChange={handleSortChange}
							onPageChange={handlePageChange}
							onAddPurchaseOrder={handleAddPurchaseOrder}
							onEditPurchaseOrder={handleEditPurchaseOrder}
							onDeletePurchaseOrder={handleDeletePurchaseOrder}
							onGoToOrder={handleGoToOrder}
							onViewPurchaseOrder={handleViewPurchaseOrder}
						/>
					</Box>
				</Page.Content>
			</Page>
		</WixDesignSystemProvider>
	);
});

export default PurchaseOrdersPage;