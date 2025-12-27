/**
 * Application Limits and Constants
 * ZERO HARDCODE - All limits defined here
 */

// Algeria wilayas (69 total as of November 2025)
export const WILAYA_MIN = 1
export const WILAYA_MAX = 69 // Updated Nov 2025 with new subdivisions

// Product limits
export const MAX_PRODUCT_IMAGES = 5
export const MAX_IMAGE_SIZE_MB = 5
export const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024

// Pagination
export const DEFAULT_PAGE_SIZE = 20
export const MAX_PAGE_SIZE = 100

// Text limits
export const MAX_TITLE_LENGTH = 200
export const MAX_DESCRIPTION_LENGTH = 2000
export const MAX_ADDRESS_LENGTH = 500
export const MAX_NOTES_LENGTH = 500
export const MIN_PASSWORD_LENGTH = 8
export const MAX_PASSWORD_LENGTH = 72

// Search
export const MAX_SEARCH_LENGTH = 100
