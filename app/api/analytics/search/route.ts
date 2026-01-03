/**
 * Search Analytics API Route
 * Receives search events from client
 *
 * NOTE: Events are logged for now.
 * For production, store in analytics database (e.g., Supabase, ClickHouse)
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// =============================================================================
// VALIDATION SCHEMA
// =============================================================================

const SearchEventSchema = z.object({
  type: z.enum([
    'search_query',
    'search_click',
    'search_no_results',
    'autocomplete_select',
  ]),
  timestamp: z.number(),
  sessionId: z.string(),
  userId: z.string().optional(),
  query: z.string().optional(),
  entityTypes: z.array(z.string()).optional(),
  resultsCount: z.number().optional(),
  semanticEnabled: z.boolean().optional(),
  durationMs: z.number().optional(),
  resultId: z.string().optional(),
  resultEntityType: z.string().optional(),
  position: z.number().optional(),
  score: z.number().optional(),
  selectedTitle: z.string().optional(),
  selectedEntityType: z.string().optional(),
})

const RequestSchema = z.object({
  events: z.array(SearchEventSchema).min(1).max(100),
})

// =============================================================================
// HANDLER
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { events } = RequestSchema.parse(body)

    // Log events (replace with database insert in production)
    for (const event of events) {
      console.log('[ANALYTICS]', JSON.stringify(event))
    }

    // In production, insert to analytics table:
    // await supabase.from('search_analytics').insert(events)

    return NextResponse.json({ success: true, count: events.length })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid event data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('[ANALYTICS] Failed to process events:', error)
    return NextResponse.json(
      { error: 'Failed to process events' },
      { status: 500 }
    )
  }
}
