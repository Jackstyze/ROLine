# Guide de Déploiement - ROLine Search & Recommendations

## Prérequis

- [x] Compte Supabase (projet créé)
- [x] Compte Cohere (API key gratuite)
- [x] Compte Railway (pour ML service)
- [x] Compte Vercel (pour Next.js)

---

## 1. Configuration Supabase

### 1.1 Activer les extensions

Dans **Supabase Dashboard > Database > Extensions**, activer :

1. **vector** (pgvector) - Pour la recherche sémantique
2. **pgroonga** - Pour la recherche full-text multilingue
3. **pg_trgm** - Pour la recherche fuzzy

### 1.2 Exécuter les migrations SQL

Dans **Supabase Dashboard > SQL Editor**, exécuter ces scripts dans l'ordre :

#### Migration 1: Extensions

```sql
-- Vérifier que les extensions sont activées
SELECT * FROM pg_extension WHERE extname IN ('vector', 'pgroonga', 'pg_trgm');
```

#### Migration 2: Table entities

```sql
-- Type enum pour les entités
CREATE TYPE entity_type_enum AS ENUM ('product', 'event', 'coupon');

-- Table unifiée pour la recherche cross-entity
CREATE TABLE IF NOT EXISTS entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type entity_type_enum NOT NULL,
  source_id UUID NOT NULL,

  -- Données dénormalisées
  title TEXT NOT NULL,
  title_ar TEXT,
  description TEXT,
  search_text TEXT NOT NULL,

  -- Embedding pour recherche sémantique (Cohere embed-v3 = 1024 dims)
  embedding vector(1024),

  -- Hash pour détecter les changements
  content_hash TEXT,

  -- Filtres
  category_id INTEGER,
  wilaya_id INTEGER,
  merchant_id UUID,
  price DECIMAL(12,2),

  -- Flags
  is_promoted BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Contrainte d'unicité
  CONSTRAINT unique_entity UNIQUE (entity_type, source_id)
);

-- Index IVFFlat pour recherche sémantique (meilleur pour les inserts que HNSW)
CREATE INDEX IF NOT EXISTS idx_entities_embedding
ON entities USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Index PGroonga pour FTS multilingue
CREATE INDEX IF NOT EXISTS idx_entities_search_text
ON entities USING pgroonga (search_text);

-- Index pg_trgm pour fuzzy
CREATE INDEX IF NOT EXISTS idx_entities_title_trgm
ON entities USING gin (title gin_trgm_ops);

-- Index pour les filtres
CREATE INDEX IF NOT EXISTS idx_entities_type ON entities (entity_type);
CREATE INDEX IF NOT EXISTS idx_entities_category ON entities (category_id);
CREATE INDEX IF NOT EXISTS idx_entities_wilaya ON entities (wilaya_id);
CREATE INDEX IF NOT EXISTS idx_entities_active ON entities (is_active);
CREATE INDEX IF NOT EXISTS idx_entities_embedding_null ON entities (id) WHERE embedding IS NULL;
```

#### Migration 3: Triggers de synchronisation

