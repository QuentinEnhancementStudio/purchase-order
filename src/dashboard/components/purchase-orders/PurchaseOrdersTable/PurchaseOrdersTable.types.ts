import { PurchaseOrder, PurchaseOrderStatus } from '../../../types';

export type SortField = 'identifier' | 'partnerId' | 'status' | 'lastUpdate';
export type SortDirection = 'asc' | 'desc';

export interface PurchaseOrdersTableProps {
  purchaseOrders: PurchaseOrder[];
  isLoading: boolean;
  searchQuery: string;
  statusFilter: string;
  sortField: SortField;
  sortDirection: SortDirection;
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  getPartnerDisplayName: (partnerId: string) => string;
  onSearchChange: (query: string) => void;
  onStatusFilterChange: (status: string) => void;
  onSortChange: (field: SortField, direction: SortDirection) => void;
  onPageChange: (page: number) => void;
  onAddPurchaseOrder: () => void;
  onEditPurchaseOrder: (purchaseOrder: PurchaseOrder) => void;
  onDeletePurchaseOrder: (purchaseOrder: PurchaseOrder) => void;
  onGoToOrder: (purchaseOrder: PurchaseOrder) => void;
  onViewPurchaseOrder: (purchaseOrder: PurchaseOrder) => void;
}

export interface SearchAndFilterState {
  searchQuery: string;
  statusFilter: string;
  sortField: SortField;
  sortDirection: SortDirection;
  currentPage: number;
}