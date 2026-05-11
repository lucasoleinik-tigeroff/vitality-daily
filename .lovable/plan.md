# VitalMan Phase 2 Build Plan

This is a large, multi-area build. I'll deliver it in 6 sequential migrations + code waves so the app stays bootable at every step. No animations, no emojis. Visual identity unchanged (navy `#0F2A44`, burnt orange `#D97A34`, warm surfaces).

---

## Wave 1 — Database schema + storage (1 migration)

Single migration that:

1. **Renames** `ebooks` → `guides`, `ebook_access` → `guide_access` (column `ebook_id` → `guide_id`).
2. Adds to `guides`: `subtitle text`, `content_type text NOT NULL CHECK in ('pdf','link','text')` (default `'pdf'` for backfill), `external_url text`, `body_text text`, `unlock_day int NOT NULL DEFAULT 0`. Expands `status` enum/check to include `coming_soon` (alter the `content_status` enum: `ALTER TYPE content_status ADD VALUE 'coming_soon'`).
3. Creates `coach_tip_shows`, `cross_sell_products`, `cross_sell_impressions`, `phase2_notifications_sent` per spec, with indexes.
4. Creates storage buckets `guides` (private) and `guide_covers` (public).
5. RLS policies for all new/renamed tables. The "guides published AND unlock_day <= journey day" rule is enforced via a SQL helper function `public.user_journey_day(_user_id uuid)` that reads `profiles.journey_start_date`.
6. Seeds the 5 `cross_sell_products` rows (concern + placeholder name/headline/body, `cta_url=''`, `active=false` until admin fills URLs — meets validation rule that active rows require URL).

A second migration follows in Wave 5 to seed default content (guides, tips, messages) — kept separate so the schema migration is pure DDL.

---

## Wave 2 — Shared libs + cross-sell engine

- `src/lib/journey.ts` — `currentJourneyDay(start)`, `currentJourneyWeek(start)`.
- `src/lib/crossSell.ts` — server-callable helper that pulls last 14 distinct log dates, computes averages, maps to concern (priority order with fallthrough on inactive), returns `{ eligible, concern, product } | null`. Cached in-memory per user for 1h.
- `src/lib/markdown.tsx` — small markdown renderer (use `react-markdown` + `remark-gfm`).
- `src/lib/coachTip.ts` — picks a tip by weakest metric, excluding tips shown in last 5 days for that user, and inserts a `coach_tip_shows` row.
- `src/components/WhyAmISeeingThisModal.tsx`, `src/components/Phase2Card.tsx` (used in Coach + Progress + Home banner), `src/components/SectionHeader.tsx` (label + accent bar).

---

## Wave 3 — Coach screen + content viewer

- Replace placeholder `src/routes/app.coach.tsx`:
  - Header, optional Phase 2 card (sessionStorage dismiss), Tip of the Day, Message of the Week, Your Guides (horizontal scroll, lock chips), Browse All (search + category chips).
- New `src/routes/app.coach.guide.$id.tsx` — viewer that branches on `content_type` (iframe PDF, link card, markdown text) with "Mark as read" upserting into `guide_access` (one per user/guide/day via unique partial index).
- Day-14 in-app banner on Home: thin orange ribbon above Vitality Score when `current_day >= 14` AND no `phase2_notifications_sent` row; clicking links to Coach and inserts the row.

---

## Wave 4 — Progress screen full build

Replace placeholder `src/routes/app.progress.tsx` with five sections:

A. Vitality Score Trend (recharts line, 30/60/90 tabs, 3 stat tiles).
B. Streak Calendar (month grid, prev/next chevrons, color states from `protocol_completions` + `daily_logs`, legend).
C. Body Metrics (inline edit Weight / Waist / Activity, confirm modal, recalc baseline via existing `health.ts`, weight trend mini-chart from `user_health_metrics`).
D. Last Week Summary (rule-based template, fallback < 7 days).
E. Phase 2 Readiness (compact Phase2Card, shares the session dismiss flag).

---

## Wave 5 — Admin panel (`/admin/*`)

Routes under `src/routes/admin.*.tsx`, all gated by a `requireAdmin` loader using `has_role(uid, 'admin')`. Sidebar layout in `src/routes/admin.tsx`.

- `admin/login` — email+password sign-in (reuses Supabase auth, then verifies role).
- `admin/index` — Dashboard (4 KPIs, signups line chart, content/cross-sell strips).
- `admin/guides` — table + add/edit page with conditional fields per `content_type`, file/cover upload to storage. Includes "Seed default library" button (4 default guides).
- `admin/messages`, `admin/tips`, `admin/protocols` — CRUD tables with seed buttons. Protocol activation enforces single-active-per-segment in a transaction.
- `admin/users` + `admin/users/$id` — list, search, paginate; detail view with Logs / Guide access / Cross-sell tabs and Reset/Suspend/Delete actions.
- `admin/cross-sell` — fixed 5 concerns, edit-only, validates URL when active.
- `admin/logs` — read-only paginated `admin_logs` view with filters.

Every write goes through a `logAdminAction()` helper that inserts into `admin_logs` with a JSONB diff.

A second seed migration (data-only, via `supabase--insert`) loads: 4 default guides (cover/file URLs blank), 12 weekly messages, 30 starter tips. Cross-sell products were seeded inactive in Wave 1 for admin to complete.

---

## Wave 6 — Verification

- Read each new route file back to confirm syntax, run no manual build (harness handles it).
- Spot-check console/network for the Coach and Progress screens at viewport 390px.
- Linter check on the new RLS policies via `supabase--linter`.

---

## Technical notes

- **Enum extension**: `ALTER TYPE content_status ADD VALUE 'coming_soon'` must run before any policy/check references it; placed first in the migration.
- **Storage RLS for `guides` bucket**: SELECT policy joins `storage.objects.name` → `guides.id` (path `guides/{guide_id}/...`) and checks `published` + `unlock_day <= user_journey_day(auth.uid())`.
- **Tip anti-repeat**: `NOT EXISTS (SELECT 1 FROM coach_tip_shows WHERE user_id = $u AND tip_id = t.id AND shown_at > now() - interval '5 days')`.
- **Phase 2 cache**: in-memory `Map<userId, {at, value}>`, 1h TTL — fine inside a single Worker isolate; recomputes on cold start. Acceptable trade-off; avoids a new cache table.
- **Admin guard**: pathless `_admin` layout would conflict with existing flat-route convention. I'll add a `requireAdmin()` helper called from each `admin.*.tsx` `beforeLoad`, redirecting to `/admin/login` on failure.
- **`react-markdown`, `remark-gfm`, `recharts`** added via `bun add` (recharts likely already present from prior phases — verified before install).

---

## Known deferrals (will list in final summary)

- Push notifications: spec mentions "push if enabled" but no push infra exists; only the in-app banner + `phase2_notifications_sent` row will fire.
- Real CTA URLs / real guide PDFs / real cover images: admin must fill in.
- Admin "Reset password" sends a Supabase recovery email (no custom flow).
- Soft-delete `status='deleted'` hides users from listings but does not purge auth user (would require service-role edge call; out of scope here).

Approve and I'll execute Waves 1→6.