```sql
-- Fonction pour générer le search_text
CREATE OR REPLACE FUNCTION generate_search_text(
  p_title TEXT,
  p_title_ar TEXT,
  p_description TEXT
) RETURNS TEXT AS $$
BEGIN
  RETURN COALESCE(p_title, '') || ' ' ||
         COALESCE(p_title_ar, '') || ' ' ||
         COALESCE(p_description, '');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Fonction pour générer le content_hash
CREATE OR REPLACE FUNCTION generate_content_hash(
  p_title TEXT,
  p_title_ar TEXT,
  p_description TEXT
) RETURNS TEXT AS $$
BEGIN
  RETURN md5(COALESCE(p_title, '') || COALESCE(p_title_ar, '') || COALESCE(p_description, ''));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger pour sync products → entities
CREATE OR REPLACE FUNCTION sync_product_to_entities()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM entities WHERE entity_type = 'product' AND source_id = OLD.id;
    RETURN OLD;
  END IF;

  -- Skip if not active
  IF NEW.status != 'active' THEN
    DELETE FROM entities WHERE entity_type = 'product' AND source_id = NEW.id;
    RETURN NEW;
  END IF;

  INSERT INTO entities (
    entity_type, source_id, title, title_ar, description, search_text, content_hash,
    category_id, wilaya_id, merchant_id, price, is_promoted, is_active
  ) VALUES (
    'product', NEW.id, NEW.title, NEW.title_ar, NEW.description,
    generate_search_text(NEW.title, NEW.title_ar, NEW.description),
    generate_content_hash(NEW.title, NEW.title_ar, NEW.description),
    NEW.category_id, NEW.wilaya_id, NEW.merchant_id, NEW.price,
    COALESCE(NEW.is_promoted, false), true
  )
  ON CONFLICT (entity_type, source_id) DO UPDATE SET
    title = EXCLUDED.title,
    title_ar = EXCLUDED.title_ar,
    description = EXCLUDED.description,
    search_text = EXCLUDED.search_text,
    content_hash = EXCLUDED.content_hash,
    category_id = EXCLUDED.category_id,
    wilaya_id = EXCLUDED.wilaya_id,
    price = EXCLUDED.price,
    is_promoted = EXCLUDED.is_promoted,
    updated_at = now(),
    -- Reset embedding if content changed
    embedding = CASE
      WHEN entities.content_hash != EXCLUDED.content_hash THEN NULL
      ELSE entities.embedding
    END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_sync_product ON products;
CREATE TRIGGER trigger_sync_product
AFTER INSERT OR UPDATE OR DELETE ON products
FOR EACH ROW EXECUTE FUNCTION sync_product_to_entities();

-- Trigger pour sync events → entities
CREATE OR REPLACE FUNCTION sync_event_to_entities()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM entities WHERE entity_type = 'event' AND source_id = OLD.id;
    RETURN OLD;
  END IF;

  IF NEW.status != 'active' THEN
    DELETE FROM entities WHERE entity_type = 'event' AND source_id = NEW.id;
    RETURN NEW;
  END IF;

  INSERT INTO entities (
    entity_type, source_id, title, title_ar, description, search_text, content_hash,
    category_id, wilaya_id, merchant_id, price, is_featured, is_active
  ) VALUES (
    'event', NEW.id, NEW.title, NEW.title_ar, NEW.description,
    generate_search_text(NEW.title, NEW.title_ar, NEW.description),
    generate_content_hash(NEW.title, NEW.title_ar, NEW.description),
    NEW.category_id, NEW.wilaya_id, NEW.organizer_id, NEW.price,
    COALESCE(NEW.is_featured, false), true
  )
  ON CONFLICT (entity_type, source_id) DO UPDATE SET
    title = EXCLUDED.title,
    title_ar = EXCLUDED.title_ar,
    description = EXCLUDED.description,
    search_text = EXCLUDED.search_text,
    content_hash = EXCLUDED.content_hash,
    category_id = EXCLUDED.category_id,
    wilaya_id = EXCLUDED.wilaya_id,
    price = EXCLUDED.price,
    is_featured = EXCLUDED.is_featured,
    updated_at = now(),
    embedding = CASE
      WHEN entities.content_hash != EXCLUDED.content_hash THEN NULL
      ELSE entities.embedding
    END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_sync_event ON events;
CREATE TRIGGER trigger_sync_event
AFTER INSERT OR UPDATE OR DELETE ON events
FOR EACH ROW EXECUTE FUNCTION sync_event_to_entities();

-- Trigger pour sync coupons → entities
CREATE OR REPLACE FUNCTION sync_coupon_to_entities()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM entities WHERE entity_type = 'coupon' AND source_id = OLD.id;
    RETURN OLD;
  END IF;

  IF NEW.status != 'active' THEN
    DELETE FROM entities WHERE entity_type = 'coupon' AND source_id = NEW.id;
    RETURN NEW;
  END IF;

  INSERT INTO entities (
    entity_type, source_id, title, title_ar, description, search_text, content_hash,
    category_id, merchant_id, is_active
  ) VALUES (
    'coupon', NEW.id, NEW.title, NEW.title_ar, NEW.description,
    generate_search_text(NEW.title, NEW.title_ar, NEW.description),
    generate_content_hash(NEW.title, NEW.title_ar, NEW.description),
    NEW.category_id, NEW.merchant_id, true
  )
  ON CONFLICT (entity_type, source_id) DO UPDATE SET
    title = EXCLUDED.title,
    title_ar = EXCLUDED.title_ar,
    description = EXCLUDED.description,
    search_text = EXCLUDED.search_text,
    content_hash = EXCLUDED.content_hash,
    category_id = EXCLUDED.category_id,
    updated_at = now(),
    embedding = CASE
      WHEN entities.content_hash != EXCLUDED.content_hash THEN NULL
      ELSE entities.embedding
    END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_sync_coupon ON coupons;
CREATE TRIGGER trigger_sync_coupon
AFTER INSERT OR UPDATE OR DELETE ON coupons
FOR EACH ROW EXECUTE FUNCTION sync_coupon_to_entities();
```

