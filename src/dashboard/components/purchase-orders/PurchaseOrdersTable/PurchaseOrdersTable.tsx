import React from 'react';
import { observer } from 'mobx-react';
import {
  Table,
  Card,
  TableToolbar,
  Button,
  Text,
  Input,
  Dropdown,
  Box,
  Pagination,
  TableActionCell,
  EmptyState
} from '@wix/design-system';
import * as Icons from '@wix/wix-ui-icons-common';

import { StatusBadge, LoadingSpinner } from '../../common';
import { PurchaseOrder, PurchaseOrderStatus } from '../../../types';
import { getStatusDisplayName } from '../../../../backend/entities/purchase-order';
import { PurchaseOrdersTableProps, SortField, SortDirection } from './PurchaseOrdersTable.types';

export const PurchaseOrdersTable: React.FC<PurchaseOrdersTableProps> = observer(({
  purchaseOrders,
  isLoading,
  searchQuery,
  statusFilter,
  sortField,
  sortDirection,
  currentPage,
  totalPages,
  getPartnerDisplayName,
  onSearchChange,
  onStatusFilterChange,
  onSortChange,
  onPageChange,
  onAddPurchaseOrder,
  onEditPurchaseOrder,
  onDeletePurchaseOrder,
  onGoToOrder,
  onViewPurchaseOrder
}) => {
  const handleSort = (field: SortField) => {
    const newDirection: SortDirection = 
      sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
    onSortChange(field, newDirection);
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <Icons.ChevronDown />;
    return sortDirection === 'asc' ? <Icons.ChevronUp /> : <Icons.ChevronDown />;
  };

  const formatLastUpdate = (purchaseOrder: PurchaseOrder) => {
    const date = purchaseOrder.lastUpdate || purchaseOrder._updatedDate;
    if (!date) return 'N/A';
    
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  const getDisplayId = (purchaseOrder: PurchaseOrder) => {
    return purchaseOrder.identifier || purchaseOrder._id;
  };

  const allPurchaseOrderStatuses: PurchaseOrderStatus[] = ['draft', 'pending', 'approved', 'rejected', 'canceled'];
  
  const statusFilterOptions = [
    { id: '', value: 'Active Orders' },
    { id: 'all', value: 'All Orders' },
    ...allPurchaseOrderStatuses.map(status => ({
      id: status,
      value: getStatusDisplayName(status)
    }))
  ];

  const columns = [
    {
      title: (
        <div onClick={() => handleSort('identifier')} style={{ cursor: 'pointer' }}>
          <Box align="space-between" verticalAlign="middle">
            <Text size="small">#</Text>
            {getSortIcon('identifier')}
          </Box>
        </div>
      ),
      render: (purchaseOrder: PurchaseOrder) => (
        <Text size="medium" weight="normal">
          {getDisplayId(purchaseOrder)}
        </Text>
      ),
      width: '20%'
    },
    {
      title: (
        <div onClick={() => handleSort('partnerId')} style={{ cursor: 'pointer' }}>
          <Box align="space-between" verticalAlign="middle">
            <Text size="small">Company</Text>
            {getSortIcon('partnerId')}
          </Box>
        </div>
      ),
      render: (purchaseOrder: PurchaseOrder) => (
        <Text size="medium" secondary>
          {purchaseOrder.partnerId ? getPartnerDisplayName(purchaseOrder.partnerId) : 'No partner assigned'}
        </Text>
      ),
      width: '25%'
    },
    {
      title: (
        <div onClick={() => handleSort('lastUpdate')} style={{ cursor: 'pointer' }}>
          <Box align="space-between" verticalAlign="middle">
            <Text size="small">Last Update</Text>
            {getSortIcon('lastUpdate')}
          </Box>
        </div>
      ),
      render: (purchaseOrder: PurchaseOrder) => (
        <Text size="medium">
          {formatLastUpdate(purchaseOrder)}
        </Text>
      ),
      width: '20%'
    },
    {
      title: <Text size="small">Amount</Text>,
      render: (purchaseOrder: PurchaseOrder) => (
        <Text size="medium" secondary>
          TBD
        </Text>
      ),
      width: '15%'
    },
    {
      title: (
        <div onClick={() => handleSort('status')} style={{ cursor: 'pointer' }}>
          <Box align="space-between" verticalAlign="middle">
            <Text size="small">Status</Text>
            {getSortIcon('status')}
          </Box>
        </div>
      ),
      render: (purchaseOrder: PurchaseOrder) => (
        <StatusBadge status={purchaseOrder.status} />
      ),
      width: '10%'
    },
    {
      title: <Text size="small"></Text>,
      render: (purchaseOrder: PurchaseOrder) => (
        <TableActionCell
          size="medium"
          primaryAction={{
            text: 'Edit',
            onClick: () => onEditPurchaseOrder(purchaseOrder)
          }}
          secondaryActions={[
            {
              text: 'Go to Order',
              icon: <Icons.ExternalLinkSmall />,
              onClick: () => onGoToOrder(purchaseOrder),
              disabled: !purchaseOrder.orderId
            },
            {
              text: 'View Purchase Order',
              icon: <Icons.VisibleSmall />,
              onClick: () => onViewPurchaseOrder(purchaseOrder),
              disabled: !purchaseOrder.draftOrderId || purchaseOrder.status !== 'pending'
            },
            {
              text: 'Delete',
              icon: <Icons.DeleteSmall />,
              onClick: () => onDeletePurchaseOrder(purchaseOrder)
            }
          ]}
          moreActionsTooltipText="More actions"
          popoverMenuProps={{
            appendTo: 'window',
            placement: 'left'
          }}
        />
      ),
      width: '10%'
    }
  ];

  const renderToolbar = () => (
    <TableToolbar>
      <TableToolbar.Title>Purchase Orders</TableToolbar.Title>
      <TableToolbar.ItemGroup position="end">
        <TableToolbar.Item>
          <Input
            size="small"
            placeholder="Search purchase orders..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            prefix={<Input.IconAffix><Icons.Search /></Input.IconAffix>}
            clearButton
            onClear={() => onSearchChange('')}
          />
        </TableToolbar.Item>
        <TableToolbar.Item>
          <Dropdown
            size="small"
            placeholder="Filter by status"
            options={statusFilterOptions}
            selectedId={statusFilter}
            onSelect={(option) => onStatusFilterChange(option?.id as string || '')}
          />
        </TableToolbar.Item>
      </TableToolbar.ItemGroup>
    </TableToolbar>
  );

  const renderEmptyState = () => (
    <EmptyState
      title={searchQuery || statusFilter !== '' ? 'No purchase orders found' : 'No active purchase orders'}
      subtitle={
        searchQuery || statusFilter !== ''
          ? 'Try adjusting your search or filter criteria.'
          : 'No pending, approved, or rejected orders found. Use "All Orders" filter to view drafts and canceled orders.'
      }
      image={<Icons.Receipt />}
    >
      {!searchQuery && statusFilter === '' && (
        <Button
          size="medium"
          prefixIcon={<Icons.Add />}
          onClick={onAddPurchaseOrder}
        >
          Add Purchase Order
        </Button>
      )}
    </EmptyState>
  );

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    
    return (
      <Box align="center" paddingTop="24px">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onChange={(event) => onPageChange(event.page)}
        />
      </Box>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <LoadingSpinner message="Loading purchase orders..." />
      </Card>
    );
  }

  if (purchaseOrders.length === 0) {
    return (
      <Card>
        {renderToolbar()}
        <Box padding="60px">
          {renderEmptyState()}
        </Box>
      </Card>
    );
  }

  return (
    <Card>
      <Table
        data={purchaseOrders}
        columns={columns}
        rowVerticalPadding="medium"
        skin="standard"
      >
        {renderToolbar()}
        <Table.Content />
      </Table>
      {renderPagination()}
    </Card>
  );
});