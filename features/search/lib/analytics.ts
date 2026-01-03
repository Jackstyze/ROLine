/**
 * Search Analytics
 * Track search queries, clicks, and performance metrics
 *
 * ARCHITECTURE:
 * - Client-side event collection
 * - Server action for persistence
 * - Batch sending to reduce API calls
 * - Privacy-conscious (no PII in queries logged)
 *
 * EVENTS TRACKED:
 * - search_query: User submits a search
 * - search_click: User clicks a result
 * - search_no_results: Search returned no results
 * - autocomplete_select: User selects autocomplete suggestion
 */

import type { EntityType } from '../schemas/search.schema'

// =============================================================================
// TYPES
// =============================================================================

type SearchEventBase = {
  timestamp: number
  sessionId: string
  userId?: string
}

type SearchQueryEvent = SearchEventBase & {
  type: 'search_query'
  query: string
  entityTypes: EntityType[]
  resultsCount: number
  semanticEnabled: boolean
  durationMs: number
}

type SearchClickEvent = SearchEventBase & {
  type: 'search_click'
  query: string
  resultId: string
  resultEntityType: EntityType
  position: number
  score: number
}

type SearchNoResultsEvent = SearchEventBase & {
  type: 'search_no_results'
  query: string
  entityTypes: EntityType[]
}

type AutocompleteSelectEvent = SearchEventBase & {
  type: 'autocomplete_select'
  query: string
  selectedTitle: string
  selectedEntityType: EntityType
  position: number
}

type SearchEvent =
  | SearchQueryEvent
  | SearchClickEvent
  | SearchNoResultsEvent
  | AutocompleteSelectEvent

// =============================================================================
// ANALYTICS SERVICE
// =============================================================================

class SearchAnalytics {
  private events: SearchEvent[] = []
  private sessionId: string
  private userId?: string
  private flushInterval: ReturnType<typeof setInterval> | null = null
  private maxBatchSize = 20
  private flushIntervalMs = 30000 // 30 seconds

  constructor() {
    this.sessionId = this.generateSessionId()

    // Auto-flush in browser
    if (typeof window !== 'undefined') {
      this.startAutoFlush()

      // Flush on page unload
      window.addEventListener('beforeunload', () => {
        this.flush()
      })
    }
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
  }

  private startAutoFlush(): void {
    this.flushInterval = setInterval(() => {
      this.flush()
    }, this.flushIntervalMs)
  }

  /**
   * Set user ID for authenticated users
   */
  setUserId(userId: string | undefined): void {
    this.userId = userId
  }

  /**
   * Track search query event
   */
  trackSearch(params: {
    query: string
    entityTypes: EntityType[]
    resultsCount: number
    semanticEnabled: boolean
    durationMs: number
  }): void {
    this.addEvent({
      type: 'search_query',
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.userId,
      ...params,
    })
  }

  /**
   * Track result click
   */
  trackClick(params: {
    query: string
    resultId: string
    resultEntityType: EntityType
    position: number
    score: number
  }): void {
    this.addEvent({
      type: 'search_click',
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.userId,
      ...params,
    })
  }

  /**
   * Track no results
   */
  trackNoResults(params: {
    query: string
    entityTypes: EntityType[]
  }): void {
    this.addEvent({
      type: 'search_no_results',
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.userId,
      ...params,
    })
  }

  /**
   * Track autocomplete selection
   */
  trackAutocompleteSelect(params: {
    query: string
    selectedTitle: string
    selectedEntityType: EntityType
    position: number
  }): void {
    this.addEvent({
      type: 'autocomplete_select',
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.userId,
      ...params,
    })
  }

  private addEvent(event: SearchEvent): void {
    this.events.push(event)

    // Flush if batch is full
    if (this.events.length >= this.maxBatchSize) {
      this.flush()
    }
  }

  /**
   * Flush events to server
   */
  async flush(): Promise<void> {
    if (this.events.length === 0) return

    const eventsToSend = [...this.events]
    this.events = []

    try {
      // Use sendBeacon for reliability on page unload
      if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
        const sent = navigator.sendBeacon(
          '/api/analytics/search',
          JSON.stringify({ events: eventsToSend })
        )
        if (!sent) {
          // Fallback to fetch
          await this.sendViaFetch(eventsToSend)
        }
      } else {
        await this.sendViaFetch(eventsToSend)
      }
    } catch (error) {
      console.error('[ANALYTICS] Failed to send events:', error)
      // Put events back for retry
      this.events = [...eventsToSend, ...this.events]
    }
  }

  private async sendViaFetch(events: SearchEvent[]): Promise<void> {
    await fetch('/api/analytics/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events }),
      keepalive: true,
    })
  }

  /**
   * Get current session stats
   */
  getSessionStats(): {
    sessionId: string
    eventCount: number
    pendingEvents: number
  } {
    return {
      sessionId: this.sessionId,
      eventCount: this.events.length,
      pendingEvents: this.events.length,
    }
  }

  /**
   * Cleanup on unmount
   */
  destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval)
    }
    this.flush()
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

let analyticsInstance: SearchAnalytics | null = null

export function getSearchAnalytics(): SearchAnalytics {
  if (!analyticsInstance) {
    analyticsInstance = new SearchAnalytics()
  }
  return analyticsInstance
}

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

export function trackSearch(params: Parameters<SearchAnalytics['trackSearch']>[0]): void {
  getSearchAnalytics().trackSearch(params)
}

export function trackSearchClick(params: Parameters<SearchAnalytics['trackClick']>[0]): void {
  getSearchAnalytics().trackClick(params)
}

export function trackNoResults(params: Parameters<SearchAnalytics['trackNoResults']>[0]): void {
  getSearchAnalytics().trackNoResults(params)
}

export function trackAutocompleteSelect(
  params: Parameters<SearchAnalytics['trackAutocompleteSelect']>[0]
): void {
  getSearchAnalytics().trackAutocompleteSelect(params)
}