#### Migration 4: Fonctions RPC

```sql
-- =============================================================================
-- Fonction: hybrid_search
-- Combine FTS + Semantic + Fuzzy avec RRF
-- =============================================================================
CREATE OR REPLACE FUNCTION hybrid_search(
  p_query TEXT,
  p_query_embedding vector(1024) DEFAULT NULL,
  p_entity_types entity_type_enum[] DEFAULT ARRAY['product', 'event', 'coupon']::entity_type_enum[],
  p_category_id INTEGER DEFAULT NULL,
  p_wilaya_id INTEGER DEFAULT NULL,
  p_min_price DECIMAL DEFAULT NULL,
  p_max_price DECIMAL DEFAULT NULL,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0,
  p_fts_weight FLOAT DEFAULT 0.4,
  p_semantic_weight FLOAT DEFAULT 0.4,
  p_fuzzy_weight FLOAT DEFAULT 0.2,
  p_rrf_k INTEGER DEFAULT 60
)
RETURNS TABLE (
  id UUID,
  entity_type entity_type_enum,
  source_id UUID,
  title TEXT,
  title_ar TEXT,
  description TEXT,
  category_id INTEGER,
  wilaya_id INTEGER,
  merchant_id UUID,
  price DECIMAL,
  is_promoted BOOLEAN,
  is_featured BOOLEAN,
  fts_rank FLOAT,
  semantic_score FLOAT,
  fuzzy_score FLOAT,
  final_score FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH
  -- Base filter
  filtered AS (
    SELECT e.*
    FROM entities e
    WHERE e.is_active = true
      AND e.entity_type = ANY(p_entity_types)
      AND (p_category_id IS NULL OR e.category_id = p_category_id)
      AND (p_wilaya_id IS NULL OR e.wilaya_id = p_wilaya_id)
      AND (p_min_price IS NULL OR e.price >= p_min_price)
      AND (p_max_price IS NULL OR e.price <= p_max_price)
  ),

  -- FTS avec PGroonga
  fts_results AS (
    SELECT
      f.id,
      ROW_NUMBER() OVER (ORDER BY pgroonga_score(tableoid, ctid) DESC) AS fts_rank
    FROM filtered f
    WHERE p_query IS NOT NULL
      AND p_query != ''
      AND f.search_text &@~ p_query
  ),

  -- Semantic avec pgvector
  semantic_results AS (
    SELECT
      f.id,
      1 - (f.embedding <=> p_query_embedding) AS semantic_score,
      ROW_NUMBER() OVER (ORDER BY f.embedding <=> p_query_embedding) AS semantic_rank
    FROM filtered f
    WHERE p_query_embedding IS NOT NULL
      AND f.embedding IS NOT NULL
    ORDER BY f.embedding <=> p_query_embedding
    LIMIT 100
  ),

  -- Fuzzy avec pg_trgm
  fuzzy_results AS (
    SELECT
      f.id,
      similarity(f.title, p_query) AS fuzzy_score,
      ROW_NUMBER() OVER (ORDER BY similarity(f.title, p_query) DESC) AS fuzzy_rank
    FROM filtered f
    WHERE p_query IS NOT NULL
      AND p_query != ''
      AND f.title % p_query
  ),

  -- Combiner avec RRF
  combined AS (
    SELECT DISTINCT f.id
    FROM filtered f
    LEFT JOIN fts_results fts ON f.id = fts.id
    LEFT JOIN semantic_results sem ON f.id = sem.id
    LEFT JOIN fuzzy_results fuz ON f.id = fuz.id
    WHERE fts.id IS NOT NULL
       OR sem.id IS NOT NULL
       OR fuz.id IS NOT NULL
       OR (p_query IS NULL OR p_query = '')
  )

  SELECT
    e.id,
    e.entity_type,
    e.source_id,
    e.title,
    e.title_ar,
    e.description,
    e.category_id,
    e.wilaya_id,
    e.merchant_id,
    e.price,
    e.is_promoted,
    e.is_featured,
    COALESCE(fts.fts_rank::FLOAT, 1000) AS fts_rank,
    COALESCE(sem.semantic_score, 0) AS semantic_score,
    COALESCE(fuz.fuzzy_score, 0) AS fuzzy_score,
    -- RRF scoring
    (
      CASE WHEN fts.id IS NOT NULL THEN p_fts_weight / (p_rrf_k + fts.fts_rank) ELSE 0 END +
      CASE WHEN sem.id IS NOT NULL THEN p_semantic_weight / (p_rrf_k + sem.semantic_rank) ELSE 0 END +
      CASE WHEN fuz.id IS NOT NULL THEN p_fuzzy_weight / (p_rrf_k + fuz.fuzzy_rank) ELSE 0 END +
      -- Boost promoted items
      CASE WHEN e.is_promoted THEN 0.01 ELSE 0 END
    ) AS final_score
  FROM filtered e
  LEFT JOIN fts_results fts ON e.id = fts.id
  LEFT JOIN semantic_results sem ON e.id = sem.id
  LEFT JOIN fuzzy_results fuz ON e.id = fuz.id
  WHERE e.id IN (SELECT id FROM combined)
  ORDER BY
    e.is_promoted DESC,
    final_score DESC,
    e.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- =============================================================================
-- Fonction: autocomplete_search
-- Suggestions rapides pour l'input
-- =============================================================================
CREATE OR REPLACE FUNCTION autocomplete_search(
  p_query TEXT,
  p_entity_types entity_type_enum[] DEFAULT ARRAY['product', 'event', 'coupon']::entity_type_enum[],
  p_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
  title TEXT,
  entity_type entity_type_enum
)
LANGUAGE plpgsql
AS $$
BEGIN
  IF p_query IS NULL OR length(p_query) < 2 THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT DISTINCT ON (e.title)
    e.title,
    e.entity_type
  FROM entities e
  WHERE e.is_active = true
    AND e.entity_type = ANY(p_entity_types)
    AND (
      e.title ILIKE p_query || '%'
      OR e.title % p_query
    )
  ORDER BY
    e.title,
    similarity(e.title, p_query) DESC
  LIMIT p_limit;
END;
$$;

-- =============================================================================
-- Fonction: get_entities_pending_embedding
-- Pour le sync batch des embeddings
-- =============================================================================
CREATE OR REPLACE FUNCTION get_entities_pending_embedding(
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  entity_type entity_type_enum,
  search_text TEXT,
  content_hash TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e.entity_type,
    e.search_text,
    e.content_hash
  FROM entities e
  WHERE e.is_active = true
    AND e.embedding IS NULL
  ORDER BY e.created_at DESC
  LIMIT p_limit;
END;
$$;

-- =============================================================================
-- Fonction: update_entity_embedding
-- Mise à jour de l'embedding
-- =============================================================================
CREATE OR REPLACE FUNCTION update_entity_embedding(
  p_entity_id UUID,
  p_embedding vector(1024)
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE entities
  SET
    embedding = p_embedding,
    updated_at = now()
  WHERE id = p_entity_id;

  RETURN FOUND;
END;
$$;
```

