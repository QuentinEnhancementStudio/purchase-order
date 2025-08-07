# Partner Dashboard v2 - Comprehensive Implementation Plan

## Executive Summary

This plan provides a detailed, actionable roadmap for implementing Partner Dashboard v2 based on the specification document. The implementation is organized into 4 sequential phases that can be executed by development teams, with clear task breakdown, dependencies, and optimal execution sequence.

## Critical Findings & Decisions

### Current State Analysis
- **Entity Mismatch Confirmed**: Current Partner interface includes complex `ContactDetails` and `BillingDetails` structures. Those are obsolete
- **Specification Requirement**: Simplified structure with `id`, `companyName`, `email`, `wixMemberId`, `globalDiscountPercentage`, `status`
- **Store Implementation**: Exists but needs alignment with new entity structure
- **Frontend State**: Currently shows empty state placeholder

### Architecture Decision
**Shared Types Strategy**: Implement single Partner interface across entire stack in `src/types/entities/partner.ts` for type safety and consistency.

**Entity Update Strategy**: Use whole entity updates instead of partial updates. When updating a partner, the system provides the complete Partner entity object rather than partial updates with just ID and changed properties. This approach:
- Ensures data consistency by validating the complete entity
- Simplifies audit trails with full before/after snapshots  
- Reduces complexity in validation and business rule enforcement
- Enables better change detection and rollback capabilities

## Phase 1: Foundation Infrastructure (Week 1)
**Objective**: Establish core data structures and basic display functionality
**Dependencies**: None - Fresh start approach

### Phase 1A: Backend Foundation (3-4 days)
**Stories**: A1, A2 (Core data structure and API endpoints)

#### Task Breakdown:

##### 1.1 Create Shared Partner Types & Validation
**File**: `src/types/entities/partner.ts` (NEW)
**Effort**: 1 day
**Assignee**: Backend Developer

```typescript
// Complete shared interface implementation
export interface Partner {
  _id: string;
  _createdDate: Date;
  _updatedDate: Date;
  _owner?: string;
  companyName: string;
  email: string;
  wixMemberId: string;
  globalDiscountPercentage: number;
  status: PartnerStatus;
}

export type PartnerStatus = 'active' | 'pending' | 'inactive';

export interface CreatePartnerData {
  companyName: string;
  email: string;
  wixMemberId?: string;
  globalDiscountPercentage: number;
  status: PartnerStatus;
}

// Validation constants and functions
export const PARTNER_VALIDATION = { /* constants */ };
export const validateCompanyName = (name: string): ValidationResult => { /* implementation */ };
export const validateDiscount = (discount: number): ValidationResult => { /* implementation */ };
export const validateEmailFormat = (email: string): ValidationResult => { /* implementation */ };
export const validateStatusTransition = (current: PartnerStatus, newStatus: PartnerStatus): ValidationResult => { /* implementation */ };
export const validateCreateData = (data: CreatePartnerData): ValidationResult => { /* implementation */ };
```

**Acceptance Criteria**:
- [ ] All validation functions return consistent ValidationResult format
- [ ] Status transition rules implemented correctly
- [ ] TypeScript compilation successful
- [ ] No external dependencies on backend-specific code

##### 1.2 Update Partner Entity Class
**File**: `src/backend/entities/partner/partner.ts`
**Effort**: 0.5 day
**Assignee**: Backend Developer

**Tasks**:
- [ ] Import shared Partner interface and validation functions
- [ ] Replace current validation with shared functions
- [ ] Remove complex entity structure dependencies
- [ ] Add backend-specific email uniqueness validation

**Acceptance Criteria**:
- [ ] Entity uses shared Partner interface
- [ ] All validation delegates to shared functions
- [ ] Backend-specific validations clearly separated
- [ ] Zero breaking changes to existing functionality

##### 1.3 Update Partners Repository
**File**: `src/backend/repositories/partners.ts`
**Effort**: 1 day
**Assignee**: Backend Developer

**Tasks**:
- [ ] Import shared Partner types
- [ ] Update method signatures to match new interface (updatePartner takes whole entity)
- [ ] Implement change detection in updatePartner by comparing incoming entity with existing
- [ ] Implement search functionality foundation
- [ ] Add error handling for data migration

**Method Signatures**:
```typescript
createPartner(data: CreatePartnerData): Promise<Partner>
getAllPartners(): Promise<Partner[]>
getPartnerByEmail(email: string): Promise<Partner | null>
updatePartner(partner: Partner): Promise<Partner>
deletePartner(id: string): Promise<boolean>
```

**Acceptance Criteria**:
- [ ] All CRUD operations work with new Partner interface
- [ ] Update operations receive whole Partner entity instead of partial updates
- [ ] Repository implements change detection by comparing entities before update
- [ ] Backward compatibility maintained during transition
- [ ] Error handling covers data migration scenarios
- [ ] Repository tests pass

##### 1.4 Implement Core Web Methods
**File**: `src/backend/web-methods/partners.web.ts`
**Effort**: 1 day
**Assignee**: Backend Developer

**Tasks**:
- [ ] Import shared types and validation
- [ ] Update existing methods to new interface
- [ ] Implement admin permission checks
- [ ] Add comprehensive error handling

