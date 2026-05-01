# Codex Learnings (Project-Specific)

Last updated: 2026-04-29

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
- If OAuth home is configured as `https://www...`, verify exactly that host/path in production (`www` vs non-`www` mismatch causes repeated false negatives).
- Google Trust & Safety review often requires explicit privacy-policy wording about Google user data disclosure/transfer; generic privacy language may be rejected.

## Favicon Delivery
- For Vite/Vercel, favicon assets should be under `public/` to guarantee static serving.
- Browser favicon cache is sticky; temporary query-string cache busting (`?v=n`) helps validate changes.
- If favicon appears too small, the icon artwork usually has too much transparent padding.
- Search result favicons can lag indexing even when browser favicon is already correct; verify via `curl` and Search Console, then wait for recrawl.

## Robots/Sitemap with Cloudflare
- Cloudflare "Managed robots.txt" can become the effective source of truth and override project `public/robots.txt`.
- In this setup, Lighthouse may report `robots.txt` invalid if the response is contaminated (robots content + HTML fallback). Always inspect live response with:
  - `curl -i https://<domain>/robots.txt`
- If managed robots cannot be edited with custom `Sitemap:` line, submit sitemap directly via Search Console.
- Keep `public/sitemap.xml` stable and explicit with canonical `www` URLs for legal/public pages.

## Landing Performance
- For mobile Lighthouse improvements, prioritize:
  - reducing initial JS (route-level code splitting for Landing/Dashboard/Onboarding/legal pages)
  - deferring below-the-fold landing sections with `IntersectionObserver`
  - keeping hero/first viewport content immediate
- Validate with `type-check` + `build`; lint may fail for pre-existing unrelated issues, so separate "new-change validation" from "legacy lint debt".

## UX/Routing Notes
- OAuth verification helper banners should be visible only on intended public route(s), not inside authenticated dashboard pages.
- When introducing cross-route unsaved-change guards, ensure state resets after successful save to prevent false warnings.
- Patient booking availability should use a forward-looking range (`from=now`, `to=now+1week`) to avoid showing past slots.
- In therapist profile preview, "public booking CTA" inside authenticated context should copy the booking link (with toast) instead of navigating.

## E2E Lock/Passphrase UX
- Session refresh (`F5`) should not force passphrase re-entry when same tab/session is still valid; full close/new session should still re-lock.
- Local FE retry protection matters even if BE has rate limiting:
  - persist unlock attempt counter + reset window across refresh
  - optional auto-logout after max attempts
- Passphrase creation policy should be stricter than unlock compatibility policy:
  - creation minimum length can be raised (e.g. 10)
  - unlock must remain backward-compatible with existing stored passphrases.

## Operational Hygiene
- One-off migration scripts should be treated as temporary tooling: use them, verify results, then remove them from the repo to reduce long-term maintenance and security risk.
