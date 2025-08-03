import React from 'react';
import { Badge } from '@wix/design-system';
import { StatusBadgeProps } from './StatusBadge.types';

export const StatusBadge: React.FC<StatusBadgeProps> = ({ 
  status, 
  variant = 'standard',
  size = 'medium',
  className
}) => {
  const getStatusConfig = (status: string) => {
    const configs: Record<string, { skin: string; text: string }> = {
      // Partner statuses
      active: { skin: 'success', text: 'Active' },
      inactive: { skin: 'neutralLight', text: 'Inactive' },
      pending: { skin: 'warning', text: 'Pending' },
      
      // Purchase order statuses
      draft: { skin: 'neutralLight', text: 'Draft' },
      submitted: { skin: 'standard', text: 'Submitted' },
      under_review: { skin: 'warning', text: 'Under Review' },
      modification_requested: { skin: 'warningLight', text: 'Modification Requested' },
      approved: { skin: 'success', text: 'Approved' },
      rejected: { skin: 'danger', text: 'Rejected' }
    };

    return configs[status] || { skin: 'neutralLight', text: status };
  };

  const config = getStatusConfig(status);

  return (
    <Badge
      skin={config.skin}
      size={size}
      type={variant}
      className={className}
    >
      {config.text}
    </Badge>
  );
};