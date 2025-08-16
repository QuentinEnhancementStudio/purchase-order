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
	AutoComplete,
	listItemSelectBuilder,
} from '@wix/design-system';

import { PartnerFormModalProps } from './PartnerFormModal.types';
import { ValidationService, ValidationResult} from '../../../../backend/services/validation/validation';
import { PartnerBase, PartnerBaseSchema, PartnerForm, PartnerFormSchema } from '../../../../backend/entities/partner/schemas';
import { PartnerStatus } from '../../../types';
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
	members,
	isLoadingMembers,
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
	const [memberSearchValue, setMemberSearchValue] = useState('');

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
				// Set search value to selected member's name for editing
				const selectedMember = members.find(m => m._id === partner.memberId);
				setMemberSearchValue(selectedMember?.contact?.displayName || '');
			} else {
				setFormData(defaults);
				setMemberSearchValue('');
			}
			
			setValidation(null);
			setHasSubmitted(false);
		}
	}, [isOpen, partner, members]);


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
		onCancel();
	}

	const isEditing = !!partner;

	// Generate status options based on whether adding new or editing existing partner
	const availableStatuses = isEditing
		? PartnerStatusSchema.options
		: ['active', 'inactive'] as const;

	// Simple options for basic Dropdown functionality
	const statusOptionsSimple = availableStatuses.map(status => ({
		id: status,
		value: getStatusDisplayName(status)
	}));

	const memberOptions = members.map(member => 
		listItemSelectBuilder({
			id: member._id,
			title: member.contact?.displayName || 'Unknown',
			label: member.contact?.displayName || 'Unknown',
			subtitle: member.contact?.displayName !== member.loginEmail ? member.loginEmail : undefined,
		})
	);
	const title = isEditing ? `Edit Partner: ${partner?.companyName}` : 'Add New Partner';

	// Check if status has changed from original value
	const hasStatusChanged = isEditing && partner && formData.status !== partner.status;

	// Form is valid if validation passes, hasn't been submitted yet, or all field errors have been cleared
	const hasFieldErrors = validation?.fieldErrors && Object.keys(validation.fieldErrors).length > 0;
	const canSubmit = !validation || validation.success || !hasSubmitted || !hasFieldErrors;

	return (
		<Modal
			isOpen={isOpen}
			onRequestClose={handleCancel}
			shouldCloseOnOverlayClick={true}
			screen="desktop"
		>
			<CustomModalLayout
				title={title}
				onCloseButtonClick={handleCancel}
				primaryButtonText={isEditing ? 'Update Partner' : 'Create Partner'}
				secondaryButtonText="Cancel"
				primaryButtonOnClick={handleSubmit}
				secondaryButtonOnClick={handleCancel}
				primaryButtonProps={{
					disabled: (!canSubmit && hasSubmitted)
				}}
				secondaryButtonProps={{
					disabled: false
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
								/>
							</FormField>

							<FormField
								label="Wix Member"
								required
								infoContent="Select the Wix member associated with this partner"
								labelPlacement="top"
								status={validation?.fieldErrors?.memberId ? 'error' : undefined}
								statusMessage={validation?.fieldErrors?.memberId}
							>
								<AutoComplete
									
									options={memberOptions}
									selectedId={formData.memberId}
									value={memberSearchValue}
									onChange={(e) => {
										const newSearchValue = e.target.value;
										setMemberSearchValue(newSearchValue);
										
										// Clear memberId if user clears the input
										if (!newSearchValue.trim()) {
											handleInputChange('memberId', '');
										}
									}}
									onSelect={(option) => {
										handleInputChange('memberId', option?.id as string || '');
										setMemberSearchValue(option?.label as string || '');
									}}
									onBlur={() => {
										// Reset to previously selected member's name or blank if no selection
										const selectedMember = members.find(m => m._id === formData.memberId);
										setMemberSearchValue(selectedMember?.contact?.displayName || '');
									}}
									placeholder={isLoadingMembers ? "Loading members..." : "Select a member"}
									disabled={isLoadingMembers}
									predicate={(option) => {
										if (!memberSearchValue.trim()) return true;
										
										const searchTerm = memberSearchValue.toLowerCase();
										
										// Find the actual member using option.id
										const member = members.find(m => m._id === option.id);
										if (!member) return false;
										
										// Search in multiple member fields
										const searchFields = [
											member.contact?.firstName,
											member.contact?.lastName,
											member.loginEmail
										];
										
										return searchFields.some(field => 
											field && field.toLowerCase().includes(searchTerm)
										);
									}}
									popoverProps={{
										appendTo: 'window',
										zIndex: 9000,
									}}
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
											disabled={false}
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
											options={statusOptionsSimple}
											selectedId={formData.status}
											onSelect={(option) => handleInputChange('status', option?.id as PartnerStatus || 'active')}
											status={validation?.fieldErrors?.status ? 'error' : undefined}
											statusMessage={validation?.fieldErrors?.status}
											disabled={false}
											popoverProps={{
												appendTo: 'scrollParent',
												dynamicWidth: false,
											}}
										/>
									</FormField>
								</Box>
							</Box>
						</Box>
					</Box>
				}
				footnote={hasStatusChanged ? (
					<Text size="small">
						Changing partner status will immediately affect their access to wholesale features and pricing.
					</Text>
				) : undefined}
				footnoteSkin={hasStatusChanged ? "light" : undefined}
			/>
		</Modal>
	);
});