**Method Signatures**:
```typescript
getPartners(): Promise<Partner[]> // Admin only
createPartner(data: CreatePartnerData): Promise<Partner> // Admin only
updatePartner(partner: Partner): Promise<Partner> // Admin only
deletePartner(id: string): Promise<{ success: boolean; message: string }> // Admin only
```

**Acceptance Criteria**:
- [ ] All methods enforce admin permissions
- [ ] Validation uses shared validation functions
- [ ] Error responses are consistent and user-friendly
- [ ] Methods handle edge cases (missing data, invalid IDs)

##### 1.5 Testing & Validation
**Effort**: 0.5 day
**Assignee**: Backend Developer

**Testing Checklist**:
- [ ] Partner entity validation works correctly
- [ ] Repository CRUD operations function with new interface
- [ ] Web methods return correct data structure
- [ ] Admin permissions properly enforced
- [ ] TypeScript compilation successful
- [ ] No console errors in development

---

### Phase 1B: Frontend Foundation (2-3 days)
**Stories**: A1, A2 (Display Empty Table, Display Partner List)
**Dependencies**: Can start in parallel with Phase 1A using mock data

#### Task Breakdown:

##### 1.6 Import Shared Types
**File**: `src/dashboard/types/index.ts`
**Effort**: 0.5 day
**Assignee**: Frontend Developer

**Tasks**:
- [ ] Re-export all shared Partner types and validation
- [ ] Create dashboard-specific type extensions if needed
- [ ] Update existing type references

**Acceptance Criteria**:
- [ ] All shared types accessible from dashboard
- [ ] TypeScript compilation successful
- [ ] No duplicate type definitions

##### 1.7 Create StatusBadge Component
**File**: `src/dashboard/components/common/StatusBadge/StatusBadge.tsx`
**Effort**: 0.5 day
**Assignee**: Frontend Developer

**Component Interface**:
```typescript
interface Props {
  status: PartnerStatus;
  size?: 'small' | 'medium';
}
```

**Acceptance Criteria**:
- [ ] Status badges show correct colors (Active: green, Pending: yellow, Inactive: gray)
- [ ] Component is reusable across dashboard
- [ ] Responsive design works on mobile
- [ ] Accessibility attributes included

##### 1.8 Create PartnerTable Component
**File**: `src/dashboard/components/partners/PartnerTable/PartnerTable.tsx`
**Effort**: 1.5 days
**Assignee**: Frontend Developer

**Component Interface**:
```typescript
interface Props {
  partners: Partner[];
  loading: boolean;
  onSort: (field: string, direction: 'asc' | 'desc') => void;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
}
```

**Tasks**:
- [ ] Implement table with proper headers (Company Name, Email, Discount %, Status, Actions)
- [ ] Add empty state with "No partners found" message
- [ ] Implement responsive design using @wix/design-system
- [ ] Add loading state with skeleton rows
- [ ] Integrate StatusBadge component

**Acceptance Criteria**:
- [ ] Table displays all partner data correctly
- [ ] Empty state shows appropriate message and illustration
- [ ] Loading state shows skeleton placeholders
- [ ] Discount percentage displays with % symbol
- [ ] Table is fully responsive
- [ ] Actions column reserved for future functionality

##### 1.9 Update PartnersStore Alignment
**File**: `src/dashboard/stores/partnersStore.ts`
**Effort**: 1 day
**Assignee**: Frontend Developer

**Tasks**:
- [ ] Import shared Partner interface
- [ ] Update store properties to match new interface
- [ ] Add computed properties for table display
- [ ] Update all method signatures
- [ ] Maintain backward compatibility where possible

**New Computed Properties**:
```typescript
get partnersForTable(): PartnerTableRow[]
get tableStatus(): 'loading' | 'empty' | 'error' | 'loaded'
get isEmpty(): boolean
get hasError(): boolean
```

**Acceptance Criteria**:
- [ ] Store aligns with new Partner interface
- [ ] All computed properties work correctly
- [ ] Error handling maintained
- [ ] Observable reactions properly configured

##### 1.10 Update Partners Dashboard Page
**File**: `src/dashboard/pages/partners/page.tsx`
**Effort**: 0.5 day
**Assignee**: Frontend Developer

**Tasks**:
- [ ] Replace empty state with PartnerTable component
- [ ] Add StoreContext.Provider integration
- [ ] Implement basic loading and error states
- [ ] Add page header with proper title

**Acceptance Criteria**:
- [ ] Page displays PartnerTable instead of empty state
- [ ] Store integration works correctly
- [ ] Loading states display properly
- [ ] Error states show user-friendly messages

---

## Phase 2: Search & Filtering (Week 2)
**Objective**: Enable users to search and filter partner data
**Dependencies**: Phase 1 completion required

### Phase 2A: Backend Search & Filtering (2 days)
**Stories**: B1, B2, B3 (Search by Company, Search by Email, Filter by Status)

#### Task Breakdown:

##### 2.1 Enhance Partners Repository with Search
**File**: `src/backend/repositories/partners.ts`
**Effort**: 1 day
**Assignee**: Backend Developer

