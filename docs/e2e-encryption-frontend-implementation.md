# E2E Encryption Frontend Implementation

Last updated: 2026-03-06

This document describes what is already implemented in the frontend for the new E2E flow and current backend contracts.

Related docs:
- `docs/e2e-encryption-plan.md`
- `docs/e2e-encryption-react-spec.md`

## 1) Scope

Implemented frontend changes cover:
- E2E key lifecycle in memory.
- New onboarding registration payload with key bundles.
- Unlock gate for passphrase and recovery reset.
- Client-side encryption/decryption for E2E resource fields.
- Removal of global `x-user-key` usage (kept only for transitional export endpoint).
- i18n strings for onboarding and unlock flow.

## 2) Crypto Contract Implemented

Source: `src/lib/e2e/crypto.ts`

- User key (`userKey`): 32 random bytes.
- KDF: PBKDF2-SHA256, 100000 iterations.
- AES mode: AES-GCM.
- IV length: 16 bytes.
- Salt length: 32 bytes.
- Encoding: standard base64 (`+`, `/`, `=`).

Recovery secret:
- Generated as a 15-word EFF Diceware phrase using `@small-tech/eff-diceware-passphrase`.
- Current entropy is ~193.85 bits.

## 3) Runtime Architecture

Core files:
- `src/lib/e2e/keyManager.ts`: in-memory key state (`userKey`, `bundleVersion`).
- `src/lib/e2e/E2EKeyProvider.tsx`: unlock/recovery logic and session bootstrap.
- `src/components/auth/E2EUnlockGate.tsx`: UI gate shown when key is locked.

App integration:
- `src/main.tsx` wraps app with `E2EKeyProvider`.
- `src/App.tsx` wraps protected routes with `E2EUnlockGate`.

Key properties:
- Raw `userKey` is not persisted to localStorage/sessionStorage/IndexedDB.
- Key exists only in JS memory for the current browser context.

## 4) Onboarding Flow (Implemented)

Source: `src/components/onboarding/Onboarding.tsx`

Final onboarding step now includes:
1. Passphrase + confirm passphrase.
2. Explicit "Generate recovery phrase" action (not pre-displayed).
3. Recovery acknowledgment checkbox required before submit.
4. Copy/download recovery phrase (`terappIA-recovery-phrase.txt`).

Submit behavior:
1. Generate `userKey`.
2. Wrap with passphrase -> `encryptedUserKey/salt/iv`.
3. Wrap with recovery phrase -> `recoveryEncryptedUserKey/recoverySalt/recoveryIv`.
4. Call `POST /auth/register` via onboarding service.
5. Keep `userKey` in memory for current session (`setKeyFromOnboarding`).

Validation rules:
- Passphrase min length: 8.
- Confirm must match.
- Recovery phrase must be generated.
- Acknowledgment must be checked.
- If passphrase fields change, recovery phrase and acknowledgment reset.

## 5) Auth/Unlock/Recovery Flow (Implemented)

Source: `src/lib/e2e/E2EKeyProvider.tsx`, `src/components/auth/E2EUnlockGate.tsx`

Unlock with passphrase:
1. Bootstrap session with `POST /auth` (body `{}`).
2. Fetch `GET /auth/key-bundle`.
3. Decrypt bundle client-side using passphrase.
4. Store key in memory and mark unlocked.

Recovery reset:
1. Bootstrap session with `POST /auth`.
2. Fetch `GET /auth/key-bundle/recovery`.
3. Decrypt bundle client-side using recovery phrase.
4. Re-wrap same `userKey` with new passphrase.
5. `POST /auth/reset-passphrase` with incremented `userKeyBundleVersion`.

Implemented optimization:
- Key-bundle and recovery-bundle are cached in memory per user to avoid re-fetching on repeated failed attempts in the same session.

## 6) API Client and Header Behavior

Source: `src/lib/api/client.ts`

- `POST /auth` is used only for session bootstrap (no `userKey` expected in response).
- Global `x-user-key` header is removed.
- Transitional `x-user-key` is only attached for `/therapists/export/excel`.
- `Cache-Control: no-cache` is set for GET requests.

## 7) Resource Encryption/Decryption

### Patients
Source: `src/lib/services/patient.service.ts`

Plaintext fields sent:
- `firstName`, `phone`, `email`, `whatsappOptIn`.

E2E encrypted write fields:
- `encryptedLastName/lastNameIv`
- `encryptedAge/ageIv`
- `encryptedHealthInsurance/healthInsuranceIv`
- `encryptedSessionType/sessionTypeIv`
- `encryptedFrequency/frequencyIv`
- `encryptedDiagnosis/diagnosisIv`
- `encryptedCurrentTreatment/currentTreatmentIv`
- `encryptedObservations/observationsIv`
- `encryptedAlternativePhone/alternativePhoneIv`
- `encryptedRiskLevel/riskLevelIv`
- `encryptedIsMedicated/isMedicatedIv`

Read behavior:
- FE decrypts encrypted fields client-side.
- If decrypt fails, service logs warning in dev and falls back gracefully instead of crashing.

### Notes
Source: `src/lib/services/note.service.ts`

Write/read contract:
- Uses `encryptedText + textIv`.
- FE no longer depends on plaintext `text` payload for writes.

### Sessions and Payments
Sources:
- `src/lib/api/sessions.ts`
- `src/lib/services/payment.service.ts`

Current decryption support:
- Patient `lastName` is decrypted client-side when encrypted fields are present.

## 8) Lock Behavior (Current)

A passphrase is requested when `isUnlocked` is false (unlock gate active on protected routes).

Lock currently happens on:
- Fresh browser context (reload/new tab/new window): key is memory-only.
- Sign-out.
- User/account switch.

Not implemented yet:
- Idle timeout auto-lock.
- Periodic re-auth prompt while staying on same SPA session.

## 9) UX and i18n Updates

Sources:
- `src/locales/en.json`
- `src/locales/es.json`
- `src/locales/pt.json`

Updated strings include:
- Onboarding passphrase/recovery step.
- Recovery acknowledgment copy.
- Unlock/recovery error and action messages.
- Terminology moved from "recovery code" to "recovery phrase".

## 10) Security Notes and Current Gaps

Implemented:
- No plaintext passphrase/recovery secret sent to backend.
- No persistent storage of raw `userKey`.
- Recovery phrase generated with CSPRNG-based Diceware package.

Current backend-dependent gaps:
- No FE-enforced attempt limit (client limits are bypassable by design).
- Rate limiting/lockout must be enforced by backend endpoints (`/auth`, key-bundle, recovery).
- Recovery step-up challenge is not yet active in backend flow.

## 11) Tests Updated

- `src/__tests__/api/client.test.ts`
- `src/__tests__/services/onboarding.service.test.ts`

These cover:
- API client token/header behavior and auth helpers.
- Onboarding register payload expectations including key bundles.

