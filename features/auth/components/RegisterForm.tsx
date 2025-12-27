'use client'

/**
 * Registration Form Component
 *
 * Features:
 * - Multi-step validation with Zod
 * - Wilaya selection from 69 wilayas
 * - Role selection (student/merchant)
 * - Progressive enhancement
 */

import { useActionState, useState } from 'react'
import { signUp } from '../actions/auth.actions'
import Link from 'next/link'
import wilayas from '@/data/wilayas.json'

type UserRole = 'student' | 'merchant'

export function RegisterForm() {
  const [state, formAction, isPending] = useActionState(signUp, null)
  const [selectedRole, setSelectedRole] = useState<UserRole>('student')

  // Success state - show confirmation message
  if (state?.success) {
    return (
      <div className="rounded-md bg-green-50 p-6 text-center">
        <h3 className="text-lg font-medium text-green-800">
          Inscription réussie !
        </h3>
        <p className="mt-2 text-sm text-green-700">
          Un email de confirmation a été envoyé à votre adresse.
          <br />
          Veuillez cliquer sur le lien pour activer votre compte.
        </p>
        <Link
          href="/login"
          className="mt-4 inline-block text-sm text-green-600 hover:text-green-500"
        >
          Retour à la connexion
        </Link>
      </div>
    )
  }

  return (
    <form action={formAction} className="space-y-6">
      {/* Global error message */}
      {state?.success === false && !state.fieldErrors && (
        <div
          className="rounded-md bg-red-50 p-4 text-sm text-red-700"
          role="alert"
        >
          {state.error}
        </div>
      )}

      {/* Full Name */}
      <div>
        <label
          htmlFor="fullName"
          className="block text-sm font-medium text-gray-700"
        >
          Nom complet
        </label>
        <input
          id="fullName"
          name="fullName"
          type="text"
          autoComplete="name"
          required
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        {state?.fieldErrors?.fullName && (
          <p className="mt-1 text-sm text-red-600">
            {state.fieldErrors.fullName[0]}
          </p>
        )}
      </div>

      {/* Email */}
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
        />
        {state?.fieldErrors?.email && (
          <p className="mt-1 text-sm text-red-600">
            {state.fieldErrors.email[0]}
          </p>
        )}
      </div>

      {/* Password */}
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
          autoComplete="new-password"
          required
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <p className="mt-1 text-xs text-gray-500">
          Min. 8 caractères avec majuscule, minuscule et chiffre
        </p>
        {state?.fieldErrors?.password && (
          <p className="mt-1 text-sm text-red-600">
            {state.fieldErrors.password[0]}
          </p>
        )}
      </div>

      {/* Confirm Password */}
      <div>
        <label
          htmlFor="confirmPassword"
          className="block text-sm font-medium text-gray-700"
        >
          Confirmer le mot de passe
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        {state?.fieldErrors?.confirmPassword && (
          <p className="mt-1 text-sm text-red-600">
            {state.fieldErrors.confirmPassword[0]}
          </p>
        )}
      </div>

      {/* Role Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Je suis
        </label>
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setSelectedRole('student')}
            className={`p-4 rounded-lg border-2 text-center transition-colors ${
              selectedRole === 'student'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <span className="block text-2xl mb-1">🎓</span>
            <span className="font-medium">Étudiant</span>
            <span className="block text-xs text-gray-500">
              Acheter et profiter des promos
            </span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedRole('merchant')}
            className={`p-4 rounded-lg border-2 text-center transition-colors ${
              selectedRole === 'merchant'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <span className="block text-2xl mb-1">🏪</span>
            <span className="font-medium">Marchand</span>
            <span className="block text-xs text-gray-500">
              Vendre mes produits
            </span>
          </button>
        </div>
        <input type="hidden" name="role" value={selectedRole} />
        {state?.fieldErrors?.role && (
          <p className="mt-1 text-sm text-red-600">
            {state.fieldErrors.role[0]}
          </p>
        )}
      </div>

      {/* Date of Birth (required for all) */}
      <div>
        <label
          htmlFor="dateOfBirth"
          className="block text-sm font-medium text-gray-700"
        >
          Date de naissance
        </label>
        <input
          id="dateOfBirth"
          name="dateOfBirth"
          type="date"
          required
          max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <p className="mt-1 text-xs text-gray-500">Vous devez avoir au moins 18 ans</p>
        {state?.fieldErrors?.dateOfBirth && (
          <p className="mt-1 text-sm text-red-600">
            {state.fieldErrors.dateOfBirth[0]}
          </p>
        )}
      </div>

      {/* Student-specific fields */}
      {selectedRole === 'student' && (
        <>
          <div>
            <label
              htmlFor="matricule"
              className="block text-sm font-medium text-gray-700"
            >
              Matricule étudiant
            </label>
            <input
              id="matricule"
              name="matricule"
              type="text"
              required
              placeholder="Ex: 201912345"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {state?.fieldErrors?.matricule && (
              <p className="mt-1 text-sm text-red-600">
                {state.fieldErrors.matricule[0]}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="bacNumber"
              className="block text-sm font-medium text-gray-700"
            >
              Numéro du BAC
            </label>
            <input
              id="bacNumber"
              name="bacNumber"
              type="text"
              required
              placeholder="Ex: 2019123456"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {state?.fieldErrors?.bacNumber && (
              <p className="mt-1 text-sm text-red-600">
                {state.fieldErrors.bacNumber[0]}
              </p>
            )}
          </div>
        </>
      )}

      {/* Merchant-specific fields */}
      {selectedRole === 'merchant' && (
        <>
          <div>
            <label
              htmlFor="commerceRegister"
              className="block text-sm font-medium text-gray-700"
            >
              Numéro registre de commerce
            </label>
            <input
              id="commerceRegister"
              name="commerceRegister"
              type="text"
              required
              placeholder="Ex: 16/00-0123456B99"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {state?.fieldErrors?.commerceRegister && (
              <p className="mt-1 text-sm text-red-600">
                {state.fieldErrors.commerceRegister[0]}
              </p>
            )}
          </div>

          {/* Document upload - disabled for MVP */}
          <div className="opacity-50 pointer-events-none">
            <label
              htmlFor="commerceRegisterDocument"
              className="block text-sm font-medium text-gray-700"
            >
              Document registre de commerce (scan)
            </label>
            <input
              id="commerceRegisterDocument"
              name="commerceRegisterDocument"
              type="file"
              accept="image/*,.pdf"
              disabled
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm text-gray-400"
            />
            <p className="mt-1 text-xs text-gray-400">
              Fonctionnalité bientôt disponible
            </p>
          </div>
        </>
      )}

      {/* Wilaya Selection */}
      <div>
        <label
          htmlFor="wilayaId"
          className="block text-sm font-medium text-gray-700"
        >
          Wilaya
        </label>
        <select
          id="wilayaId"
          name="wilayaId"
          required
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">Sélectionner une wilaya</option>
          {wilayas.map((wilaya) => (
            <option key={wilaya.id} value={wilaya.id}>
              {wilaya.id}. {wilaya.name} - {wilaya.name_ar}
            </option>
          ))}
        </select>
        {state?.fieldErrors?.wilayaId && (
          <p className="mt-1 text-sm text-red-600">
            {state.fieldErrors.wilayaId[0]}
          </p>
        )}
      </div>

      {/* Submit button */}
      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-md bg-blue-600 px-4 py-2 text-white font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? 'Inscription...' : "S'inscrire"}
      </button>

      {/* Login link */}
      <p className="text-center text-sm text-gray-600">
        Déjà un compte ?{' '}
        <Link
          href="/login"
          className="text-blue-600 hover:text-blue-500 font-medium"
        >
          Se connecter
        </Link>
      </p>
    </form>
  )
}
