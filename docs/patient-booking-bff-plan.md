# Patient Booking BFF Plan (V1 MVP)

Audience: Backend + Frontend teams.  
Objective: allow patients to see therapist availability and book sessions with minimal MVP scope.

Related:
- `docs/e2e-encryption-plan.md`
- `docs/e2e-frontend-react-spec.md`
- `docs/rate-limiting-v2-plan.md`

---

## 1) MVP Scope

### In scope
1. Patient can view therapist availability by range (default current week).
2. Patient can create a booking request.
3. Booking request is stored as a normal session with:
   - `status = pending_approval`
   - `createdBy = patient`
4. Therapist can later manage it via existing session update flow.
5. Double-booking must remain blocked.
6. Therapist is notified via Google Calendar invite email on new booking request.
7. WhatsApp notification for therapist is deferred to future implementation (out of MVP).
8. Patient users use Clerk auth but do not enter therapist onboarding/dashboard flow.

### Out of scope (V1)
1. Dedicated patient app modules/roles beyond Clerk-authenticated booking.
2. Separate `approvalStatus` field.
3. `approvedAt` tracking.
4. Dedicated pending queue APIs (`GET pending`, `PATCH approve/reject`).
5. Captcha.
6. In-app notifications for patients.

---

## 2) Data Model Changes

## Sessions table
1. Extend `status` enum with:
   - `pending_approval`
2. Add `created_by` column:
   - enum/string values: `therapist | patient`
   - default: `therapist` (backward compatibility)

Notes:
- Keep existing `status` lifecycle and reuse it.
- No extra approval table/fields in MVP.

---

## 3) API Design (MVP)

## 3.1 Availability API
`GET /public/therapists/:therapistId/availability?from=ISO&to=ISO`

Auth:
1. Clerk JWT required.
2. Use `ClerkAuthGuard` only for these public booking endpoints (do not use therapist `AuthGuard`).

Behavior:
1. If `from/to` are missing, use current week in therapist timezone.
2. Return only available slots.
3. Exclude occupied slots from active sessions.
4. Compute slots from therapist booking settings JSON:
   - working days (e.g., Monday-Sunday flags)
   - working window (`fromHour`, `toHour`)
   - default session duration in minutes
5. Respect `DAY_OFF` settings and block those dates.

Response example:
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

## 3.2 Booking API
`POST /public/therapists/:therapistId/bookings`

Auth:
1. Clerk JWT required.
2. No captcha in MVP.

Request (proposed):
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
Note:
1. Patient request must not include `amount`/`cost`.
2. Backend computes it from therapist setting `defaultSessionAmount`.

Creation rules:
1. Session created with:
   - `status = pending_approval`
   - `createdBy = patient`
2. Cost is not required from patient flow.
3. Validate no overlap and return `409` on conflict.
4. Use dedicated booking method in session service (do not expose therapist create directly).
5. If `bookingMessage` is provided, map it into session `summary` so therapist can review context.
6. Patient association:
   - try existing patient by `(therapistId + normalized phone)`
   - fallback to `(therapistId + email)` when phone is absent
   - create patient if no match is found
7. Session amount:
   - backend sets session `amount/cost` from therapist booking settings default value
   - if therapist default value is empty/null, keep session amount null and allow therapist to set later
8. Any client-provided `amount`/`cost` in booking payload should be ignored (or rejected by DTO contract).

Response (example):
```json
{
  "id": "session-uuid",
  "status": "pending_approval",
  "createdBy": "patient"
}
```

---

## 4) Service Design

Recommended method split:
1. `SessionService.createByTherapist(...)`
2. `SessionService.createByPatientBooking(...)`

Reason:
1. Keeps actor-specific business rules explicit.
2. Avoids mixing therapist-only and patient-only validations.
3. Easier auditing and future extension.

---

## 5) Notifications (MVP)

Channel:
1. Google Calendar invite email to therapist (primary channel).
2. WhatsApp notification for therapist is planned for future iteration (v1.1+), not MVP.

Flow:
1. On new patient booking (`pending_approval`):
   - create Google Calendar event with `status = tentative`.
   - include therapist email in attendees.
   - send updates with `sendUpdates = all` so therapist receives email notification.
