/**
 * Register Page
 */

import { RegisterForm } from '@/features/auth/components/RegisterForm'

export const metadata = {
  title: 'Inscription | RO Line',
  description: 'Créez votre compte RO Line',
}

export default function RegisterPage() {
  return (
    <>
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Créer un compte
        </h1>
        <p className="mt-2 text-gray-600">
          Rejoignez la communauté RO Line
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <RegisterForm />
      </div>
    </>
  )
}
