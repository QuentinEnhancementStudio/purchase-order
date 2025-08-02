# Purchase Order App - Product Requirements Document

## Executive Summary

The Purchase Order App extends Wix eCommerce capabilities to enable B2B wholesale ordering workflows. Partners (wholesale customers) can create purchase requests based on the Wix Store catalog, which are then reviewed and approved by site administrators before being converted into standard Wix orders.

**Target Market**: Small to Medium Enterprises (SMEs) using Wix for B2B/wholesale operations  
**Monetization**: Paid app installed by site administrators  
**Core Value Proposition**: Seamless integration with Wix ecosystem, no third-party dependencies

---

## Problem Statement

Wix Store's retail-focused checkout doesn't support B2B wholesale workflows where:
- Customers need approval before orders are processed
- Payment happens offline or through custom terms
- Administrators need review and modification capabilities
- Different pricing structures are required for partners vs. retail customers

---

## Solution Overview

A two-component Wix App consisting of:
1. **Wix Blocks**: Customer-facing purchase order interface (responsive)
2. **Wix CLI Dashboard**: Admin interface for managing partners and orders (desktop-focused)

### Key Features
- Partner-based purchase order creation
- Admin approval workflow with modification requests
- Integration with Wix Store catalog and inventory
- Email notifications for status changes
- Partner management system
- Future-proof architecture for custom pricing (v2/v3)

---

## User Personas

### Primary Users

**Site Administrator (Moderator)**
- Wix site owner or administrator
- Manages partner relationships
- Reviews and approves purchase orders
- Desktop-focused workflow

**Partner (Wholesale Customer)**
- B2B customer with approved partner status
- Creates purchase orders from store catalog
- Mobile and desktop access needed
- Limited to own order visibility

### User Authentication
- **Partners**: Wix Member authentication + Partner profile assignment
- **Moderators**: Wix Site Administrator permissions

---

## Core Features & User Stories

### Partner Management (Admin Dashboard)

**As a site administrator, I want to:**
- Create partner profiles linked to Wix members
- Invite new partners via email to create linked accounts
- Manage partner information and status
- View partner activity and order history

**Partner Profile includes:**
- Company details
- Contact information
- Billing information
- Partner status (active/inactive)
- Linked Wix member account

### Purchase Order Creation (Partner Interface)

**As a partner, I want to:**
- Browse the Wix Store catalog with partner-specific visibility
- Add multiple products to a purchase order with quantities
- Save orders as drafts and submit later
- Create new purchase orders from existing ones (any status)
- View my order history and current status

**Purchase Order States:**
1. **Draft** - Partner can modify, not visible to admin
2. **Submitted** - Under admin review, partner cannot modify
3. **Under Review** - Admin is evaluating the request
4. **Modification Requested** - Admin requests changes, returns to Draft
5. **Approved** - Admin approved, converted to Wix order automatically

### Admin Review Workflow (Admin Dashboard)

**As a site administrator, I want to:**
- View all submitted purchase orders
- Review order details including partner info and products
- Approve orders with optional comments
- Reject orders with required explanation
- Request modifications with specific feedback
- Track order conversion to Wix eCommerce orders

### Order Processing Integration

**Order Conversion Flow:**
1. Partner submits purchase order
2. Admin reviews and approves
3. System creates Wix DraftOrder
4. Admin uses Wix "New Order" interface to finalize
5. Standard Wix eCommerce order is created
6. Purchase order status updated to "Approved"
7. Inventory automatically updated via Wix Store system

---

## Technical Architecture

### Tech Stack
- **Framework**: React 16.14.0 + TypeScript
- **UI Library**: @wix/design-system
- **State Management**: MobX
- **Backend**: Wix Data Collections + Wix APIs
- **Authentication**: Wix Members + custom permissions
- **Email**: Custom notifications

### System Integration
- **Wix Store**: Product catalog, inventory management
- **Wix Members**: Authentication and user management
- **Wix Data Collections**: Purchase order and partner data storage
- **Wix eCommerce**: Order creation and payment processing
- **Wix DraftOrder**: Staging approved purchase orders

### Data Model

```typescript
// Core Entities
Partner {
  id: string
  memberId: string           // Link to Wix Member
  companyName: string
  contactInfo: ContactDetails
  billingInfo: BillingDetails
  status: 'active' | 'inactive'
  createdDate: Date
  catalogId?: string         // For v2/v3 custom pricing
}

PurchaseOrder {
  _id: string                // System field (ID)
  _createdDate: Date         // System field (Created Date)
  _updatedDate: Date         // System field (Updated Date)
  _owner: string             // System field (Owner)
  identifier: string         // Purchase order identifier
  status: 'draft' | 'submitted' | 'under_review' | 'modification_requested' | 'approved'
  orderId?: string           // Reference to final Wix order after conversion
  memberId: string           // Member who owns the purchase order
  draftOrderId?: string      // Reference to Wix draft order during processing
  calculatedDraftOrder?: object  // Calculated draft order data
}

// Future entities (v2/v3)
Catalog {
  id: string
  name: string
  partnerId?: string         // Partner-specific catalog
  products: CatalogProduct[]
}

CatalogProduct {
  catalogId: string
  productId: string
  customPrice?: number
  discountPercentage?: number
  isVisible: boolean
}
```

### Data Consistency
- **Optimistic Locking**: Version field on PurchaseOrder
- **Conflict Resolution**: Reject updates with stale version numbers
- **Partner Isolation**: Strict data filtering by partner relationship

---

## Feature Requirements by Version

### Version 1.0 (MVP)
**Core Features:**
- Partner management (create, invite, manage)
- Purchase order creation and submission
- Admin approval workflow (approve/reject/request modification)
- Integration with Wix Store catalog (retail pricing)
- Email notifications for status changes
- Order conversion to Wix eCommerce orders

**User Interfaces:**
- Admin dashboard (desktop-optimized)
- Partner purchase interface (responsive)

### Version 2.0 (Enhanced Pricing)
**New Features:**
- Global discount assignment per partner
- Partner-specific pricing tiers
- Enhanced partner profile management

### Version 3.0 (Custom Catalogs)
**New Features:**
- Custom catalogs per partner
- Product-specific pricing
- Catalog management interface
- Advanced partner segmentation

---

## User Experience Requirements

### Partner Interface (Wix Blocks)
- **Wix Design System**: Consistent with site branding
- **Performance**: Fast catalog browsing and filtering

### Admin Dashboard (Wix CLI)
- **Desktop-Optimized**: Primary focus on desktop experience
- **Wix Dashboard Integration**: Native Wix admin experience
- **Clear Status Indicators**: Visual order status tracking

---

## Business Requirements

### Monetization
- **Revenue Model**: subscription fee paid by site administrators
- **Target Pricing**: Mid-market SME pricing tier
- **Value Proposition**: Seamless Wix integration without third-party dependencies

### Compliance & Security
- **Data Privacy**: All data stored within Wix ecosystem
- **Partner Isolation**: Strict access controls between partners

---

## Appendices

### A. Wix API Dependencies
- Wix Members API
- Wix Stores API
- Wix Data API
- Wix eCommerce API
- Wix DraftOrder API

### B. Design System Components
- @wix/design-system (UI components)
- @wix/wix-ui-icons-common (iconography)
- Wix Dashboard framework (admin interface)

### C. Development Tools
- Wix CLI for dashboard development
- Wix Blocks for customer interface
- TypeScript for type safety
- MobX for state management