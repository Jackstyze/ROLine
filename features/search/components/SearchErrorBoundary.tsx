'use client'

/**
 * Search Error Boundary
 * Catches errors in search components and displays fallback UI
 *
 * ARCHITECTURE:
 * - Class component (required for error boundaries)
 * - Graceful degradation to basic search
 * - Error reporting capability
 */

import { Component, type ReactNode } from 'react'
import { AlertTriangleIcon, RefreshCwIcon, SearchIcon } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'

// =============================================================================
// TYPES
// =============================================================================

type Props = {
  children: ReactNode
  /** Fallback UI when error occurs */
  fallback?: ReactNode
  /** Called when error is caught */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

type State = {
  hasError: boolean
  error: Error | null
}

// =============================================================================
// COMPONENT
// =============================================================================

export class SearchErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log error
    console.error('[SEARCH_ERROR]', error, errorInfo)

    // Call error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null })
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default fallback UI
      return (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-6">
          <div className="flex items-start gap-3">
            <AlertTriangleIcon className="size-5 text-destructive shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-medium text-destructive">
                Erreur de recherche
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Une erreur s&apos;est produite lors de la recherche.
                Veuillez réessayer.
              </p>
              {this.state.error && (
                <p className="text-xs text-muted-foreground/60 mt-2 font-mono">
                  {this.state.error.message}
                </p>
              )}
              <div className="flex gap-2 mt-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={this.handleRetry}
                  className="gap-1"
                >
                  <RefreshCwIcon className="size-3" />
                  Réessayer
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  asChild
                >
                  <a href="/marketplace">
                    <SearchIcon className="size-3 me-1" />
                    Recherche classique
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// =============================================================================
// HOC FOR FUNCTIONAL COMPONENTS
// =============================================================================

/**
 * Wrap a component with SearchErrorBoundary
 */
export function withSearchErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options?: Omit<Props, 'children'>
): React.FC<P> {
  const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component'

  const ComponentWithErrorBoundary: React.FC<P> = (props) => (
    <SearchErrorBoundary {...options}>
      <WrappedComponent {...props} />
    </SearchErrorBoundary>
  )

  ComponentWithErrorBoundary.displayName = `withSearchErrorBoundary(${displayName})`

  return ComponentWithErrorBoundary
}
