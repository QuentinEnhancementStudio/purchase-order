// Re-export backend types for frontend use
export type { 
  Partner, 
  PartnerStatus,
  PartnerBase
} from '../../backend/entities/partner/schemas';

/** @todo redefine paginatedResponse*/
export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  pageSize: number;
  currentPage: number;
  hasMore: boolean;
}

export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

export interface FormValidation {
  isValid: boolean;
  errors: Record<string, string>;
}

// UI Component types
export interface TableColumn<T> {
  key: keyof T;
  title: string;
  render?: (value: any, record: T) => React.ReactNode;
  sortable?: boolean;
  width?: string | number;
}

export interface FilterOption {
  label: string;
  value: string;
  count?: number;
}

export interface SortOption {
  key: string;
  label: string;
  direction: 'asc' | 'desc';
}