# RO Line - Guide de Configuration

## 1. Supabase Setup

### Créer un projet Supabase
1. Aller sur [supabase.com](https://supabase.com)
2. Créer un nouveau projet
3. Noter les credentials:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **Anon Key**: Trouvé dans Settings > API
   - **Service Role Key**: Trouvé dans Settings > API (GARDER SECRET)

### Exécuter les migrations

Dans le SQL Editor de Supabase, exécuter dans l'ordre:

```bash
# 1. Schema initial
supabase/migrations/001_initial_schema.sql

# 2. Fonctions atomiques pour orders
supabase/migrations/002_atomic_order.sql

# 3. Données initiales (wilayas, catégories)
supabase/seed.sql
```

### Configurer Storage

1. Aller dans Storage > Create bucket
2. Créer un bucket `images` avec:
   - Public: **OFF** (on utilise signed URLs)
   - File size limit: **5MB**
   - Allowed mime types: `image/jpeg, image/png, image/webp, image/gif`

### Politiques Storage

```sql
-- Permettre upload aux marchands authentifiés
CREATE POLICY "Merchants can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'images' AND
  (storage.foldername(name))[1] = 'products'
);

-- Permettre lecture publique
CREATE POLICY "Public can view images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'images');

-- Permettre suppression par propriétaire
CREATE POLICY "Users can delete own images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'images' AND
  auth.uid()::text = (storage.foldername(name))[2]
);
```

## 2. Configuration Environnement

Créer `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Site
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Chargily Pay (voir section 3)
CHARGILY_API_KEY=your-api-key
CHARGILY_SECRET_KEY=your-secret-key
CHARGILY_MODE=test
```

## 3. Chargily Pay Setup

### Créer un compte test
1. Aller sur [pay.chargily.com](https://pay.chargily.com)
2. S'inscrire et activer le mode test
3. Dans le Dashboard > Developers:
   - **API Key**: Clé pour créer des checkouts
   - **Secret Key**: Clé pour vérifier les webhooks

### Configurer le webhook
1. Dans Chargily Dashboard > Developers > Webhooks
2. Ajouter URL: `https://your-domain.com/api/webhooks/chargily`
3. Pour tests locaux, utiliser [ngrok](https://ngrok.com):
   ```bash
   ngrok http 3000
   # Copier l'URL https://xxxx.ngrok.io/api/webhooks/chargily
   ```

### Cartes de test
| Type | Numéro | Expiration | CVV |
|------|--------|------------|-----|
| EDAHABIA | 0000 0000 0000 0000 | 12/25 | 123 |
| CIB | 4242 4242 4242 4242 | 12/25 | 123 |

## 4. Lancer le projet

```bash
cd roline-v0

# Installer dépendances
npm install

# Vérifier l'environnement
npm run check:env

# Lancer en développement
npm run dev

# Ouvrir http://localhost:3000
```

### Scripts utilitaires

| Commande | Description |
|----------|-------------|
| `npm run check:env` | Vérifie variables d'env et connexion Supabase |
| `npm run test:webhook` | Simule un webhook Chargily |
| `npm run test:webhook [orderId]` | Teste webhook avec orderId spécifique |

## 5. Tester le flux complet

### Scénario 1: Inscription Marchand
1. `/register` - Créer compte marchand
2. Vérifier email (Supabase envoie email)
3. `/login` - Se connecter

### Scénario 2: Créer un produit
1. `/sell` - Formulaire création produit
2. Uploader images (ou coller URLs)
3. Publier

### Scénario 3: Acheter avec paiement
1. Se déconnecter, créer compte étudiant
2. `/marketplace` - Trouver le produit
3. `/marketplace/[id]` - Commander
4. Choisir paiement EDAHABIA
5. Redirection Chargily → Payer
6. Webhook reçu → Order marqué "paid"

### Scénario 4: Livraison
1. Vendeur: `/orders` → Marquer expédié
2. Acheteur: `/orders/[id]` → Confirmer réception
3. Produit passe en statut "sold"

## 6. Vérifications

### Base de données
```sql
-- Vérifier les tables
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public';

-- Vérifier les fonctions RPC
SELECT proname FROM pg_proc
WHERE pronamespace = 'public'::regnamespace;
```

### Logs webhook
Les webhooks Chargily sont loggés dans la console Next.js.
Pour debug: `console.log` dans `/app/api/webhooks/chargily/route.ts`

## Troubleshooting

### "RLS policy violation"
→ Vérifier que les policies sont bien créées dans Supabase

### "Invalid signature" sur webhook
→ Vérifier que `CHARGILY_SECRET_KEY` correspond à la clé dans le dashboard

### Images ne s'uploadent pas
→ Vérifier le bucket Storage et les policies

### Erreur "Product not available"
→ Le produit est déjà réservé ou vendu (race condition protégée)
