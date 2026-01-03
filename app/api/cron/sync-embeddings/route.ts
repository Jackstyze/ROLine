/**
 * Cron API Route: Sync Embeddings
 * Triggered by cron job to populate missing entity embeddings
 *
 * SETUP:
 * - Add to vercel.json or cron config:
 *   { "path": "/api/cron/sync-embeddings", "schedule": "0 * * * *" }
 * - Or trigger manually via: curl -X POST /api/cron/sync-embeddings
 *
 * SECURITY:
 * - Requires CRON_SECRET header for external triggers
 * - Skipped in development if secret not set
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  syncPendingEmbeddings,
  getSyncStatus,
} from '@/features/search/services/embedding-sync.service'

// =============================================================================
// CONFIG
// =============================================================================

const CRON_SECRET = process.env.CRON_SECRET

// =============================================================================
// HANDLERS
// =============================================================================

/**
 * POST: Trigger embedding sync
 */
export async function POST(request: NextRequest) {
  // Verify authorization in production
  if (process.env.NODE_ENV === 'production' && CRON_SECRET) {
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
  }

  try {
    // Get initial status
    const beforeStatus = await getSyncStatus()

    // Run sync
    const result = await syncPendingEmbeddings(100) // Process up to 100 per run

    // Get final status
    const afterStatus = await getSyncStatus()

    return NextResponse.json({
      success: true,
      result,
      status: {
        before: beforeStatus,
        after: afterStatus,
      },
    })
  } catch (error) {
    console.error('[CRON] Embedding sync failed:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * GET: Get sync status (for monitoring)
 */
export async function GET(request: NextRequest) {
  // Optional auth check for status
  const authHeader = request.headers.get('authorization')
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    // Allow unauthenticated status in development
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
  }

  try {
    const status = await getSyncStatus()

    return NextResponse.json({
      success: true,
      status,
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