**New Methods**:
```typescript
interface SearchFilters {
  companyName?: string;
  email?: string;
  status?: PartnerStatus;
  limit?: number;
  skip?: number;
}

searchPartners(filters: SearchFilters): Promise<Partner[]>
getPartnersCount(filters?: SearchFilters): Promise<number>
```

**Tasks**:
- [ ] Implement case-insensitive partial matching for company name
- [ ] Implement case-insensitive partial matching for email
- [ ] Add status filtering capability
- [ ] Implement pagination support (limit/skip)
- [ ] Add search performance optimization

**Acceptance Criteria**:
- [ ] Search by company name works (case-insensitive, partial match)
- [ ] Search by email works (case-insensitive, partial match)
- [ ] Status filtering works correctly
- [ ] Combined filters work together
- [ ] Pagination parameters respected
- [ ] Search results are performant (sub-200ms response)

##### 2.2 Update Search Web Methods
**File**: `src/backend/web-methods/partners.web.ts`
**Effort**: 1 day
**Assignee**: Backend Developer

**New Methods**:
```typescript
searchPartners(filters: SearchFilters): Promise<Partner[]>
getPartnersStats(): Promise<{ 
  total: number; 
  byStatus: Record<PartnerStatus, number> 
}>
```

**Tasks**:
- [ ] Implement search endpoint with proper validation
- [ ] Add statistics endpoint for filter counts
- [ ] Maintain admin permissions
- [ ] Add rate limiting for search endpoints

**Acceptance Criteria**:
- [ ] Search endpoint returns filtered results
- [ ] Statistics endpoint provides accurate counts
- [ ] Admin permissions enforced
- [ ] Rate limiting prevents abuse
- [ ] Error handling covers invalid filter parameters

---

### Phase 2B: Frontend Search & Filtering (3 days)
**Stories**: B1, B2, B3 (Search UI Components)

#### Task Breakdown:

##### 2.3 Create SearchBar Component
**File**: `src/dashboard/components/partners/SearchBar/SearchBar.tsx`
**Effort**: 1 day
**Assignee**: Frontend Developer

**Component Interface**:
```typescript
interface Props {
  onSearch: (query: string) => void;
  placeholder: string;
  loading?: boolean;
  clearable?: boolean;
}
```

**Tasks**:
- [ ] Implement debounced search (300ms delay)
- [ ] Add clear search functionality
- [ ] Include search icon and loading indicator
- [ ] Add keyboard shortcuts (Escape to clear)
- [ ] Implement accessibility features

**Acceptance Criteria**:
- [ ] Search triggers after 300ms of no typing
- [ ] Clear button removes search and triggers new search
- [ ] Loading indicator shows during search requests
- [ ] Component is accessible (proper ARIA labels)
- [ ] Mobile-friendly design

##### 2.4 Create StatusFilter Component
**File**: `src/dashboard/components/partners/StatusFilter/StatusFilter.tsx`
**Effort**: 1 day
**Assignee**: Frontend Developer

**Component Interface**:
```typescript
interface Props {
  selectedStatus?: PartnerStatus | 'all';
  onStatusChange: (status: PartnerStatus | 'all') => void;
  counts: Record<PartnerStatus, number>;
  loading?: boolean;
}
```

**Tasks**:
- [ ] Implement dropdown/pill-based status filter
- [ ] Display counts for each status
- [ ] Add "All" option with total count
- [ ] Style with appropriate status colors
- [ ] Handle loading state during count updates

**Acceptance Criteria**:
- [ ] Filter shows all status options with counts
- [ ] "All" option displays total partner count
- [ ] Visual styling matches status badge colors
- [ ] Loading state disables interactions appropriately
- [ ] Mobile-responsive design

##### 2.5 Update PartnersStore with Search Functionality
**File**: `src/dashboard/stores/partnersStore.ts`
**Effort**: 1 day
**Assignee**: Frontend Developer

**New Properties & Methods**:
```typescript
// Search state
searchQuery: string = '';
statusFilter: PartnerStatus | 'all' = 'all';
searchResults: Partner[] = [];
searchLoading: boolean = false;
statusCounts: Record<PartnerStatus, number> = { active: 0, pending: 0, inactive: 0 };

// Actions
setSearchQuery(query: string): void
setStatusFilter(status: PartnerStatus | 'all'): void
searchPartners(): void // Debounced execution
clearSearch(): void

// Computed properties
get filteredPartners(): Partner[]
get searchResultCount(): number
get hasActiveFilters(): boolean
get isSearchEmpty(): boolean
```

**Tasks**:
- [ ] Implement debounced search execution (300ms)
- [ ] Add search result caching for performance
- [ ] Update status counts when data changes
- [ ] Integrate with backend search endpoints
- [ ] Add error handling for search failures

**Acceptance Criteria**:
- [ ] Search executes with proper debouncing
- [ ] Search results update reactively
- [ ] Status counts update when filters change
- [ ] Error handling shows user-friendly messages
- [ ] Search state persists during page interactions

##### 2.6 Update Partners Dashboard Page with Search
**File**: `src/dashboard/pages/partners/page.tsx`
**Effort**: 1 day (includes integration testing)
**Assignee**: Frontend Developer

