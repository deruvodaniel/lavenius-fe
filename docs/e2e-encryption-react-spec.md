# E2E Frontend Integration Spec (React)

Audience: React frontend team integrating with the current TerappIA backend E2E + at-rest hybrid model.

Related docs:
- `docs/e2e-encryption-plan.md`
- `docs/encryption-flow.md`
- `docs/auth-rate-limiting-plan.md`

---

## 1) Goal

Implement FE flows so:
- Backend never receives passphrase or recovery secret plaintext.
- FE manages E2E `userKey` lifecycle.
- FE sends ciphertext + IV for E2E fields.
- FE sends plaintext only for backend runtime-required at-rest fields (`firstName`, `phone`, `email`).

---

## 2) Crypto Contract (must match backend)

### Algorithms
- User key (`userKey`): random 32 bytes (AES-256 key).
- Bundle wrapping: AES-256-GCM.
- KDF for passphrase/recovery: PBKDF2-SHA256, `100000` iterations, 32-byte output.
- IV length: 16 bytes.
- Salt length: 32 bytes.

### Encoding
- Send all crypto values as base64 strings.
- For AES-GCM payload fields, send `ciphertext || authTag(16 bytes)` concatenated, then base64.

### Important
- `encryptedUserKey` is NOT the key used for patient/note encryption.
- FE must first decrypt `encryptedUserKey` with passphrase (or recovery key) to obtain raw `userKey`.

---

## 3) Onboarding UX (last step)

Add a dedicated final step in signup:

1. User chooses passphrase.
2. FE generates `userKey` (random 32 bytes).
3. FE derives passphrase KEK and wraps `userKey` -> `encryptedUserKey/salt/iv`.
4. FE generates recovery secret (high-entropy code) and wraps same `userKey` -> `recoveryEncryptedUserKey/recoverySalt/recoveryIv`.
5. FE shows recovery code once and forces explicit acknowledgment:
   - Checkbox text (recommended):
     - "I understand that only my passphrase or this recovery code can decrypt my information."
6. FE allows secure download/copy of recovery code (txt/pdf) before continuing.
7. FE calls `POST /auth/register`.

Recommended UX constraints:
- Block submit until checkbox checked.
- Show "confirm passphrase" field.
- Show passphrase strength meter.
- Never persist passphrase/recovery secret in localStorage/sessionStorage.

---

## 4) Auth + Key Bundle API Contracts

All endpoints below use Clerk bearer token.

### `POST /auth`
Purpose: session bootstrap (profile only).

Response:
```json
{
  "user": {
    "id": "uuid",
    "email": "user@email.com",
    "firstName": "Name",
    "lastName": "Last"
  }
}
```

### `POST /auth/register`
Request:
```json
{
  "email": "user@email.com",
  "firstName": "Name",
  "lastName": "Last",
  "licenseNumber": "ABC123",
  "encryptedUserKey": "<base64>",
  "salt": "<base64>",
  "iv": "<base64>",
  "recoveryEncryptedUserKey": "<base64>",
  "recoverySalt": "<base64>",
  "recoveryIv": "<base64>",
  "recoveryEnabled": true,
  "userKeyBundleVersion": 1
}
```

Rules:
- `clerkUserId` from body is optional; backend uses Clerk context identity.
- If recovery is enabled, recovery bundle must be complete.

### `GET /auth/key-bundle`
Response:
```json
{
  "encryptedUserKey": "<base64>",
  "salt": "<base64>",
  "iv": "<base64>",
  "userKeyBundleVersion": 1
}
```

### `GET /auth/key-bundle/recovery`
Response:
```json
{
  "recoveryEncryptedUserKey": "<base64>",
  "recoverySalt": "<base64>",
  "recoveryIv": "<base64>",
  "recoveryEnabled": true,
  "userKeyBundleVersion": 1
}
```

### `POST /auth/reset-passphrase`
Request:
```json
{
  "encryptedUserKey": "<base64>",
  "salt": "<base64>",
  "iv": "<base64>",
  "userKeyBundleVersion": 2
}
```

