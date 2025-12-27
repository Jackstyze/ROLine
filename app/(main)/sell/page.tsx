/**
 * Sell Page - Create or Edit product
 */

import { redirect } from 'next/navigation'
import { getCurrentUser, hasRole } from '@/features/auth/actions/auth.actions'
import { ProductForm } from '@/features/marketplace/components/ProductForm'
import { getProduct } from '@/features/marketplace/actions/products.actions'
import Link from 'next/link'

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const { edit } = await searchParams
  return {
    title: edit ? 'Modifier le produit | RO Line' : 'Vendre | RO Line',
    description: edit ? 'Modifiez votre produit' : 'Publiez votre produit sur RO Line',
  }
}

export default async function SellPage({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const { edit: editId } = await searchParams
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login?redirect=/sell')
  }

  const canSell = await hasRole('merchant')

  // Fetch product if editing
  let product = null
  if (editId) {
    product = await getProduct(editId)
    // Verify ownership
    if (!product || product.merchant_id !== user.id) {
      redirect('/dashboard')
    }
  }

  // If not a merchant, show upgrade prompt
  if (!canSell) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <span className="text-5xl mb-4 block">🏪</span>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Devenir Marchand
          </h1>
          <p className="text-gray-600 mb-6">
            Pour vendre sur RO Line, vous devez avoir un compte marchand.
            <br />
            Votre compte actuel est de type <strong>étudiant</strong>.
          </p>
          <div className="space-y-3">
            <Link
              href="/profile/upgrade"
              className="block w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
            >
              Passer au compte Marchand
            </Link>
            <Link
              href="/dashboard"
              className="block w-full py-3 px-4 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
            >
              Retour au tableau de bord
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          {product ? 'Modifier le produit' : 'Publier un produit'}
        </h1>
        <p className="text-gray-600">
          {product ? 'Modifiez les informations de votre produit' : 'Remplissez les informations de votre produit'}
        </p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <ProductForm product={product} />
      </div>
    </div>
  )
}
