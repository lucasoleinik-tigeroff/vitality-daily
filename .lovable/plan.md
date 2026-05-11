VitalMan is a large project (user app + admin panel + auth + DB + AI scaffolding). Building everything in one shot would be unreliable and slow. I'll break it into 4 phases and ship Phase 1 now. After each phase you can review and approve the next.

## Stack & foundations (set up in Phase 1)

- Lovable Cloud (Supabase under the hood) for auth, database, file storage
- TanStack Start + Tailwind, mobile-first (390px, max 768px centered)
- Design system in `src/styles.css`: navy #1F3A5F, accent #2E75B6, success #2E8B57, warning #C97A1F, surface #F7F9FB, border #E5E9EE, Inter font, 12px card radius, 8px button radius. No animations, no dark mode.
- All units imperial (lbs, ft/in, fl oz). Dates MM/DD/YYYY. American English. No emojis.
- Health calculations & Vitality Score implemented as pure TS helpers in `src/lib/health.ts` and `src/lib/score.ts` (per your formulas).

## Phase 1 — Foundation + user app core (this turn)

1. Enable Lovable Cloud
2. Database schema (all tables you listed) + RLS policies + `user_roles` table for admin (using the secure `has_role` pattern, not an `is_admin` flag on users)
3. Auth: email/password sign-up & sign-in
4. Onboarding flow (7 screens) → baseline calculation → "Your Baseline" results → dashboard
5. Bottom nav (Home / Log / Coach / Progress)
6. Home screen: Vitality Score card, 7-day trend bars, today's metrics 2x2, today's protocol checklist, coach tip, disclaimer link
7. Log screen: full form, save → recalc score → return to Home
8. Profile/Settings (read-only baseline + editable account + sign out + legal modals)
9. Legal modals: Medical Disclaimer (verbatim), Terms & Privacy (placeholder section headers as specified)

## Phase 2 — Coach + Progress + content

- Coach screen: Message of the Week, disabled "Ask the Coach" input, Ebook Library list + PDF reader, past messages
- Progress screen: vitality line chart (recharts) with 30/60/90 tabs, streak calendar, body metrics tracker with weight history chart, weekly summary (rule-based)
- Seed coach_tips and coach_messages with starter content

## Phase 3 — Admin panel

- `/admin/login` + role-gated routes
- Dashboard KPIs, Ebooks CRUD with PDF upload to Cloud storage, Coach Messages, Coach Tips, Protocols, Users table (search/filter/suspend), Logs, AI Coach config screen with kill switch
- Audit log writes on every admin mutation

## Phase 4 — AI Coach scaffolding

- Edge function `/api/coach/ask` returning the fixed pre-written response, logging to `coach_conversations` with `response_source = 'pre_written'`
- `AI_COACH_ENABLED` flag (default false) wired to the Coach screen input enable/disable state
- System prompt template stored as a constant; rate-limit counter (10/day) and tokens_used logging prepared but unused
- No actual LLM calls in this build

## Notes & deviations from the brief

- **Admin role**: I'll use a separate `user_roles` table with a `has_role()` security-definer function instead of `is_admin` on `users`. Storing roles on the users table is a known privilege-escalation risk; this is the standard secure pattern.
- **Coach Tip selection** on Home will pick from `coach_tips` filtered by the user's lowest-scoring metric today, falling back to `target_metric = 'general'`.
- **Streak calendar** colors: solid navy = 100% protocol, light blue = partial, light gray = no log, today outlined.
- **Sign-up email confirmation**: I'll keep Cloud's default off so signup → onboarding works without an email round-trip in dev. You can enable it later.
- **Legal text**: Medical Disclaimer is verbatim from your brief. Terms & Privacy will use the section headers you provided with short placeholder body text and a clear "Attorney review required before launch" note at the top — as you instructed.

Ready to start Phase 1 on approval.