**Tasks**:
- [ ] Add SearchBar component to page header
- [ ] Add StatusFilter component to page controls
- [ ] Integrate with PartnersStore search functionality
- [ ] Add "No results found" state for empty search results
- [ ] Implement search result summary ("Showing X of Y partners")

**UI Layout**:
```
[Page Header with Title]
[SearchBar] [StatusFilter] [Add Partner Button]
[Search Summary: "Showing X of Y partners"]
[PartnerTable with filtered results]
[Pagination if needed]
```

**Acceptance Criteria**:
- [ ] Search and filter components integrate seamlessly
- [ ] "No results found" state displays appropriate message
- [ ] Search summary shows accurate counts
- [ ] Page layout remains responsive with new components
- [ ] Loading states work across all search operations

---

## Phase 3: Partner Creation (Week 3)
**Objective**: Enable admin users to create new partners
**Dependencies**: Phase 1 completion required

### Phase 3A: Backend Partner Creation (2 days)
**Stories**: C1-C6 (Add Button through Save Partner)

#### Task Breakdown:

##### 3.1 Implement Backend Validation Services
**File**: `src/backend/services/validation/partner-validation.ts`
**Effort**: 1 day
**Assignee**: Backend Developer

**Services**:
```typescript
export const validateEmailUniqueness = async (email: string): Promise<ValidationResult>
export const validateCreateDataWithUniqueness = async (data: CreatePartnerData): Promise<ValidationResult>
export const validateWixMemberExists = async (email: string): Promise<ValidationResult>
```

**Tasks**:
- [ ] Implement email uniqueness check against existing partners
- [ ] Combine format validation with uniqueness validation
- [ ] Add Wix member existence validation
- [ ] Create comprehensive validation pipeline
- [ ] Add detailed error messages for each validation failure

**Acceptance Criteria**:
- [ ] Email uniqueness validation works correctly
- [ ] Validation combines shared format rules with backend-specific checks
- [ ] Wix member validation integrates properly
- [ ] Error messages are clear and actionable
- [ ] Validation functions are performant

##### 3.2 Implement Member Integration Service
**File**: `src/backend/services/member-service.ts`
**Effort**: 1 day
**Assignee**: Backend Developer

**Service Methods**:
```typescript
getMemberByEmail(email: string): Promise<WixMember | null>
createMemberIfNeeded(email: string): Promise<string> // Returns memberId
validateMemberEmail(email: string): Promise<boolean>
```

**Tasks**:
- [ ] Integrate with Wix Members API
- [ ] Implement member lookup by email
- [ ] Add member creation functionality for new emails
- [ ] Handle member API errors gracefully
- [ ] Add logging for member operations

**Acceptance Criteria**:
- [ ] Member lookup returns correct results
- [ ] New member creation works when needed
- [ ] API errors are handled gracefully
- [ ] Service integrates with Wix SDK properly
- [ ] Member operations are logged appropriately

##### 3.3 Update Create Partner Web Method
**File**: `src/backend/web-methods/partners.web.ts`
**Effort**: 0.5 day
**Assignee**: Backend Developer

**Tasks**:
- [ ] Integrate comprehensive validation pipeline
- [ ] Add member integration to creation flow
- [ ] Implement proper error handling and response formatting
- [ ] Add audit logging for partner creation
- [ ] Ensure admin permission enforcement

**Acceptance Criteria**:
- [ ] Complete validation runs before partner creation
- [ ] Member integration works seamlessly
- [ ] Error responses are user-friendly
- [ ] Audit trail is maintained
- [ ] Admin permissions properly enforced

---

### Phase 3B: Frontend Partner Creation (3 days)
**Stories**: C1-C6 (Creation Modal and Validation)

#### Task Breakdown:

##### 3.4 Create PartnerForm Component
**File**: `src/dashboard/components/partners/PartnerForm/PartnerForm.tsx`
**Effort**: 1.5 days
**Assignee**: Frontend Developer

**Component Interface**:
```typescript
interface Props {
  initialData?: Partial<CreatePartnerData>;
  onSubmit: (data: CreatePartnerData) => void;
  loading?: boolean;
  mode: 'create' | 'edit';
  validationErrors?: Record<string, string[]>;
}
```

**Form Fields**:
- Company Name (required, 2-100 characters)
- Wix Account Email (required, email validation)
- Global Discount Percentage (required, 0-100%, up to 2 decimal places)
- Status (dropdown, defaults to "Pending")

**Tasks**:
- [ ] Implement real-time validation using shared validation functions
- [ ] Add character count indicators for text fields
- [ ] Auto-format discount percentage with % symbol
- [ ] Add field-level error display with clear messaging
- [ ] Implement form reset functionality
- [ ] Add accessibility features (proper labels, ARIA attributes)

**Acceptance Criteria**:
- [ ] Real-time validation shows immediate feedback
- [ ] All validation rules enforced correctly
- [ ] Character counters update dynamically
- [ ] Discount field formats percentage properly
- [ ] Error messages are clear and actionable
- [ ] Form is fully accessible

