'use client'

/**
 * Login Form Component
 *
 * Uses Server Actions for form submission
 * Progressive enhancement: works without JavaScript
 */

import { useActionState } from 'react'
import { signIn } from '../actions/auth.actions'
import Link from 'next/link'

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(signIn, null)

  // Extract field errors for easier access
  const fieldErrors = state?.success === false ? state.fieldErrors : undefined

  return (
    <form action={formAction} className="space-y-6">
      {/* Global error message */}
      {state?.success === false && !fieldErrors && (
        <div
          className="rounded-md bg-red-50 p-4 text-sm text-red-700"
          role="alert"
        >
          {state.error}
        </div>
      )}

      {/* Email field */}
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700"
        >
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          aria-describedby={fieldErrors?.email ? 'email-error' : undefined}
        />
        {fieldErrors?.email && (
          <p id="email-error" className="mt-1 text-sm text-red-600">
            {fieldErrors.email[0]}
          </p>
        )}
      </div>

      {/* Password field */}
      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-700"
        >
          Mot de passe
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          aria-describedby={fieldErrors?.password ? 'password-error' : undefined}
        />
        {fieldErrors?.password && (
          <p id="password-error" className="mt-1 text-sm text-red-600">
            {fieldErrors.password[0]}
          </p>
        )}
      </div>

      {/* Forgot password link */}
      <div className="flex items-center justify-end">
        <Link
          href="/forgot-password"
          className="text-sm text-blue-600 hover:text-blue-500"
        >
          Mot de passe oublié ?
        </Link>
      </div>

      {/* Submit button */}
      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-md bg-blue-600 px-4 py-2 text-white font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? 'Connexion...' : 'Se connecter'}
      </button>

      {/* Register link */}
      <p className="text-center text-sm text-gray-600">
        Pas encore de compte ?{' '}
        <Link
          href="/register"
          className="text-blue-600 hover:text-blue-500 font-medium"
        >
          Créer un compte
        </Link>
      </p>
    </form>
  )
}
