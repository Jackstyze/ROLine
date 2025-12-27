/**
 * Register Page - v0.1
 */

import { RegisterForm } from '@/features/auth/components/RegisterForm'
import { Badge } from '@/shared/components/ui/badge'
import { Users } from 'lucide-react'

export const metadata = {
  title: 'Inscription | RO Line',
  description: 'Créez votre compte RO Line',
}

export default function RegisterPage() {
  return (
    <>
      <div className="text-center mb-8">
        <Badge className="mb-4 bg-red-100 text-red-700 border-red-200 hover:bg-red-100">
          <Users className="w-3 h-3 mr-1" />
          Rejoins-nous
        </Badge>
        <h1 className="text-3xl font-bold text-foreground">
          Créer un compte
        </h1>
        <p className="mt-2 text-muted-foreground">
          Rejoignez la communauté RO Line
        </p>
      </div>

      <div className="glass rounded-2xl p-8">
        <RegisterForm />
      </div>
    </>
  )
}
