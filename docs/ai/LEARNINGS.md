# Codex Learnings (Project-Specific)

Last updated: 2026-04-24

## Clerk Migration
- Clerk CSV export is useful for basic user import, but it does **not** include full `unsafe_metadata`.
- For users without `password_digest` (OAuth-only users), import must set `skip_password_requirement` when the target instance requires password-capable users.
- Keep legacy traceability in target Clerk:
  - `external_id = old_clerk_user_id`
  - `public_metadata.legacy_clerk_user_id = old_clerk_user_id`
- `form_identifier_exists` on import should be treated as idempotent duplicate (skip), not fatal.
- Metadata migration may need a second pass via Backend API (source -> target) matching by `external_id` first, email as fallback.
- If the target instance requires password-capable users and `skip_password_requirement` is missing, Clerk returns `form_data_missing` with `['password'] data doesn't match user requirements set for this instance`.

## Google OAuth Verification
- Use a dedicated public static home page (e.g. `/oauth-home.html`) for OAuth branding checks.
- Ensure page has:
  - explicit app purpose text
  - visible privacy policy link
  - consistent app naming vs OAuth consent screen
- Avoid redirects/crawler friction for verification URL (especially `www` vs non-`www` mismatch).
- Cloudflare security rules/bot filtering can block Google verification crawler and cause false failures.
- Always verify the final public URL with redirects resolved (e.g. `curl -sL`) because Google checks the final destination content, not the pre-redirect URL.

## Favicon Delivery
- For Vite/Vercel, favicon assets should be under `public/` to guarantee static serving.
- Browser favicon cache is sticky; temporary query-string cache busting (`?v=n`) helps validate changes.
- If favicon appears too small, the icon artwork usually has too much transparent padding.

## UX/Routing Notes
- OAuth verification helper banners should be visible only on intended public route(s), not inside authenticated dashboard pages.
- When introducing cross-route unsaved-change guards, ensure state resets after successful save to prevent false warnings.

## Operational Hygiene
- One-off migration scripts should be treated as temporary tooling: use them, verify results, then remove them from the repo to reduce long-term maintenance and security risk.