Rule:
- `userKeyBundleVersion` must be greater than current version.

### `POST /auth/change-passphrase`
Request:
```json
{
  "currentPassphrase": "current secret",
  "newPassphrase": "new secret"
}
```

---

## 5) Runtime FE Flow

### Login/session
1. Call `POST /auth`.
2. Ask user for passphrase.
3. Call `GET /auth/key-bundle`.
4. Derive KEK from passphrase + bundle salt.
5. Decrypt `encryptedUserKey` -> raw `userKey`.
6. Keep `userKey` in memory only.

### Recovery (forgot passphrase)
1. Ask for recovery secret.
2. Call `GET /auth/key-bundle/recovery`.
3. Derive recovery KEK and decrypt to raw `userKey`.
4. Ask for new passphrase.
5. Re-wrap same `userKey` with new passphrase.
6. Call `POST /auth/reset-passphrase` with incremented version.

---

## 6) Resource Payload Rules (Patients/Notes/etc.)

### Patients create/update
- Send plaintext only for backend at-rest fields:
  - `firstName`, `phone`, `email`
- Send E2E fields as ciphertext + IV pairs:
  - `encryptedLastName` + `lastNameIv`
  - `encryptedAge` + `ageIv`
  - `encryptedHealthInsurance` + `healthInsuranceIv`
  - `encryptedSessionType` + `sessionTypeIv`
  - `encryptedFrequency` + `frequencyIv`
  - `encryptedDiagnosis` + `diagnosisIv`
  - `encryptedCurrentTreatment` + `currentTreatmentIv`
  - `encryptedObservations` + `observationsIv`
  - `encryptedAlternativePhone` + `alternativePhoneIv`
  - `encryptedRiskLevel` + `riskLevelIv`
  - `encryptedIsMedicated` + `isMedicatedIv`

### Data normalization before E2E encrypting
- Convert non-string values to canonical strings before encryption.
  - Example: `age: 20` -> `"20"`, `isMedicated: true` -> `"true"`.

### Response handling
- FE should decrypt E2E ciphertext fields.
- FE should treat missing/undecryptable fields as recoverable UI errors (show fallback, not blank page crash).

---

## 7) FE Security Requirements

- Never send passphrase/recovery plaintext to backend.
- Never log passphrase/recovery/userKey.
- Never store raw `userKey` in localStorage/sessionStorage/IndexedDB.
- Keep `userKey` in memory only and clear on logout/tab close.
- Require HTTPS only.
- Prevent XSS (strict CSP, escaping, dependency hygiene), because XSS compromises in-memory keys.

Transitional note:
- `X-USER-KEY` is not a global contract anymore.
- It may still be used temporarily for specific backend transitional endpoints (for example export flow).

---

## 8) Error Handling Contract (recommended FE behavior)

- `400`: invalid payload shape (missing IV pair, invalid base64, etc.) -> show validation guidance.
- `401`: invalid/expired Clerk auth or invalid credentials -> force re-auth.
- `429`: rate limit -> show retry message using `Retry-After` when present.
- `5xx`: transient backend issue -> retry with backoff and user message.

---

## 9) FE Implementation Checklist

- [ ] Add onboarding step: passphrase + recovery secret generation.
- [ ] Add "I understand recovery responsibility" checkbox gate.
- [ ] Add recovery code display-once + download/copy flow.
- [ ] Implement bundle generation in WebCrypto with correct KDF/AEAD parameters.
- [ ] Implement login flow (`POST /auth` + `GET /auth/key-bundle` + client decrypt).
- [ ] Implement recovery flow (`GET /auth/key-bundle/recovery` + `POST /auth/reset-passphrase`).
- [ ] Encrypt patient E2E fields as ciphertext + IV pairs.
- [ ] Decrypt E2E response fields client-side.
- [ ] Keep `userKey` in memory only.
- [ ] Add UX for `429` and credential/decryption failures.

