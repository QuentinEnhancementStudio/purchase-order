import { AppError } from '../../dashboard/services/AppError/AppError';
import { ErrorCategory, ErrorSeverity } from '../../dashboard/services/AppError/ErrorCategories';

/**
 * Helper function to handle error responses with operationId support for web methods
 * 
 * @param error - The error that occurred (can be AppError or any other error)
 * @param operationId - Optional operation ID to include in the response
 * @param defaultMessage - Default message to use for technical and user messages
 * @param source - Source method name for logging
 * @param severity - Error severity level (defaults to MEDIUM)
 * @returns Promise rejection with standardized error response
 */
export const handleWebMethodErrorResponse = (
	error: any, 
	operationId?: string, 
	defaultMessage?: string, 
	source?: string, 
	severity: ErrorSeverity = ErrorSeverity.MEDIUM
) => {
	// Use existing AppError or create new one
	const appError = error instanceof AppError 
		? error 
		: new AppError({
			category: ErrorCategory.SERVER,
			technicalMessage: `${defaultMessage}: ${error instanceof Error ? error.message : String(error)}`,
			userMessage: defaultMessage || 'An error occurred',
			source: source || 'unknown',
			layer: 'webMethod',
			severity,
			context: { operationId }
		});

	// Common logging and response construction
	appError.log();
	const errorResponse: any = appError.toJSON();
	// Include operationId in error response if it was provided
	if (operationId) {
		errorResponse.operationId = operationId;
	}
	return Promise.reject(errorResponse);
};