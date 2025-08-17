/**
 * Pagination utility service providing pure functions for pagination calculations
 */
export class Pagination {
  /**
   * Get items for a specific page from an array
   * @param items - Array of items to paginate
   * @param page - Current page number (1-based)
   * @param pageSize - Number of items per page
   * @returns Array of items for the current page
   */
  static getPageItems<T>(items: T[], page: number, pageSize: number): T[] {
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return items.slice(startIndex, endIndex);
  }

  /**
   * Calculate pagination metadata
   * @param totalItems - Total number of items
   * @param page - Current page number (1-based)
   * @param pageSize - Number of items per page
   * @returns Pagination metadata object
   */
  static getPaginationMetadata(totalItems: number, page: number, pageSize: number) {
    const totalPages = Math.ceil(totalItems / pageSize);
    
    return {
      totalItems,
      totalPages,
      currentPage: page,
      pageSize,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1
    };
  }
}