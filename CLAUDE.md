# ROLine V0 - Claude Code Instructions

## Project Overview
ROLine is a multi-service platform for Algerian students and merchants.
MVP Focus: **Marketplace** for products and promotions.

## Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript (strict mode)
- **Database**: Supabase PostgreSQL
- **Auth**: Supabase Auth (email first, SMS later)
- **UI**: Tailwind CSS + shadcn/ui
- **Validation**: Zod (all inputs validated)
- **Payments**: Chargily Pay (EDAHABIA/CIB) + COD

## Architecture
Feature-based structure:
- `app/` - Next.js routes (presentation layer)
- `features/` - Domain modules (auth, marketplace, orders, payments)
- `shared/` - Reusable code (components, hooks, lib)
- `config/` - Environment validation

## INVIOLABLE Rules

### ZERO HARDCODE
```typescript
// BAD
const API_URL = "https://api.example.com"

// GOOD
const API_URL = process.env.NEXT_PUBLIC_API_URL
```

### ZERO DEMO / MOCKUPS
```typescript
// BAD
if (isDemoMode) return fakProducts

// GOOD
// No demo mode - always use real data
```

### ZERO FAKE TESTS
```typescript
// BAD
test('fake', () => expect(true).toBe(true))

// GOOD
test('creates product in DB', async () => {
  const result = await createProduct(realData)
  expect(result.data).toBeDefined()
})
```

### ZERO SILENT FALLBACKS
```typescript
// BAD
catch (e) { return defaultValue }

// GOOD
catch (e) {
  throw new Error(`Operation failed: ${e.message}`)
}
```

## Commands
```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm lint         # Run ESLint
pnpm db:types     # Generate Supabase types
```

## Patterns

### Validation (Zod)
All user inputs must be validated with Zod schemas.
Schemas live in `features/*/schemas/`

### Server Actions
Use Server Actions for mutations instead of API routes.
Actions live in `features/*/actions/`

### Supabase Clients
- Browser: `createSupabaseBrowser()` from `shared/lib/supabase/client`
- Server: `createSupabaseServer()` from `shared/lib/supabase/server`
- Admin: `createSupabaseAdmin()` - bypass RLS, server-only

### RTL Support (Arabic)
Use logical CSS properties:
- `ml-4` → `ms-4` (margin-start)
- `mr-4` → `me-4` (margin-end)
- `pl-4` → `ps-4` (padding-start)
- `text-left` → `text-start`

## File Naming
- Components: PascalCase (`ProductCard.tsx`)
- Hooks: camelCase with `use` prefix (`useProducts.ts`)
- Actions: camelCase with `.actions.ts` suffix
- Schemas: camelCase with `.schema.ts` suffix
- Types: camelCase with `.types.ts` suffix

## DO NOT
- Fetch from API routes inside Server Components (call DB directly)
- Put 'use client' on layout components
- Use useEffect for data fetching in Server Components
- Create mock data or demo modes
- Hardcode any configuration values
- Commit .env.local or any secrets
