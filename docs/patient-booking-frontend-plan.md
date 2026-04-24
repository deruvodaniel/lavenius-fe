# Patient Booking Frontend Plan (V1)

Audience: Frontend team (therapist app + patient booking flow).  
Goal: deliver a minimal booking experience where patients can see therapist availability and request sessions.

Related:
- `docs/patient-booking-bff-plan.md`
- `docs/patient-booking-bff-v2-plan.md`

---

## 1) V1 Scope for FE

1. Public booking flow for authenticated patient (Clerk JWT).
2. Availability UI based on backend-computed slots.
3. Booking request creation with `pending_approval`.
4. Therapist view can detect pending sessions through session status.
5. Signup starts with account type selection (`therapist` vs `patient`).
6. `accountType` source of truth is Clerk metadata (chosen at signup).

Out of scope (V1):
1. Therapist pending queue screen/API.
2. Approve/reject dedicated actions.
3. WhatsApp notifications for therapist.
4. Public slug URLs (use `therapistId` for now).

---

## 2) FE User Flows

## 2.0 Account Type Selection (Signup)
1. After Clerk signup/login, FE asks account type:
   - `therapist`
   - `patient`
2. FE persists this selection in Clerk metadata:
   - `user.unsafeMetadata.accountType = "therapist" | "patient"`
2. If `therapist`:
   - keep current onboarding and redirect behavior (dashboard).
3. If `patient`:
   - skip therapist onboarding.
   - do not redirect to `/dashboard`.
   - patient should remain in public routes only.
   - patient should access booking only through therapist exact public URL.

## 2.1 Therapist Configuration Flow
1. Therapist configures booking availability in settings:
   - work days (Mon-Sun toggles)
   - attention window (`from` / `to`)
   - default session duration (minutes)
   - default session amount (currency amount)
2. FE sends this config via existing settings APIs (JSON config).
3. FE reflects current saved values when therapist returns to settings screen.

## 2.2 Patient Booking Flow
1. Patient authenticates with Clerk.
2. FE loads availability:
   - `GET /public/therapists/:therapistId/availability`
3. Patient selects slot and submits booking:
   - `POST /public/therapists/:therapistId/bookings`
4. FE shows confirmation:
   - booking status = `pending_approval`
5. Therapist later sees session in normal session views (status filter/indicator).

## 2.3 Routing Rules from Clerk Metadata
1. FE must read `user.unsafeMetadata.accountType` as source of truth for route decisions.
2. `therapist`:
   - keep current onboarding/dashboard flow.
3. `patient`:
   - do not redirect to therapist onboarding or dashboard.
   - stay in public pages and booking URLs only.

---

## 3) API Contract (FE-side)

## 3.1 Availability
`GET /public/therapists/:therapistId/availability?from=ISO&to=ISO`

Headers:
1. `Authorization: Bearer <clerk-jwt>`

Response:
```json
{
  "therapistId": "uuid",
  "from": "2026-03-16T00:00:00-03:00",
  "to": "2026-03-22T23:59:59-03:00",
  "timezone": "America/Argentina/Buenos_Aires",
  "slots": [
    {
      "from": "2026-03-17T10:00:00-03:00",
      "to": "2026-03-17T10:45:00-03:00"
    }
  ]
}
```

## 3.2 Booking Create
`POST /public/therapists/:therapistId/bookings`

Headers:
1. `Authorization: Bearer <clerk-jwt>`
2. `Content-Type: application/json`

Request:
```json
{
  "scheduledFrom": "2026-03-17T10:00:00-03:00",
  "scheduledTo": "2026-03-17T10:45:00-03:00",
  "sessionType": "remote",
  "patientEmail": "patient@email.com",
  "patientFirstName": "Juan",
  "patientPhone": "1155556677",
  "bookingMessage": "optional"
}
```
Important:
1. FE must not send `amount` or `cost` in this payload for patient booking flow.
2. Backend derives session amount from therapist setting `defaultSessionAmount`.
3. `sessionType` values remain the same as existing flow: `remote | presential`.
4. `bookingMessage` max length: `500` characters.

Response:
```json
{
  "id": "session-uuid",
  "status": "pending_approval",
  "createdBy": "patient"
}
```

---

## 4) FE UX / Validation Rules

1. Require patient first name, email, and phone in booking form.
2. Disallow submission if slot is in the past.
3. Lock slot selector while submit is in progress.
4. On `409`, show friendly conflict message and prompt slot refresh.
5. On `429`, show retry message and respect `Retry-After` when present.
6. Display pending badge/status in therapist session UI (`pending_approval`).
7. Show all times in `America/Argentina/Buenos_Aires` for V1.
8. Validate `bookingMessage` length <= 500.

---

## 5) FE Settings Contract Proposal (for alignment)

Suggested JSON keys in therapist settings config:
```json
{
  "bookingWorkingDays": {
    "monday": true,
    "tuesday": true,
    "wednesday": true,
    "thursday": true,
    "friday": true,
    "saturday": false,
    "sunday": false
  },
  "bookingWorkingHoursFrom": "09:00",
  "bookingWorkingHoursTo": "18:00",
  "defaultSessionDurationMinutes": 60,
  "defaultSessionAmount": 5000
}
```

Recommended FE validation:
1. `bookingWorkingHoursFrom < bookingWorkingHoursTo`
2. `defaultSessionDurationMinutes` in range `15..180`
3. At least one working day selected
4. `defaultSessionAmount`:
   - allow empty/null
   - if present, must be positive number with max precision/scale aligned to BE money fields

---

## 6) Error Handling Matrix

1. `400`: invalid payload or invalid date/time range.
2. `401`: missing/invalid Clerk JWT.
3. `403`: authenticated user without permission for the requested booking action/view.
4. `404`: therapist unavailable/not found/public booking disabled.
5. `409`: slot conflict; refresh availability and retry.
6. `429`: throttled; show cooldown UX; `Retry-After` is provided in seconds (integer).
7. `5xx`: generic backend error; show retry option.

---

## 7) FE QA Checklist

1. Therapist can configure work days/hours and default duration.
2. Availability screen renders returned slots correctly.
3. Booking submit returns and displays `pending_approval`.
4. Therapist sees booked session with pending status.
5. Conflict path (`409`) handled with proper UX.
6. Rate-limit path (`429`) handled with cooldown message.
7. Google invite expectation documented (therapist receives email from booking event).

---

## 8) Handoff Notes

1. Use `therapistId` routing in V1.
2. Keep code modular so slug routing can replace it in V2.
3. Keep booking actor abstraction in FE model (`createdBy`) for future patient-user expansion.
4. V2 items are tracked in `docs/patient-booking-bff-v2-plan.md`.
5. Booking-created session amount should be backend-populated from therapist settings default amount, not trusted from patient client payload.
