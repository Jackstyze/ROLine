/**
 * Login Page
 */

import { LoginForm } from '@/features/auth/components/LoginForm'

export const metadata = {
  title: 'Connexion | RO Line',
  description: 'Connectez-vous à votre compte RO Line',
}

export default function LoginPage() {
  return (
    <>
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Connexion
        </h1>
        <p className="mt-2 text-gray-600">
          Accédez à votre compte RO Line
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <LoginForm />
      </div>
    </>
  )
}
