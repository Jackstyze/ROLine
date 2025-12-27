# ROLine - Unified Coupon System Architecture

> Architecture centralisée pour coupons multi-contextes (produits, événements, services, accès premium)

## Phases d'Implémentation

| Phase | Scope | Priorité |
|-------|-------|----------|
| **Phase 1 (MVP)** | Coupons produits + événements | 🔴 Actuel |
| **Phase 2** | Services (livraison/covoiturage) | 🟡 Post-launch |
| **Phase 3** | Accès premium IA | 🟢 Scale |

---

## Schéma Base de Données

### 1. Table `coupons` - Entité centrale

```sql
CREATE TABLE coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID REFERENCES profiles(id), -- null si admin RO Line

  -- Identification
  code VARCHAR(50) UNIQUE, -- "ETUDIANT20" ou null (auto-apply)
  title VARCHAR(255) NOT NULL,
  title_ar VARCHAR(255),
  description TEXT,

  -- Type de réduction
  discount_type VARCHAR(20) NOT NULL CHECK (
    discount_type IN ('percentage', 'fixed_amount', 'free_shipping', 'access_unlock')
  ),
  discount_value DECIMAL(10,2), -- 20 pour 20%, ou 500 pour 500 DA

  -- Applicabilité MULTI-CONTEXTE
  applies_to VARCHAR(20) NOT NULL CHECK (
    applies_to IN ('products', 'events', 'premium_access', 'delivery', 'ride_share', 'all')
  ),

  -- Ciblage audience
  target_audience VARCHAR(20) DEFAULT 'all' CHECK (
    target_audience IN ('all', 'students', 'graduates', 'merchants', 'specific_users')
  ),

  -- Limites temporelles
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,

  -- Limites quantitatives
  max_total_uses INTEGER,
  max_uses_per_user INTEGER DEFAULT 1,
  current_uses INTEGER DEFAULT 0,

  -- Conditions d'application
  min_purchase_amount DECIMAL(10,2),

  is_active BOOLEAN DEFAULT true,
  is_public BOOLEAN DEFAULT true, -- false = code privé (influenceur)

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour recherche rapide
CREATE INDEX idx_coupons_code ON coupons(code) WHERE code IS NOT NULL;
CREATE INDEX idx_coupons_merchant ON coupons(merchant_id);
CREATE INDEX idx_coupons_active ON coupons(is_active, start_date, end_date);
```

### 2. Table `coupon_rules` - Règles granulaires

```sql
CREATE TABLE coupon_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,

  -- Type de règle
  rule_type VARCHAR(20) NOT NULL CHECK (
    rule_type IN ('category', 'specific_products', 'specific_events', 'wilaya', 'merchant')
  ),

  -- Valeurs (polymorphique)
  target_ids JSONB, -- ["uuid1", "uuid2"] pour produits/événements
  target_wilayas JSONB, -- [35, 16] pour Boumerdes, Alger

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_coupon_rules_coupon ON coupon_rules(coupon_id);
```

### 3. Table `coupon_usages` - Tracking

```sql
CREATE TABLE coupon_usages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID NOT NULL REFERENCES coupons(id),
  user_id UUID NOT NULL REFERENCES profiles(id),

  -- Contexte d'utilisation
  used_on VARCHAR(20) NOT NULL CHECK (
    used_on IN ('product', 'event', 'service')
  ),
  target_id UUID, -- ID du produit/événement/service

  discount_amount DECIMAL(10,2) NOT NULL,
  used_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_coupon_usages_coupon ON coupon_usages(coupon_id);
CREATE INDEX idx_coupon_usages_user ON coupon_usages(user_id);
CREATE UNIQUE INDEX idx_coupon_usages_unique ON coupon_usages(coupon_id, user_id, target_id);
```

### 4. Table `premium_access` - Accès déblocables (Phase 3)

```sql
CREATE TABLE premium_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),

  access_type VARCHAR(30) NOT NULL CHECK (
    access_type IN ('ai_unlimited', 'priority_delivery', 'vip_events')
  ),
  granted_by_coupon UUID REFERENCES coupons(id),

  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_premium_access_user ON premium_access(user_id, access_type);
CREATE INDEX idx_premium_access_expires ON premium_access(expires_at);
```

---

## Structure Feature

```
features/
└── coupons/
    ├── actions/
    │   ├── coupons.actions.ts      # CRUD coupons
    │   ├── validate.actions.ts     # Validation & application
    │   └── usage.actions.ts        # Tracking utilisations
    ├── components/
    │   ├── CouponForm.tsx          # Formulaire création/édition
    │   ├── CouponList.tsx          # Liste merchant dashboard
    │   ├── CouponInput.tsx         # Input code panier
    │   ├── AppliedCoupon.tsx       # Badge coupon appliqué
    │   └── CouponStats.tsx         # Statistiques utilisation
    ├── schemas/
    │   └── coupon.schema.ts        # Validation Zod
    ├── lib/
    │   └── validator.ts            # Logique validation centralisée
    └── types/
        └── coupon.types.ts
```

