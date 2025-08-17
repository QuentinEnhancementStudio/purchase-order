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
import { Partner, PartnerStatus } from '../../../types';
import { getStatusDisplayName } from '../../../../backend/entities/partner';
import { PartnersTableProps, SortField, SortDirection } from './PartnersTable.types';

export const PartnersTable: React.FC<PartnersTableProps> = observer(({
  partners,
  isLoading,
  searchQuery,
  statusFilter,
  sortField,
  sortDirection,
  currentPage,
  totalPages,
  getMemberDisplayName,
  onSearchChange,
  onStatusFilterChange,
  onSortChange,
  onPageChange,
  onAddPartner,
  onEditPartner,
  onDeletePartner
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

  const formatDiscount = (globalDiscountPercentage?: number) => {
    if (globalDiscountPercentage === undefined || globalDiscountPercentage === null) {
      return '0%';
    }
    return `${globalDiscountPercentage}%`;
  };

  const allPartnerStatuses: PartnerStatus[] = ['active', 'inactive'];
  
  const statusFilterOptions = [
    { id: '', value: 'All' },
    ...allPartnerStatuses.map(status => ({
      id: status,
      value: getStatusDisplayName(status)
    }))
  ];

  const columns = [
    {
      title: (
        <div onClick={() => handleSort('companyName')} style={{ cursor: 'pointer' }}>
          <Box align="space-between" verticalAlign="middle">
            <Text size="small">Company Name</Text>
            {getSortIcon('companyName')}
          </Box>
        </div>
      ),
      render: (partner: Partner) => (
        <Text size="medium" weight="normal">
          {partner.companyName}
        </Text>
      ),
      width: '30%'
    },
    {
      title: <Text size="small" >Member</Text>,
      render: (partner: Partner) => (
        <Text size="medium" secondary>
          {partner.memberId ? getMemberDisplayName(partner.memberId) : 'No member assigned'}
        </Text>
      ),
      width: '30%'
    },
    {
      title: (
        <div onClick={() => handleSort('globalDiscountPercentage')} style={{ cursor: 'pointer' }}>
          <Box align="space-between" verticalAlign="middle">
            <Text size="small" >Discount</Text>
            {getSortIcon('globalDiscountPercentage')}
          </Box>
        </div>
      ),
      render: (partner: Partner) => (
        <Text size="medium">
{formatDiscount(partner.globalDiscountPercentage)}
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
      render: (partner: Partner) => (
        <StatusBadge status={partner.status} />
      ),
      width: '15%'
    },
    {
      title: <Text size="small"></Text>,
      render: (partner: Partner) => (
        <TableActionCell
          size="medium"
          primaryAction={{
            text: 'Edit',
            onClick: () => onEditPartner(partner)
          }}
          secondaryActions={[
            {
              text: 'Delete',
              icon: <Icons.DeleteSmall />,
              onClick: () => onDeletePartner(partner)
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
      <TableToolbar.Title>Partners</TableToolbar.Title>
      <TableToolbar.ItemGroup position="end">
        <TableToolbar.Item>
          <Input
            size="small"
            placeholder="Search partners..."
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
        <TableToolbar.Item>
          <Button
            size="small"
            prefixIcon={<Icons.Add />}
            onClick={onAddPartner}
          >
            Add Partner
          </Button>
        </TableToolbar.Item>
      </TableToolbar.ItemGroup>
    </TableToolbar>
  );

  const renderEmptyState = () => (
    <EmptyState
      title={searchQuery || statusFilter !== '' ? 'No partners found' : 'No partners yet'}
      subtitle={
        searchQuery || statusFilter !== ''
          ? 'Try adjusting your search or filter criteria.'
          : 'Add your first partner to get started with wholesale management.'
      }
image={<Icons.User />}
    >
      {!searchQuery && statusFilter === '' && (
        <Button
          size="medium"
          prefixIcon={<Icons.Add />}
          onClick={onAddPartner}
        >
          Add Partner
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
        <LoadingSpinner message="Loading partners..." />
      </Card>
    );
  }

  if (partners.length === 0) {
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
        data={partners}
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