##### 3.5 Create AddPartnerModal Component
**File**: `src/dashboard/components/partners/AddPartnerModal/AddPartnerModal.tsx`
**Effort**: 1 day
**Assignee**: Frontend Developer

**Component Interface**:
```typescript
interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreatePartnerData) => Promise<void>;
  loading?: boolean;
}
```

**Tasks**:
- [ ] Create modal wrapper with proper overlay
- [ ] Integrate PartnerForm component
- [ ] Implement form submission handling
- [ ] Add loading states during save operations
- [ ] Handle success/error notifications
- [ ] Implement form reset on close
- [ ] Add escape key and overlay click to close

**Acceptance Criteria**:
- [ ] Modal opens and closes correctly
- [ ] Form integration works seamlessly  
- [ ] Loading states prevent double submission
- [ ] Success notifications appear after save
- [ ] Error notifications show validation failures
- [ ] Modal is accessible (focus management, keyboard navigation)

##### 3.6 Update Partners Dashboard Page with Creation
**File**: `src/dashboard/pages/partners/page.tsx`
**Effort**: 0.5 day
**Assignee**: Frontend Developer

**Tasks**:
- [ ] Add prominent "Add Partner" button to page header
- [ ] Implement modal state management
- [ ] Handle partner creation success/error flows
- [ ] Update partner list after successful creation
- [ ] Add proper button styling and positioning

**Button Placement**: Top right of page header, next to search/filter controls

**Acceptance Criteria**:
- [ ] "Add Partner" button is prominently displayed
- [ ] Modal opens when button is clicked
- [ ] New partners appear in table immediately after creation
- [ ] Success/error messages show appropriate feedback
- [ ] Page state updates correctly after modal closes

##### 3.7 Update PartnersStore with Creation
**File**: `src/dashboard/stores/partnersStore.ts`
**Effort**: 0.5 day
**Assignee**: Frontend Developer

**New Methods**:
```typescript
createPartner(data: CreatePartnerData): Promise<void>
```

**Tasks**:
- [ ] Update create method to use new Partner interface
- [ ] Ensure reactive updates after creation
- [ ] Handle creation errors appropriately
- [ ] Update local partner list optimistically

**Acceptance Criteria**:
- [ ] Partner creation integrates with backend API
- [ ] Store updates reactively after creation
- [ ] Error handling shows user-friendly messages
- [ ] Local state remains consistent with backend

---

## Phase 4: Partner Management (Week 4)
**Objective**: Enable editing, status changes, and deletion of partners
**Dependencies**: Phase 1 completion required

### Phase 4A: Backend Management Operations (2 days)
**Stories**: D1-D6 (Actions Menu through Delete Partner)

#### Task Breakdown:

##### 4.1 Implement Update Partner Web Method
**File**: `src/backend/web-methods/partners.web.ts`
**Effort**: 1 day
**Assignee**: Backend Developer

**Method Enhancement**:
```typescript
updatePartner(partner: Partner): Promise<Partner>
```

**Tasks**:
- [ ] Add comprehensive validation for the complete partner entity
- [ ] Implement status transition validation using shared functions
- [ ] Validate the entire partner entity against all business rules
- [ ] Ensure email uniqueness for the partner entity
- [ ] Add audit logging for update operations with full entity context
- [ ] Compare incoming entity with existing entity for change detection

**Acceptance Criteria**:
- [ ] Complete entity validation executes before update
- [ ] Status transitions follow business rules
- [ ] Email uniqueness maintained for the entire entity
- [ ] Audit trail captures entity changes with before/after snapshots
- [ ] Error handling covers whole entity validation edge cases
- [ ] Change detection identifies modified fields for audit purposes

##### 4.2 Implement Delete Safety Checks
**File**: `src/backend/web-methods/partners.web.ts`
**Effort**: 1 day
**Assignee**: Backend Developer

**Method Enhancement**:
```typescript
deletePartner(id: string): Promise<{ success: boolean; message: string; details?: any }>
```

**Tasks**:
- [ ] Check for associated purchase orders before deletion
- [ ] Prevent deletion if active orders exist
- [ ] Implement soft delete for data integrity
- [ ] Add detailed error messages for deletion restrictions
- [ ] Log all deletion attempts

**Acceptance Criteria**:
- [ ] Partners with active orders cannot be deleted
- [ ] Clear error messages explain deletion restrictions
- [ ] Soft delete maintains data integrity
- [ ] All deletion attempts are logged
- [ ] Method returns detailed status information

---

### Phase 4B: Frontend Management UI (3 days)
**Stories**: D1-D6 (Management Interface Components)

#### Task Breakdown:

##### 4.3 Create ActionsMenu Component
**File**: `src/dashboard/components/partners/ActionsMenu/ActionsMenu.tsx`
**Effort**: 0.5 day
**Assignee**: Frontend Developer

**Component Interface**:
```typescript
interface Props {
  partner: Partner;
  onEdit: (partner: Partner) => void;
  onStatusChange: (partner: Partner) => void;
  onDelete: (partner: Partner) => void;
  disabled?: boolean;
}
```

**Tasks**:
- [ ] Implement three-dot menu with dropdown
- [ ] Add edit, status change, and delete actions
- [ ] Include appropriate icons for each action
- [ ] Handle disabled state during operations
- [ ] Add hover states and keyboard navigation