#### Migration 5: Backfill des données existantes

```sql
-- Sync les produits existants
INSERT INTO entities (entity_type, source_id, title, title_ar, description, search_text, content_hash, category_id, wilaya_id, merchant_id, price, is_promoted)
SELECT
  'product',
  id,
  title,
  title_ar,
  description,
  generate_search_text(title, title_ar, description),
  generate_content_hash(title, title_ar, description),
  category_id,
  wilaya_id,
  merchant_id,
  price,
  COALESCE(is_promoted, false)
FROM products
WHERE status = 'active'
ON CONFLICT (entity_type, source_id) DO NOTHING;

-- Sync les events existants (si la table existe)
INSERT INTO entities (entity_type, source_id, title, title_ar, description, search_text, content_hash, category_id, wilaya_id, merchant_id, price, is_featured)
SELECT
  'event',
  id,
  title,
  title_ar,
  description,
  generate_search_text(title, title_ar, description),
  generate_content_hash(title, title_ar, description),
  category_id,
  wilaya_id,
  organizer_id,
  price,
  COALESCE(is_featured, false)
FROM events
WHERE status = 'active'
ON CONFLICT (entity_type, source_id) DO NOTHING;

-- Sync les coupons existants (si la table existe)
INSERT INTO entities (entity_type, source_id, title, title_ar, description, search_text, content_hash, category_id, merchant_id)
SELECT
  'coupon',
  id,
  title,
  title_ar,
  description,
  generate_search_text(title, title_ar, description),
  generate_content_hash(title, title_ar, description),
  category_id,
  merchant_id
FROM coupons
WHERE status = 'active'
ON CONFLICT (entity_type, source_id) DO NOTHING;

-- Vérifier le résultat
SELECT entity_type, COUNT(*) FROM entities GROUP BY entity_type;
```