---

## Schémas Zod

```typescript
// features/coupons/schemas/coupon.schema.ts
import { z } from 'zod'

export const DiscountTypeSchema = z.enum([
  'percentage',
  'fixed_amount',
  'free_shipping',
  'access_unlock'
])

export const AppliesToSchema = z.enum([
  'products',
  'events',
  'premium_access',
  'delivery',
  'ride_share',
  'all'
])

export const TargetAudienceSchema = z.enum([
  'all',
  'students',
  'graduates',
  'merchants',
  'specific_users'
])

export const CouponCreateSchema = z.object({
  code: z.string().min(3).max(50).toUpperCase().optional(),
  title: z.string().min(3).max(255),
  titleAr: z.string().max(255).optional(),
  description: z.string().optional(),

  discountType: DiscountTypeSchema,
  discountValue: z.number().min(0).max(100000).optional(),

  appliesTo: AppliesToSchema,
  targetAudience: TargetAudienceSchema.default('all'),

  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),

  maxTotalUses: z.number().int().positive().optional(),
  maxUsesPerUser: z.number().int().positive().default(1),

  minPurchaseAmount: z.number().min(0).optional(),

  isActive: z.boolean().default(true),
  isPublic: z.boolean().default(true),
}).refine(
  data => !data.endDate || !data.startDate || data.endDate > data.startDate,
  { message: "Date de fin doit être après date de début" }
)

export const CouponRuleSchema = z.object({
  ruleType: z.enum(['category', 'specific_products', 'specific_events', 'wilaya', 'merchant']),
  targetIds: z.array(z.string().uuid()).optional(),
  targetWilayas: z.array(z.number().int().min(1).max(58)).optional(),
})

export const ValidateCouponSchema = z.object({
  code: z.string().min(1),
  context: z.object({
    type: z.enum(['product', 'event', 'service']),
    targetId: z.string().uuid(),
    amount: z.number().optional(),
    wilaya: z.number().int().min(1).max(58).optional(),
  })
})
```

---

## Logique de Validation

```typescript
// features/coupons/lib/validator.ts
'use server'

import { createSupabaseServer } from '@/shared/lib/supabase/server'

export type CouponContext = {
  type: 'product' | 'event' | 'service'
  targetId: string
  amount?: number
  wilaya?: number
}

export type ValidationResult = {
  valid: boolean
  couponId: string
  discountAmount: number
  discountType: string
  message?: string
}

export async function validateCoupon(
  code: string,
  userId: string,
  context: CouponContext
): Promise<ValidationResult> {
  const supabase = await createSupabaseServer()

  // 1. Récupérer coupon
  const { data: coupon, error } = await supabase
    .from('coupons')
    .select('*, coupon_rules(*)')
    .eq('code', code.toUpperCase())
    .eq('is_active', true)
    .single()

  if (error || !coupon) {
    throw new Error("Code invalide")
  }

  const now = new Date()

  // 2. Vérifier dates
  if (coupon.start_date && now < new Date(coupon.start_date)) {
    throw new Error("Code pas encore actif")
  }
  if (coupon.end_date && now > new Date(coupon.end_date)) {
    throw new Error("Code expiré")
  }

  // 3. Vérifier limite globale
  if (coupon.max_total_uses && coupon.current_uses >= coupon.max_total_uses) {
    throw new Error("Code épuisé")
  }

  // 4. Vérifier limite par utilisateur
  const { count } = await supabase
    .from('coupon_usages')
    .select('*', { count: 'exact', head: true })
    .eq('coupon_id', coupon.id)
    .eq('user_id', userId)

  if (coupon.max_uses_per_user && (count || 0) >= coupon.max_uses_per_user) {
    throw new Error("Vous avez déjà utilisé ce code")
  }

  // 5. Vérifier contexte d'application
  const contextMap = {
    product: 'products',
    event: 'events',
    service: 'delivery'
  }
  if (coupon.applies_to !== 'all' && coupon.applies_to !== contextMap[context.type]) {
    throw new Error("Code non applicable à ce type d'achat")
  }

  // 6. Vérifier règles spécifiques
  if (coupon.coupon_rules?.length > 0) {
    const isEligible = coupon.coupon_rules.some((rule: any) => {
      if (rule.rule_type === 'wilaya' && context.wilaya) {
        return rule.target_wilayas?.includes(context.wilaya)
      }
      if (rule.rule_type === 'specific_products' || rule.rule_type === 'specific_events') {
        return rule.target_ids?.includes(context.targetId)
      }
      if (rule.rule_type === 'category') {
        // TODO: Vérifier catégorie du produit
        return true
      }
      return true
    })

    if (!isEligible) {
      throw new Error("Code non applicable à cet article")
    }
  }

  // 7. Vérifier montant minimum
  if (coupon.min_purchase_amount && context.amount && context.amount < coupon.min_purchase_amount) {
    throw new Error(`Montant minimum requis: ${coupon.min_purchase_amount} DA`)
  }

  // 8. Calculer la réduction
  let discountAmount = 0
  if (coupon.discount_type === 'percentage' && context.amount) {
    discountAmount = (context.amount * Number(coupon.discount_value)) / 100
  } else if (coupon.discount_type === 'fixed_amount') {
    discountAmount = Math.min(Number(coupon.discount_value), context.amount || 0)
  } else if (coupon.discount_type === 'free_shipping') {
    discountAmount = context.amount || 0 // Livraison gratuite
  }

  return {
    valid: true,
    couponId: coupon.id,
    discountAmount,
    discountType: coupon.discount_type
  }
}

export async function applyCoupon(
  couponId: string,
  userId: string,
  context: CouponContext,
  discountAmount: number
) {
  const supabase = await createSupabaseServer()

  // Enregistrer l'utilisation
  await supabase.from('coupon_usages').insert({
    coupon_id: couponId,
    user_id: userId,
    used_on: context.type,
    target_id: context.targetId,
    discount_amount: discountAmount
  })

  // Incrémenter le compteur
  await supabase.rpc('increment_coupon_usage', { coupon_id: couponId })
}
```