**Acceptance Criteria**:
- [ ] Menu appears on hover/click of action button
- [ ] All three actions trigger appropriate handlers
- [ ] Menu closes after action selection
- [ ] Keyboard navigation works properly
- [ ] Component handles disabled state correctly

##### 4.4 Create EditPartnerModal Component
**File**: `src/dashboard/components/partners/EditPartnerModal/EditPartnerModal.tsx`
**Effort**: 1 day
**Assignee**: Frontend Developer

**Component Interface**:
```typescript
interface Props {
  partner: Partner | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (partner: Partner) => Promise<void>;
  loading?: boolean;
}
```

**Tasks**:
- [ ] Reuse PartnerForm component with edit mode
- [ ] Pre-populate form with current partner data
- [ ] Handle whole entity updates (complete partner object)
- [ ] Build complete updated Partner entity from form data and pass to onSave
- [ ] Add change detection to enable/disable save button
- [ ] Implement proper loading states

**Acceptance Criteria**:
- [ ] Form pre-populates with current partner data
- [ ] Complete partner entity is sent for update
- [ ] Save button enables only when changes detected
- [ ] Loading states prevent multiple submissions
- [ ] Modal handles edit success/error states

##### 4.5 Create StatusChangeModal Component
**File**: `src/dashboard/components/partners/StatusChangeModal/StatusChangeModal.tsx`
**Effort**: 0.5 day
**Assignee**: Frontend Developer

**Component Interface**:
```typescript
interface Props {
  partner: Partner | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (partnerId: string, newStatus: PartnerStatus) => Promise<void>;
  loading?: boolean;
}
```

**Tasks**:
- [ ] Display current status and available transitions
- [ ] Use shared validation functions to show valid next statuses
- [ ] Add confirmation step with status change summary
- [ ] Include status badge previews
- [ ] Add loading state during status update

**Acceptance Criteria**:
- [ ] Modal shows only valid status transitions
- [ ] Status change preview is clear
- [ ] Confirmation step prevents accidental changes
- [ ] Loading state handles update process
- [ ] Success/error feedback is provided

##### 4.6 Create DeleteConfirmationModal Component
**File**: `src/dashboard/components/partners/DeleteConfirmationModal/DeleteConfirmationModal.tsx`
**Effort**: 1 day
**Assignee**: Frontend Developer

**Component Interface**:
```typescript
interface Props {
  partner: Partner | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (partnerId: string) => Promise<void>;
  loading?: boolean;
}
```

**Tasks**:
- [ ] Display partner company name prominently
- [ ] Require typing "DELETE" to enable confirmation button
- [ ] Add warning about permanent deletion
- [ ] Show potential consequences (if partner has orders)
- [ ] Implement proper loading and error states

**Acceptance Criteria**:
- [ ] Confirmation requires typing "DELETE" exactly
- [ ] Partner name is displayed clearly
- [ ] Warnings about consequences are shown
- [ ] Delete button enables only when confirmation typed
- [ ] Error messages handle deletion restrictions

##### 4.7 Update Partners Dashboard Page with Management
**File**: `src/dashboard/pages/partners/page.tsx`
**Effort**: 1 day (includes integration testing)
**Assignee**: Frontend Developer

**Tasks**:
- [ ] Add modal state management for all management modals
- [ ] Integrate ActionsMenu into PartnerTable
- [ ] Implement modal open/close handlers
- [ ] Add management operation handlers (edit with whole entity, status, delete)
- [ ] Handle success/error feedback for all operations

**State Management**:
```typescript
const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
const [showEditModal, setShowEditModal] = useState(false);
const [showStatusModal, setShowStatusModal] = useState(false);
const [showDeleteModal, setShowDeleteModal] = useState(false);
```

**Acceptance Criteria**:
- [ ] All management modals integrate seamlessly
- [ ] Partner selection state managed correctly
- [ ] Success/error notifications appear appropriately
- [ ] Table updates reflect changes immediately
- [ ] Modal state resets properly between operations

##### 4.8 Update PartnersStore with Management Operations
**File**: `src/dashboard/stores/partnersStore.ts`
**Effort**: 0.5 day
**Assignee**: Frontend Developer

**New Methods**:
```typescript
updatePartner(partner: Partner): Promise<void>
deletePartner(id: string): Promise<void>
```

**Tasks**:
- [ ] Implement update method with optimistic whole entity updates
- [ ] Implement delete method with local state cleanup
- [ ] Add error rollback for failed operations with complete entity restoration
- [ ] Update reactive properties after operations

**Acceptance Criteria**:
- [ ] Update operations send complete entity to backend API
- [ ] Delete operations handle restrictions properly
- [ ] Local state updates optimistically with whole entity
- [ ] Error rollback restores complete previous entity state

---

## Cross-Phase: Table Enhancements
**Objective**: Implement pagination and sorting across table functionality
**Dependencies**: Integrated throughout phases but primarily in Phase 1B

### Pagination & Sorting Implementation
**Stories**: A3, A4, A5, A6 (Pagination Controls, Sorting Headers, Page Navigation, Results Per Page)