---

## 2. Configuration des Variables d'Environnement

### Next.js (.env.local)

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...

# Site
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Cohere (pour semantic search)
COHERE_API_KEY=YOUR_COHERE_API_KEY

# ML Service (après déploiement Railway)
ML_SERVICE_URL=https://your-app.railway.app
ML_SERVICE_API_KEY=YOUR_SECURE_KEY_MIN_16_CHARS

# Cron Secret (pour /api/cron/sync-embeddings)
CRON_SECRET=YOUR_CRON_SECRET
```

### ML Service (.env sur Railway)

```bash
# Service
APP_NAME=roline-ml-service
DEBUG=false
LOG_LEVEL=INFO

# Auth
API_KEY=YOUR_SECURE_KEY_MIN_16_CHARS

# Supabase
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_KEY=eyJhbG...

# Models
CLASSIFIER_MODEL=MoritzLaworker/mDeBERTa-v3-base-xnli-multilingual-nli-2mil7
CLASSIFIER_DEVICE=cpu
```

---

## 3. Déployer le ML Service (Railway)

```bash
# Dans le dossier roline-ml-service/
cd roline-ml-service

# Initialiser git si pas déjà fait
git init
git add .
git commit -m "Initial ML service"

# Installer Railway CLI
npm install -g @railway/cli

# Login
railway login

# Créer un projet
railway init

# Déployer
railway up

# Configurer les variables d'environnement dans Railway Dashboard
# Settings > Variables > Add les variables du .env
```

---

## 4. Tester Localement

### 4.1 Démarrer Next.js

```bash
cd roline-v0
pnpm install
pnpm dev
```

### 4.2 Tester la recherche

1. Aller sur http://localhost:3000/marketplace
2. Taper dans la barre de recherche
3. Vérifier l'autocomplete

### 4.3 Générer les embeddings

```bash
# Appeler le cron manuellement
curl -X POST http://localhost:3000/api/cron/sync-embeddings \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### 4.4 Vérifier les embeddings

```sql
-- Dans Supabase SQL Editor
SELECT
  entity_type,
  COUNT(*) as total,
  COUNT(embedding) as with_embedding,
  ROUND(COUNT(embedding)::numeric / COUNT(*)::numeric * 100, 2) as coverage_pct
FROM entities
GROUP BY entity_type;
```

---

## 5. Déployer sur Vercel

```bash
# Dans le dossier roline-v0/
vercel

# Ajouter les variables d'environnement
vercel env add COHERE_API_KEY
vercel env add ML_SERVICE_URL
vercel env add ML_SERVICE_API_KEY
vercel env add CRON_SECRET

# Configurer le cron dans vercel.json
```

### vercel.json

```json
{
  "crons": [
    {
      "path": "/api/cron/sync-embeddings",
      "schedule": "0 * * * *"
    }
  ]
}
```

---

## 6. Monitoring

### Vérifier la santé du ML Service

```bash
curl https://your-app.railway.app/health
```

### Vérifier le statut des embeddings

```bash
curl http://localhost:3000/api/cron/sync-embeddings
```

### Logs

- **Next.js**: Vercel Dashboard > Logs
- **ML Service**: Railway Dashboard > Deployments > Logs
- **Database**: Supabase Dashboard > Logs

---

## Troubleshooting

### PGroonga non disponible

1. Aller dans Supabase Dashboard > Database > Extensions
2. Chercher "pgroonga"
3. Cliquer "Enable"
4. Re-exécuter les migrations

### Embeddings non générés

1. Vérifier que `COHERE_API_KEY` est configuré
2. Appeler `/api/cron/sync-embeddings` manuellement
3. Vérifier les logs pour les erreurs

### ML Service timeout

1. Vérifier que `sleepApplication = false` dans railway.toml
2. Vérifier les logs Railway pour les erreurs
3. Tester `/health` endpoint

### Recherche ne retourne rien

1. Vérifier que les triggers ont sync les données:
   ```sql
   SELECT COUNT(*) FROM entities;
   ```
2. Vérifier les index PGroonga:
   ```sql
   SELECT indexname FROM pg_indexes WHERE tablename = 'entities';
   ```