2. Patient-side notifications for date/time changes:
   - already covered by existing reminder update flow.
3. No dedicated cost notification.

Implementation note:
1. Keep this notification path tied to booking event creation only.
2. Future-proof idea: event-based notification layer + multi-channel routing (optional V1.1+).
3. Future channel candidate: WhatsApp therapist alert on booking create/update.

---

## 6) Patient Identity and Contact

MVP decision:
1. Patient authenticates via Clerk.
2. `patientPhone` should be required in booking/registration flow.
3. FE must let user choose account type at signup (`therapist` | `patient`):
   - therapist: current onboarding flow
   - patient: skip therapist onboarding/dashboard
4. Patient access to therapist booking page is link-based only (public therapist page URL), not via global dashboard navigation.

Rationale:
1. Enables WhatsApp notifications.
2. Useful for therapist contact when needed.

V1.1:
1. Add dedicated patient-user table/profile model (`patient_user` or similar) and link it to patient records.

---

## 7) Security and Rate Limiting

Add policies in V2 matrix:
1. `public.availability`
   - per IP: `120/min`
   - fail-open
2. `public.booking`
   - per IP: `5/min`
   - per therapistId: `20/min`
   - per patient externalId: `3/min`
   - fail-open (or fail-closed if abuse observed)

Rationale:
1. Booking is a high-impact mutation endpoint; normal users should not submit many times per minute.
2. Lower thresholds reduce slot-grabbing bots and spam retries while allowing normal correction attempts.
3. Combining IP + therapist + patient scopes avoids over-blocking shared networks and improves abuse detection.

General:
1. Keep `429` + `Retry-After`.
2. Keep raw IP out of logs (hash only).

---

## 8) Audit Logging

Track booking actions:
1. `session.booking.create` (actor: patient)
2. Therapist edits are tracked under existing normal session update audit action (no separate `session.booking.update` action).

Avoid PHI in audit fields.

---

## 9) Error Contract

Expected:
1. `400` invalid payload.
2. `401` unauthenticated patient.
3. `403` forbidden access.
4. `404` therapist not found/publicly bookable.
5. `409` slot conflict (double booking/race).
6. `429` rate limit exceeded.
7. `5xx` unexpected backend error.

---

## 10) Testing Plan

## Unit
1. Availability slot calculation includes/excludes occupied ranges.
2. Booking creation sets `status=pending_approval` and `createdBy=patient`.
3. Conflict detection returns `409`.

## Integration/E2E
1. `GET availability` default-week behavior.
2. `POST booking` success path.
3. `POST booking` conflict path.
4. Rate-limit behavior for both endpoints.
5. Google invite email trigger on booking creation (`sendUpdates=all` + therapist attendee).
6. Availability respects configured work days/hours + default duration from settings JSON.

---

## 11) Rollout Plan

1. Migration:
   - add `created_by` column
   - add `pending_approval` enum value
2. Deploy BE with feature flag for public booking endpoints (recommended).
3. Enable in staging with FE integration.
4. Monitor:
   - booking volume
   - conflict rates
   - 429 rates
   - Google Calendar invite creation/delivery failures
5. Enable in production.

---

## 12) Open Questions (Must Be Resolved Before Implementation)
Resolved for V1:
1. Therapist is identified by `:therapistId` (slug deferred to V2).
2. Availability is generated from therapist settings JSON (work days + from/to hours), not fixed hardcoded hours.
3. Duration comes from therapist settings JSON (`defaultSessionDurationMinutes`).
4. Booking flow upserts patient by therapist + contact match, creating patient when no match exists.
5. `bookingMessage` is accepted and mapped to session `summary`.

Pending before implementation start:
1. Confirm exact settings key names in backend config payload:
   - `bookingWorkingDays`
   - `bookingWorkingHoursFrom`
   - `bookingWorkingHoursTo`
   - `defaultSessionDurationMinutes`
2. Confirm validation bounds for custom duration (recommended: `15..180` minutes).
3. Confirm settings key name for default session amount (recommended: `defaultSessionAmount`).
