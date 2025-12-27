'use client'

import { useState, useEffect } from 'react'
import { ShoppingCart } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { getCartCount } from '@/features/cart/actions/cart.actions'

export function CartButton() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    loadCount()
  }, [])

  async function loadCount() {
    const cartCount = await getCartCount()
    setCount(cartCount)
  }

  return (
    <Button variant="ghost" size="icon" className="relative" asChild>
      <Link href="/cart">
        <ShoppingCart className="h-5 w-5" />
        {count > 0 && (
          <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-green-600 text-white text-xs">
            {count > 9 ? '9+' : count}
          </Badge>
        )}
      </Link>
    </Button>
  )
}
