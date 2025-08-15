import { Partner, PartnerStatus } from '../../../types';

export type SortField = 'companyName' | 'status' | 'globalDiscountPercentage';
export type SortDirection = 'asc' | 'desc';

export interface PartnersTableProps {
  partners: Partner[];
  isLoading: boolean;
  searchQuery: string;
  statusFilter: string;
  sortField: SortField;
  sortDirection: SortDirection;
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  getMemberDisplayName: (memberId: string) => string;
  onSearchChange: (query: string) => void;
  onStatusFilterChange: (status: string) => void;
  onSortChange: (field: SortField, direction: SortDirection) => void;
  onPageChange: (page: number) => void;
  onAddPartner: () => void;
  onEditPartner: (partner: Partner) => void;
  onDeletePartner: (partner: Partner) => void;
}

export interface SearchAndFilterState {
  searchQuery: string;
  statusFilter: string;
  sortField: SortField;
  sortDirection: SortDirection;
  currentPage: number;
}