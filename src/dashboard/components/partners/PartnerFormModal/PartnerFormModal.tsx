import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react';
import {
	Modal,
	CustomModalLayout,
	Box,
	Text,
	Input,
	FormField,
	Dropdown,
} from '@wix/design-system';

import { PartnerFormModalProps } from './PartnerFormModal.types';
import { ValidationService, ValidationResult} from '../../../../backend/services/validation/validation';
import { PartnerBase, PartnerBaseSchema, PartnerForm, PartnerFormSchema } from '../../../../backend/entities/partner/schemas';
import { PartnerStatus } from '../../../types';
import { getWixMembers } from '../../../../backend/web-methods/partners.web';
import { MemberOption } from '../../../../backend/services/members';
import { getStatusDisplayName } from '../../../../backend/entities/partner';
import {
	PartnerStatusSchema,
	COMPANY_NAME_MAX_LENGTH,
	DISCOUNT_MIN_VALUE,
	DISCOUNT_MAX_VALUE
} from '../../../../backend/entities/partner/schemas';

export const PartnerFormModal: React.FC<PartnerFormModalProps> = observer(({
	isOpen,
	partner,
	isLoading,
	onSave,
	onCancel
}) => {
	const [formData, setFormData] = useState<PartnerForm>(() => {
		// Get schema defaults from form schema
		const defaults = PartnerFormSchema.parse({});
		
		// Merge with existing partner data if available
		if (partner) {
			return {
				...defaults,
				...partner,
			};
		}
		
		return defaults;
	});
	const [validation, setValidation] = useState<ValidationResult<PartnerBase> | null>(null);
	const [hasSubmitted, setHasSubmitted] = useState(false);
	const [members, setMembers] = useState<MemberOption[]>([]);
	const [loadingMembers, setLoadingMembers] = useState(false);

	useEffect(() => {
		if (isOpen) {
			// Get schema defaults from form schema
			const defaults = PartnerFormSchema.parse({});
			
			// Merge with existing partner data if available
			if (partner) {
				setFormData({
					...defaults,
					...partner,
				});
			} else {
				setFormData(defaults);
			}
			
			setValidation(null);
			setHasSubmitted(false);
			loadMembers();
		}
	}, [isOpen, partner]);

	async function loadMembers() {
		setLoadingMembers(true);
		try {
			const membersList = await getWixMembers();
			setMembers(membersList);
		} catch (error) {
			console.error('Error loading members:', error);
			setMembers([]);
		} finally {
			setLoadingMembers(false);
		}
	}

	function handleInputChange<K extends keyof PartnerForm>(field: K, value: PartnerForm[K]) {
		setFormData(prev => ({ ...prev, [field]: value }));

		// Clear error when user starts typing
		if (validation && validation.fieldErrors?.[field]) {
			setValidation(prev => {
				if (!prev || !prev.fieldErrors) return prev;
				const newFieldErrors = { ...prev.fieldErrors };
				delete newFieldErrors[field];
				return {
					...prev,
					fieldErrors: newFieldErrors
				};
			});
		}
	}

	function handleSubmit() {
		// Validate form data directly with business schema
		const validationResult = ValidationService.validate(PartnerBaseSchema, formData, "PartnerBase");
		setValidation(validationResult);
		setHasSubmitted(true);
		console.log('Validation result:', validationResult);
		if (validationResult.success) {
			onSave(validationResult.data!);
		}
	}

	function handleCancel() {
		if (!isLoading) {
			onCancel();
		}
	}

	const isEditing = !!partner;

	// Generate status options based on whether adding new or editing existing partner
	const availableStatuses = isEditing
		? PartnerStatusSchema.options
		: ['active', 'inactive'] as const;

	const statusOptions = availableStatuses.map(status => ({
		id: status,
		value: getStatusDisplayName(status)
	}));

	const memberOptions = members.map(member => ({
		id: member.id,
		value: `${member.displayName} (${member.email})`
	}));
	const title = isEditing ? `Edit Partner: ${partner?.companyName}` : 'Add New Partner';

	// Form is valid if validation passes or hasn't been submitted yet
	const canSubmit = !validation || validation.success || !hasSubmitted;

	return (
		<Modal
			isOpen={isOpen}
			onRequestClose={handleCancel}
			shouldCloseOnOverlayClick={!isLoading}
			screen="desktop"
		>
			<CustomModalLayout
				title={title}
				onCloseButtonClick={handleCancel}
				primaryButtonText={isLoading ? 'Saving...' : isEditing ? 'Update Partner' : 'Create Partner'}
				secondaryButtonText="Cancel"
				primaryButtonOnClick={handleSubmit}
				secondaryButtonOnClick={handleCancel}
				primaryButtonProps={{
					disabled: isLoading || (!canSubmit && hasSubmitted)
				}}
				secondaryButtonProps={{
					disabled: isLoading
				}}
				content={
					<Box direction="vertical" gap="24px">
						{/* Company Information Section */}
						<Box direction="vertical" gap="16px">
							<Text size="medium" weight="bold">Partner Information</Text>

							<FormField
								label="Company Name"
								required
								infoContent="The legal name of the partner company"
								labelPlacement="top"
							>
								<Input
									value={formData.companyName}
									onChange={(e) => handleInputChange('companyName', e.target.value)}
									placeholder="Enter company name"
									status={validation?.fieldErrors?.companyName ? 'error' : undefined}
									statusMessage={validation?.fieldErrors?.companyName}
									maxLength={COMPANY_NAME_MAX_LENGTH}
									disabled={isLoading}
								/>
							</FormField>

							<FormField
								label="Wix Member"
								required
								infoContent="Select the Wix member associated with this partner"
								labelPlacement="top"
							>
								<Dropdown
									placeholder={loadingMembers ? "Loading members..." : "Select a member"}
									options={memberOptions}
									selectedId={formData.memberId}
									onSelect={(option) => handleInputChange('memberId', option?.id as string || '')}
									status={validation?.fieldErrors?.memberId ? 'error' : undefined}
									statusMessage={validation?.fieldErrors?.memberId}
									disabled={isLoading || loadingMembers}
								/>
							</FormField>

							<Box direction="horizontal" gap="16px">
								<Box flex="1">
									<FormField
										label="Global Discount %"
										infoContent="Default discount percentage for this partner"
										labelPlacement="top"
									>
										<Input
											type="number"
											value={formData.globalDiscountPercentage.toString()}
											onChange={(e) => handleInputChange('globalDiscountPercentage', parseFloat(e.target.value) || 0)}
											placeholder="0"
											suffix="%"
											min={DISCOUNT_MIN_VALUE}
											max={DISCOUNT_MAX_VALUE}
											step={0.1}
											status={validation?.fieldErrors?.globalDiscountPercentage ? 'error' : undefined}
											statusMessage={validation?.fieldErrors?.globalDiscountPercentage}
											disabled={isLoading}
										/>
									</FormField>
								</Box>
								<Box flex="1">
									<FormField
										label="Status"
										required
										labelPlacement="top"
									>
										<Dropdown
											placeholder="Select status"
											options={statusOptions}
											selectedId={formData.status}
											onSelect={(option) => handleInputChange('status', option?.id as PartnerStatus || 'pending')}
											status={validation?.fieldErrors?.status ? 'error' : undefined}
											statusMessage={validation?.fieldErrors?.status}
											disabled={isLoading}
										/>
									</FormField>
								</Box>
							</Box>
						</Box>
					</Box>
				}
			/>
		</Modal>
	);
});