#### Task Breakdown:

##### 5.1 Create TablePagination Component
**File**: `src/dashboard/components/partners/TablePagination/TablePagination.tsx`
**Effort**: 1 day
**Assignee**: Frontend Developer

**Component Interface**:
```typescript
interface Props {
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (itemsPerPage: number) => void;
  itemsPerPageOptions?: number[];
}
```

**Tasks**:
- [ ] Implement pagination controls with first/previous/next/last buttons
- [ ] Add page number selector for direct navigation
- [ ] Include items per page selector (25, 50, 100 options)
- [ ] Display result summary ("Showing X-Y of Z partners")
- [ ] Handle edge cases (single page, no results)

**Acceptance Criteria**:
- [ ] Pagination controls work correctly
- [ ] Direct page navigation functions
- [ ] Items per page selection updates results
- [ ] Result summary shows accurate information
- [ ] Component handles all edge cases gracefully

##### 5.2 Add Sorting to PartnerTable
**File**: `src/dashboard/components/partners/PartnerTable/PartnerTable.tsx`
**Effort**: 1 day
**Assignee**: Frontend Developer

**Sortable Fields**:
- Company Name (default: ascending)
- Status
- Global Discount Percentage

**Tasks**:
- [ ] Add sortable column headers with visual indicators
- [ ] Implement sort direction toggling (asc/desc)
- [ ] Add visual sort indicators (arrows)
- [ ] Maintain sort state during table operations
- [ ] Handle multi-column sorting if needed

**Acceptance Criteria**:
- [ ] Column headers show sort indicators
- [ ] Clicking headers toggles sort direction
- [ ] Default sort is Company Name ascending
- [ ] Sort state persists across page refreshes
- [ ] Sorting works with search/filter operations

##### 5.3 Update PartnersStore with Pagination/Sorting
**File**: `src/dashboard/stores/partnersStore.ts`
**Effort**: 1 day
**Assignee**: Frontend Developer

**New Properties**:
```typescript
currentPage: number = 1;
itemsPerPage: number = 25;
sortField: 'companyName' | 'status' | 'globalDiscountPercentage' = 'companyName';
sortDirection: 'asc' | 'desc' = 'asc';
totalItems: number = 0;
```

**New Methods**:
```typescript
setPage(page: number): void
setItemsPerPage(itemsPerPage: number): void
setSorting(field: string, direction: 'asc' | 'desc'): void
```

**Computed Properties**:
```typescript
get paginatedPartners(): Partner[]
get totalPages(): number
get startIndex(): number
get endIndex(): number
```

**Acceptance Criteria**:
- [ ] Pagination state manages correctly
- [ ] Sorting state persists appropriately
- [ ] Computed properties calculate correctly
- [ ] State changes trigger reactive updates
- [ ] Pagination/sorting work with search/filter

---

## Testing & Quality Assurance

### Unit Testing Requirements

#### Backend Tests
**Files to Test**:
- `src/types/entities/partner.ts` - All validation functions
- `src/backend/entities/partner/partner.ts` - Entity methods
- `src/backend/repositories/partners.ts` - CRUD operations
- `src/backend/web-methods/partners.web.ts` - API endpoints

**Test Coverage Requirements**:
- [ ] 95%+ code coverage on validation functions
- [ ] All CRUD operations tested with success/error scenarios
- [ ] API endpoint security testing (admin permissions)
- [ ] Edge case handling (invalid data, missing records)

#### Frontend Tests
**Files to Test**:
- All components in `src/dashboard/components/partners/`
- `src/dashboard/stores/partnersStore.ts`
- `src/dashboard/pages/partners/page.tsx`

**Test Coverage Requirements**:
- [ ] Component rendering with various props
- [ ] User interaction handling (clicks, form inputs)
- [ ] Store state management and computed properties
- [ ] Error boundary scenarios

### Integration Testing

#### API Integration Tests
- [ ] End-to-end partner CRUD workflows
- [ ] Search and filtering operations
- [ ] Authentication and authorization flows
- [ ] Error handling across API boundaries

#### UI Integration Tests
- [ ] Complete partner management workflows
- [ ] Modal interactions and state management
- [ ] Table operations (sorting, pagination, filtering)
- [ ] Form validation and submission flows

### Performance Testing

#### Load Testing Scenarios
- [ ] Table rendering with 1000+ partners
- [ ] Search performance with large datasets
- [ ] API response times under concurrent load
- [ ] Memory usage during extended table operations

#### Performance Benchmarks
- [ ] Initial page load: < 2 seconds
- [ ] Search response: < 300ms
- [ ] Table operations: < 100ms
- [ ] Modal open/close: < 200ms

### Accessibility Testing

#### WCAG 2.1 AA Compliance
- [ ] Keyboard navigation for all interactive elements
- [ ] Screen reader compatibility
- [ ] Color contrast ratios meet standards
- [ ] Form labels and ARIA attributes properly implemented

### Browser Compatibility Testing

#### Supported Browsers
- [ ] Chrome 90+ (primary)
- [ ] Firefox 88+ (secondary)
- [ ] Safari 14+ (secondary)
- [ ] Edge 90+ (secondary)

