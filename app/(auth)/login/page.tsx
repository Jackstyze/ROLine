/**
 * Login Page - v0.1
 */

import { LoginForm } from '@/features/auth/components/LoginForm'
import { Badge } from '@/shared/components/ui/badge'
import { Sparkles } from 'lucide-react'

export const metadata = {
  title: 'Connexion | RO Line',
  description: 'Connectez-vous à votre compte RO Line',
}

export default function LoginPage() {
  return (
    <>
      <div className="text-center mb-8">
        <Badge className="mb-4 bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100">
          <Sparkles className="w-3 h-3 mr-1" />
          Bienvenue
        </Badge>
        <h1 className="text-3xl font-bold text-foreground">
          Connexion
        </h1>
        <p className="mt-2 text-muted-foreground">
          Accédez à votre compte RO Line
        </p>
      </div>

      <div className="glass rounded-2xl p-8">
        <LoginForm />
      </div>
    </>
  )
}
