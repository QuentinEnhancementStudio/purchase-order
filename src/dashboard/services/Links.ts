/**
 * Links utility service for Wix dashboard navigation and URL operations
 * 
 * Features:
 * - Navigate to Wix dashboard pages using modern Dashboard SDK
 * - Generate URLs for dashboard pages
 * - URL validation and safe URL generation
 * - Navigation utilities for common operations
 * - URL builders for query string construction
 * 
 * Usage Examples:
 * ```typescript
 * // Dashboard navigation
 * await Links.Navigation.toOrdersPage();
 * await Links.Navigation.toOrder('order-123');
 * await Links.Navigation.editDraftOrder('draft-456');
 * 
 * // URL generation using Wix API (may throw AppError)
 * const ordersUrl = await Links.generateDashboardUrl('page-id', '/orders');
 * const safeUrl = Links.getSafeUrl(userInput, fallbackUrl);
 * 
 * // URL building
 * const url = Links.Builders.buildUrl('https://example.com', { page: 1, size: 10 });
 * ```
 */
import { dashboard } from '@wix/dashboard';
import { pages } from '@wix/ecom/dashboard';
import { AppError } from './AppError/AppError';
import { ErrorCategory, ErrorSeverity } from './AppError/ErrorCategories';

export class Links {
  /**
   * Generate a dashboard page URL using Wix Dashboard API
   * @param pageId - The dashboard page ID
   * @param relativeUrl - Optional relative URL segment to append
   * @returns Promise that resolves to the dashboard URL string
   * @throws AppError when pageId is invalid or dashboard API fails
   */
  static async generateDashboardUrl(pageId: string, relativeUrl?: string): Promise<string> {
    if (!pageId || pageId.trim() === '') {
      throw new AppError({
        category: ErrorCategory.INPUT,
        technicalMessage: 'pageId is required and cannot be empty',
        userMessage: 'Invalid page ID provided',
        source: 'Links.generateDashboardUrl',
        severity: ErrorSeverity.MEDIUM,
        context: { pageId, relativeUrl }
      });
    }

    try {
      return await dashboard.getPageUrl({ pageId: pageId.trim(), relativeUrl });
    } catch (error) {
      throw new AppError({
        category: ErrorCategory.WIXPLATFORM,
        technicalMessage: `Failed to generate dashboard URL for pageId: ${pageId}, relativeUrl: ${relativeUrl || 'none'}`,
        userMessage: 'Unable to generate dashboard link',
        source: 'Links.generateDashboardUrl',
        severity: ErrorSeverity.MEDIUM,
        context: { pageId, relativeUrl },
        cause: error as Error
      });
    }
  }

  /**
   * Navigate to a dashboard page using the modern Dashboard SDK
   * @param pageId - The dashboard page ID
   * @param relativeUrl - Optional relative URL segment
   * @param options - Navigation options
   * @throws AppError when pageId is invalid or navigation fails
   */
  static async navigateToDashboardPage(
    pageId: string, 
    relativeUrl?: string,
    options?: { displayMode?: 'main' | 'overlay' | 'auto'; history?: 'push' | 'replace' }
  ): Promise<void> {
    if (!pageId || pageId.trim() === '') {
      throw new AppError({
        category: ErrorCategory.INPUT,
        technicalMessage: 'pageId is required and cannot be empty',
        userMessage: 'Invalid page ID provided',
        source: 'Links.navigateToDashboardPage',
        severity: ErrorSeverity.MEDIUM,
        context: { pageId, relativeUrl }
      });
    }

    try {
      dashboard.navigate(
        { pageId: pageId.trim(), relativeUrl },
        options
      );
    } catch (error) {
      throw new AppError({
        category: ErrorCategory.WIXPLATFORM,
        technicalMessage: `Failed to navigate to dashboard page with pageId: ${pageId}, relativeUrl: ${relativeUrl || 'none'}`,
        userMessage: 'Unable to navigate to the requested page',
        source: 'Links.navigateToDashboardPage',
        severity: ErrorSeverity.MEDIUM,
        context: { pageId, relativeUrl },
        cause: error as Error
      });
    }
  }

  /**
   * Navigation utilities for common Wix dashboard operations
   */
  static Navigation = {
    /**
     * Navigate to Wix Store orders page
     * Uses the modern Dashboard SDK for navigation
     */
    async toOrders(): Promise<void> {
      // Store orders page ID from Wix dashboard
      const storeOrdersPageId = '3a5ca9b2-5a4a-4c55-9b4e-8e4e9b5b2d2c';
      await Links.navigateToDashboardPage(storeOrdersPageId);
    },

    /**
     * Navigate to specific Wix order
     * @param orderId - The order ID to navigate to
     * @throws AppError when orderId is invalid
     */
    async toOrder(orderId: string): Promise<void> {
      if (!orderId || orderId.trim() === '') {
        throw new AppError({
          category: ErrorCategory.INPUT,
          technicalMessage: 'orderId is required and cannot be empty',
          userMessage: 'Invalid order ID provided',
          source: 'Links.Navigation.toOrder',
          severity: ErrorSeverity.MEDIUM,
          context: { orderId }
        });
      }
      
      const storeOrdersPageId = '3a5ca9b2-5a4a-4c55-9b4e-8e4e9b5b2d2c';
      await Links.navigateToDashboardPage(storeOrdersPageId, `/${orderId.trim()}`);
    },

    /**
     * Navigate to edit draft order page
     * @param draftOrderId - The draft order ID to edit
     * @throws AppError when draftOrderId is invalid or navigation fails
     */
    async editDraftOrder(draftOrderId: string): Promise<void> {
      if (!draftOrderId) {
        throw new AppError({
          category: ErrorCategory.INPUT,
          technicalMessage: 'draftOrderId is required and cannot be empty',
          userMessage: 'Invalid draft order ID provided',
          source: 'Links.Navigation.editDraftOrder',
          severity: ErrorSeverity.MEDIUM,
          context: { draftOrderId }
        });
      }
      
      try {
		dashboard.navigate(pages.editDraftOrder({ draftOrderId: draftOrderId }));
      } catch (error) {
        throw new AppError({
          category: ErrorCategory.WIXPLATFORM,
          technicalMessage: `Failed to navigate to edit draft order for draftOrderId: ${draftOrderId}`,
          userMessage: 'Unable to navigate to draft order editor',
          source: 'Links.Navigation.editDraftOrder',
          severity: ErrorSeverity.MEDIUM,
          context: { draftOrderId },
          cause: error as Error
        });
      }
    },
  };
}