### Mobile Responsiveness Testing

#### Responsive Breakpoints
- [ ] Mobile: 320px - 767px
- [ ] Tablet: 768px - 1023px
- [ ] Desktop: 1024px+

---

## Risk Mitigation & Contingency Plans

### High-Risk Areas & Mitigation

#### 1. Entity Structure Migration
**Risk**: Breaking existing partner data during interface transition
**Probability**: Medium | **Impact**: High

**Mitigation Strategies**:
- [ ] Implement gradual migration with backward compatibility
- [ ] Create data migration scripts for existing partners
- [ ] Add comprehensive rollback procedures
- [ ] Test migration on copy of production data

**Contingency Plan**:
- Maintain dual entity support during transition period
- Implement feature flags to switch between old/new structures
- Have immediate rollback capability ready

#### 2. Wix Member Integration
**Risk**: Member lookup/creation API failures affecting partner creation
**Probability**: Medium | **Impact**: Medium

**Mitigation Strategies**:
- [ ] Implement retry logic for member API calls
- [ ] Add fallback member creation process
- [ ] Cache member data to reduce API dependencies
- [ ] Create offline mode for member operations

**Contingency Plan**:
- Allow partner creation without immediate member linking
- Implement background job for member reconciliation
- Provide manual member linking interface

#### 3. Search Performance Degradation
**Risk**: Real-time search becomes slow with large partner datasets
**Probability**: Low | **Impact**: Medium

**Mitigation Strategies**:
- [ ] Implement search result caching
- [ ] Add search debouncing (300ms minimum)
- [ ] Consider server-side search indexing
- [ ] Monitor search performance metrics

**Contingency Plan**:
- Implement pagination for search results
- Add search result limits (max 100 results)
- Provide advanced search with explicit submit

### Medium-Risk Areas

#### 4. Form Validation User Experience
**Risk**: Complex validation rules causing user frustration
**Probability**: Medium | **Impact**: Low

**Mitigation Strategies**:
- [ ] Implement progressive validation (not blocking)
- [ ] Provide clear, actionable error messages
- [ ] Add inline help text for complex fields
- [ ] Test validation UX with actual users

#### 5. Modal State Management
**Risk**: Modal state conflicts during complex user interactions
**Probability**: Low | **Impact**: Low

**Mitigation Strategies**:
- [ ] Implement centralized modal state management
- [ ] Add modal queue system for sequential operations
- [ ] Test all modal interaction combinations
- [ ] Add error boundaries around modal components

---

## Success Criteria & Acceptance

### Functional Requirements
- [ ] All 20 user stories implemented and tested
- [ ] Partner CRUD operations work flawlessly
- [ ] Search and filtering provide accurate results
- [ ] Table pagination and sorting function correctly
- [ ] All validation rules enforced consistently

### Technical Requirements
- [ ] Zero TypeScript compilation errors
- [ ] No console errors in production build
- [ ] 95%+ test coverage on critical paths
- [ ] Performance benchmarks met
- [ ] Accessibility standards compliance

### User Experience Requirements
- [ ] Intuitive navigation with clear visual feedback
- [ ] Responsive design works on all target devices
- [ ] Loading states provide appropriate user feedback
- [ ] Error messages are helpful and actionable
- [ ] Form validation enhances rather than hinders workflow

### Business Requirements
- [ ] Admin permissions properly enforced
- [ ] Data integrity maintained across operations
- [ ] Audit trail captures all significant actions
- [ ] Integration with Wix ecosystem functions correctly

## Implementation Timeline

### Week 1: Foundation Phase
- **Days 1-2**: Phase 1A (Backend Foundation)
- **Days 3-5**: Phase 1B (Frontend Foundation)
- **Milestone**: Basic partner display functionality complete

### Week 2: Search & Filtering
- **Days 1-2**: Phase 2A (Backend Search)
- **Days 3-5**: Phase 2B (Frontend Search)
- **Milestone**: Full search and filtering capability

### Week 3: Partner Creation
- **Days 1-2**: Phase 3A (Backend Creation)
- **Days 3-5**: Phase 3B (Frontend Creation)
- **Milestone**: Complete partner creation workflow

### Week 4: Partner Management
- **Days 1-2**: Phase 4A (Backend Management)
- **Days 3-5**: Phase 4B (Frontend Management)
- **Milestone**: Full partner management functionality

### Week 5: Integration & Testing
- **Days 1-2**: Integration testing and bug fixes
- **Days 3-5**: Performance optimization and final testing
- **Milestone**: Production-ready partner dashboard v2

---

## Final Notes

This implementation plan provides a systematic, phase-based approach to building the Partner Dashboard v2 feature. Each phase builds upon the previous one while maintaining the ability for parallel development where appropriate.

The plan emphasizes:
- **Type Safety**: Single shared interface across the entire stack
- **Incremental Delivery**: Each phase delivers working functionality
- **Risk Mitigation**: Comprehensive testing and contingency planning
- **Code Quality**: Consistent architecture and best practices
- **User Experience**: Progressive enhancement with proper feedback

Teams should execute this plan while maintaining regular communication and conducting phase reviews to ensure alignment with business objectives and technical standards.