---

## Exemples d'Utilisation

### Cas 1: Coupon produit marketplace
```typescript
{
  code: "PIZZA15",
  title: "15% sur toutes les pizzas",
  discountType: "percentage",
  discountValue: 15,
  appliesTo: "products",
  rules: [{ ruleType: "category", targetIds: ["cat_restaurant"] }],
  targetAudience: "students"
}
```

### Cas 2: Accès événement VIP
```typescript
{
  code: "VIP_TECH_TALK",
  title: "Accès VIP Tech Talk UMBB",
  discountType: "access_unlock",
  appliesTo: "events",
  rules: [{ ruleType: "specific_events", targetIds: ["event_123"] }],
  maxTotalUses: 50,
  targetAudience: "all"
}
```

### Cas 3: Livraison gratuite (auto-apply)
```typescript
{
  code: null, // Auto-apply pour nouveaux clients
  title: "Première livraison offerte",
  discountType: "free_shipping",
  appliesTo: "delivery",
  rules: [{ ruleType: "wilaya", targetWilayas: [35] }],
  maxUsesPerUser: 1
}
```

### Cas 4: Promo multi-contexte Ramadan
```typescript
{
  code: "RAMADAN2025",
  title: "Promo Ramadan sur tout RO Line",
  discountType: "percentage",
  discountValue: 20,
  appliesTo: "all",
  targetAudience: "all",
  startDate: "2025-03-01",
  endDate: "2025-04-01"
}
```

---

## UI Merchant Dashboard

```
┌───────────────────────────────────────────────────────────┐
│ Mes Coupons & Promotions              [+ Créer coupon]   │
├───────────────────────────────────────────────────────────┤
│ Filtres: [Tous] [Produits] [Événements] [Services]       │
├───────────────────────────────────────────────────────────┤
│                                                           │
│ 🎓 ETUDIANT20                                            │
│    -20% | Tous les produits | Étudiants                  │
│    ✅ Actif · 47/1000 utilisations · Expire: 31/01/2025  │
│    [Modifier] [Désactiver] [Stats]                       │
│                                                           │
│ 🚚 LIVRAISON_GRATUITE (Auto-apply)                       │
│    Livraison offerte | Nouveaux clients | Boumerdes      │
│    ✅ Actif · 89 utilisations · Sans limite              │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

---

## Migration SQL

```sql
-- migrations/004_coupon_system.sql

-- Fonction pour incrémenter usage
CREATE OR REPLACE FUNCTION increment_coupon_usage(coupon_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE coupons
  SET current_uses = current_uses + 1,
      updated_at = NOW()
  WHERE id = coupon_id;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_usages ENABLE ROW LEVEL SECURITY;

-- Merchants can manage their own coupons
CREATE POLICY "Merchants manage own coupons" ON coupons
  FOR ALL USING (auth.uid() = merchant_id);

-- Public coupons visible to all
CREATE POLICY "Public coupons visible" ON coupons
  FOR SELECT USING (is_public = true AND is_active = true);

-- Users can see their own usage
CREATE POLICY "Users see own usage" ON coupon_usages
  FOR SELECT USING (auth.uid() = user_id);
```
