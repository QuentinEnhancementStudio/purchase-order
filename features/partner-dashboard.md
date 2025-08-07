# Partner Dashboard Feature Specification

## Overview
A comprehensive partner management dashboard for administrators to manage wholesale partners, including creating, editing, searching, and viewing partner information with associated discount settings.

## User Personas
Wix site Administrators managing the wholesale app

## Core Objectives
- Enable efficient partner management through intuitive dashboard interface
- Provide secure admin-only access with backend validation
- Support partner lifecycle management from creation to deactivation
- Enable quick partner lookup and data management

---

## User Stories

### A. Core Table Infrastructure

#### A1: Display Empty Partner Table
**As an** admin  
**I want** to see an empty partner table with proper headers when no partners exist  
**So that** I understand the table structure and can begin adding partners

**Acceptance Criteria:**
- Table displays with headers: Company Name, Email, Discount %, Status, Actions
- Shows "No partners found" message when empty
- Table is responsive and follows Wix design system styling
- Table renders without errors on page load

**Dependencies:** None

---

#### A2: Display Partner List
**As an** admin  
**I want** to view all partners in a table format  
**So that** I can see an overview of my wholesale partners

**Acceptance Criteria:**
- Each row shows: company name, email, discount percentage, status badge
- Status badges are color-coded (Active: green, Pending: yellow, Inactive: gray)
- Discount percentage displays with % symbol (e.g., "10%")
- Table handles empty state gracefully

**Dependencies:** A1

---

#### A3: Add Table Pagination
**As an** admin  
**I want** to navigate through multiple pages of partners  
**So that** I can manage large lists efficiently

**Acceptance Criteria:**
- Shows 25 partners per page by default
- Displays pagination controls at bottom of table
- Shows current page number and total pages
- "Previous" and "Next" buttons work correctly
- Pagination persists search/filter state

**Dependencies:** A2

---

#### A4: Sort by Company Name
**As an** admin  
**I want** to sort partners alphabetically by company name  
**So that** I can find partners quickly

**Acceptance Criteria:**
- Click company name header to toggle ascending/descending sort
- Visual indicator shows current sort direction (arrow icon)
- Sorting persists across page refreshes
- Default sort is ascending by company name

**Dependencies:** A2

---

#### A5: Sort by Status
**As an** admin  
**I want** to sort partners by status  
**So that** I can group partners by their current state

**Acceptance Criteria:**
- Click status header to sort by status
- Sort order: Active, Pending, Inactive
- Visual indicator shows current sort state
- Can reverse sort order on second click

**Dependencies:** A2

---

#### A6: Sort by Discount Percentage
**As an** admin  
**I want** to sort partners by discount percentage  
**So that** I can identify highest/lowest discount partners

**Acceptance Criteria:**
- Click discount header to sort numerically
- Sorts by actual percentage value (not string)
- Visual indicator shows sort direction
- Maintains other table functionality while sorted

**Dependencies:** A2

---

### B. Search Functionality

#### B1: Search by Company Name
**As an** admin  
**I want** to search partners by company name  
**So that** I can quickly find specific partners

**Acceptance Criteria:**
- Search input field above the table
- Real-time search as user types (debounced)
- Case-insensitive partial matching
- Shows "No results found" when search yields no matches
- Clear search button to reset results

**Dependencies:** A2

---

#### B2: Search by Email Address
**As an** admin  
**I want** to search partners by email address  
**So that** I can locate partners using their contact information

**Acceptance Criteria:**
- Same search input handles email searches
- Partial email matching works (e.g., "@company.com" finds all company emails)
- Email search is case-insensitive
- Search works with current company name search

**Dependencies:** B1

---

#### B3: Filter by Status
**As an** admin  
**I want** to filter partners by status  
**So that** I can focus on partners in specific states

**Acceptance Criteria:**
- Status dropdown filter with options: All, Active, Pending, Inactive
- Filter works independently of search
- Shows count of results for each status
- Combines with search functionality
- "All" option clears status filter

**Dependencies:** A2

---

### C. Partner Creation

#### C1: Add Partner Button
**As an** admin  
**I want** to see an "Add Partner" button  
**So that** I can initiate partner creation

**Acceptance Criteria:**
- Prominent "Add Partner" button at top of page
- Button follows Wix design system styling
- Click opens partner creation modal
- Button is always visible regardless of table state

**Dependencies:** A1

---

#### C2: Partner Creation Modal Structure
**As an** admin  
**I want** to see a modal with partner input fields  
**So that** I can enter new partner information

**Acceptance Criteria:**
- Modal opens with title "Add New Partner"
- Form fields: Company Name, Wix Account, Discount %, Status dropdown
- Status dropdown defaults to "Pending"
- Cancel and Save buttons at bottom
- Modal can be closed with X button or Cancel
- Form resets when modal closes

**Dependencies:** C1

---

#### C3: Company Name Validation
**As an** admin  
**I want** company name validation in the creation form  
**So that** I ensure quality partner data

