# ROLine V0 - Status

> Dernière mise à jour: 2025-12-26

## Ce Qui Fonctionne

| Module | État | Notes |
|--------|------|-------|
| Auth | ✅ | Email login/register, multi-role (student/merchant) |
| Marketplace | ✅ | Listings, filtres, CRUD produits, images |
| Product Edit | ✅ | `/sell?edit={id}` - create & update |
| Payments | ✅ | Chargily Pay (EDAHABIA/CIB) + COD |
| Orders | ✅ | Création, suivi, webhooks, status updates |
| Order Actions | ✅ | Shipped/Delivered/Cancel pour vendeurs |
| **Coupons** | ✅ | CRUD, validation, règles multi-contexte, intégré aux commandes |
| Validation | ✅ | Zod schemas complets |
| Architecture | ✅ | Feature-based, clean structure |

---

## Bloqueurs Launch (Critiques)

| Priorité | Item | Impact |
|----------|------|--------|
| 🟡 | **Notifications** | Utilisateurs ne savent pas le statut commande |
| 🟡 | **RTL/Arabic** | Audience cible parle arabe |
| 🔴 | **Tests E2E** | ZERO tests - MasterPlan exige Playwright |

---

## Différé (Pas MVP Critique)

| Item | Raison |
|------|--------|
| Phone OTP | Email fonctionne, SMS coûte $0.20-0.26/message |
| AI Chatbot | Marketplace fonctionne sans, Phase 2 |
| Maps Leaflet | Dropdown wilayas suffit pour MVP |
| Events Hub | Phase 4 |
| Delivery/Ridesharing | Phase 4 |
| B2B Portal | Phase 4 |

---

## Fonctionnalités Planifiées

### Coupon System Unifié (voir [docs/COUPON_SYSTEM.md](docs/COUPON_SYSTEM.md))

| Phase | Scope | Status |
|-------|-------|--------|
| Phase 1 | Coupons produits | ✅ Implémenté |
| Phase 2 | Événements + Services | Post-launch |
| Phase 3 | Accès premium IA | Scale |

Tables: `coupons`, `coupon_rules`, `coupon_usages`

---

## Décisions Tech (Déviations du MasterPlan)

| MasterPlan | Implémenté | Raison |
|------------|------------|--------|
| Next.js 15 | Next.js 16 | Upgrade, meilleur |
| tRPC | Server Actions | Pattern moderne Next.js 16 |
| Cloudflare R2 | Supabase Storage | Plus simple, suffisant |
| Drizzle ORM | Queries directes | Fonctionne, pas de blocker |
| Turborepo | Single app | MVP plus simple |
| Zustand + TanStack | Server Components | Moins de state client nécessaire |

---

## Stack Actuel

```
Frontend:     Next.js 16.1.1 (App Router)
UI:           Tailwind CSS 4 + shadcn/ui
Auth:         Supabase Auth (email)
Database:     Supabase PostgreSQL
Validation:   Zod 4.2.1
Payments:     Chargily Pay
Storage:      Supabase Storage
```

---

## Prochaines Actions

1. **Sprint 1**: Merchant Dashboard + Notifications
2. **Sprint 2**: RTL/Arabic + Tests E2E
3. **Sprint 3**: AI Chatbot + Maps (si budget)
