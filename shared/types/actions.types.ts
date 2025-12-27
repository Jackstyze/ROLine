/**
 * Shared Action Types
 * DRY: Single source of truth for server action results
 */

/**
 * Standard result type for all server actions
 * Following Result pattern (no silent failures)
 */
export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> }

/**
 * Helper to create success result
 */
export function success<T>(data: T): ActionResult<T> {
  return { success: true, data }
}

/**
 * Helper to create error result
 */
export function failure(
  error: string,
  fieldErrors?: Record<string, string[]>
): ActionResult<never> {
  return { success: false, error, fieldErrors }
}

/**
 * Paginated response type
 */
export type PaginatedResult<T> = {
  items: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
  totalPages: number
}

/**
 * Helper to create paginated result
 */
export function paginate<T>(
  items: T[],
  total: number,
  page: number,
  limit: number
): PaginatedResult<T> {
  return {
    items,
    total,
    page,
    limit,
    hasMore: page * limit < total,
    totalPages: Math.ceil(total / limit),
  }
}