**Acceptance Criteria:**
- Company name is required (shows error if empty)
- Minimum 2 characters required
- Maximum 100 characters allowed
- Trims whitespace automatically
- Shows character count indicator
- Error message displays inline below field

**Dependencies:** C2

---

#### C4: Email Validation
**As an** admin  
**I want** email validation in the creation form  
**So that** I can contact partners reliably

**Acceptance Criteria:**
- Email field is required
- Must be valid email format
- Shows format error for invalid emails
- Checks for duplicate emails (shows error if exists)
- Error messages display inline

**Dependencies:** C2

---

#### C5: Discount Validation
**As an** admin  
**I want** discount percentage validation  
**So that** I set appropriate discount levels

**Acceptance Criteria:**
- Accepts numbers between 0 and 100
- Shows error for values outside range
- Allows decimal values (e.g., 12.5)
- Automatically adds % symbol on blur
- Defaults to 0 if left empty

**Dependencies:** C2

---

#### C6: Save New Partner
**As an** admin  
**I want** to save a new partner  
**So that** I can add them to my partner list

**Acceptance Criteria:**
- Save button disabled until all validation passes
- Shows loading state during save
- Success message appears after successful creation
- Modal closes automatically on success
- New partner appears in table immediately
- Form shows error messages for server validation failures

**Dependencies:** C3, C4, C5

---

### D. Partner Management

#### D1: View Partner Actions Menu
**As an** admin  
**I want** to see action options for each partner  
**So that** I can manage individual partners

**Acceptance Criteria:**
- Three-dot menu icon in Actions column
- Menu shows: Edit, Change Status, Delete options
- Menu opens on click and closes when clicking elsewhere
- Options are clearly labeled and accessible

**Dependencies:** A2

---

#### D2: Edit Partner Modal
**As an** admin  
**I want** to edit existing partner information  
**So that** I can keep partner data current

**Acceptance Criteria:**
- Edit option opens modal pre-filled with current data
- Same validation rules as creation form
- Modal title shows "Edit Partner: [Company Name]"
- Changes are not saved until "Update" button clicked
- Can cancel without saving changes

**Dependencies:** D1, C2

---

#### D3: Update Partner Information
**As an** admin  
**I want** to save changes to partner information  
**So that** I can maintain accurate partner records

**Acceptance Criteria:**
- Update button saves changes to backend
- Shows loading state during update
- Success message confirms update
- Updated data reflects immediately in table
- Handles server errors gracefully with error messages

**Dependencies:** D2

---

#### D4: Change Partner Status
**As an** admin  
**I want** to quickly change a partner's status  
**So that** I can activate, deactivate, or set pending state

**Acceptance Criteria:**
- Status change option shows current status and available transitions
- Can change: Active ↔ Inactive, Pending → Active, Pending → Inactive
- Confirmation dialog for status changes
- Status badge updates immediately after confirmation
- Shows success/error messages for status changes

**Dependencies:** D1

---

#### D5: Delete Partner Confirmation
**As an** admin  
**I want** to safely delete partners with confirmation  
**So that** I can remove partners without accidental deletions

**Acceptance Criteria:**
- Delete option shows confirmation dialog
- Dialog displays partner company name for verification
- Confirmation requires typing "DELETE" to proceed
- Shows warning about permanent deletion
- Cancel button safely exits without deletion

**Dependencies:** D1

---

#### D6: Delete Partner
**As an** admin  
**I want** to permanently remove a partner  
**So that** I can clean up my partner list

**Acceptance Criteria:**
- Partner is removed from backend after confirmation
- Partner disappears from table immediately
- Success message confirms deletion
- Cannot undo deletion (permanent action)
- Handles server errors with appropriate error messages

**Dependencies:** D5

---

## Technical Considerations

### Data
- Partners are store in collection `@code-enhancement-studio/purchase-order/Partners` with schema (id: text, memberId: text, companyName: text, status: text)
- Dashboard page has to be create using Wix CLI

### Backend Requirements
- Partner entity with fields: id, companyName, email, wixMemberId, globalDiscountPercentage, status
- Admin-only API endpoints for CRUD operations
- Minimal Input validation and sanitization
- Email is stored/retrieved via wix member

### Frontend Architecture  
- @wix/design-system components
- React components with TypeScript
- MobX for state management
- Responsive table design from Wix Design System
- Form validation with error handling
- Modal management for create/edit operations

### Security
- Wix Business Manager authentication (handled by Wix)
- Backend verification of admin role
- Input sanitization and validation
- Secure API endpoints with proper authorization

## Success Metrics
- Partners can be created, edited, and deleted successfully
- Search and filtering work efficiently with large partner lists
- Zero security vulnerabilities in partner data access
- Admin workflow completion time under 2 minutes per partner
- Table performance maintains under 1 second load time with 1000+ partners

## Future Enhancements
- Bulk partner import/export
- Partner activity history tracking  
- Advanced filtering options
- Partner performance analytics
- Integration with order management system