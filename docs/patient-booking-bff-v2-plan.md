# Patient Booking BFF Plan (V2 / Enhancements)

Audience: Backend + Frontend teams.  
Objective: extend V1 patient booking with stronger identity modeling, better therapist tooling, and richer notification channels.

Related:
- `docs/patient-booking-bff-plan.md` (V1 baseline)

---

## 1) Candidate V2 Scope

1. Public therapist identifier via slug instead of raw `therapistId`.
2. Dedicated patient identity model (`patient_user`) linked to booking actor.
3. Booking management endpoints for therapist:
   - list pending bookings
   - explicit approve/reject actions
4. Multi-channel notifications:
   - keep Google invite email
   - optional WhatsApp alert to therapist on new booking
5. Optional anti-abuse enhancements:
   - CAPTCHA or challenge step
   - stronger per-device throttling signals

---

## 2) Data Model Enhancements

1. `patient_user` (or equivalent) table:
   - `id`
   - `clerkExternalId`
   - `email`
   - optional profile fields
2. Session booking audit enrichment:
   - maintain `createdBy`
   - optionally add `createdByPatientUserId`
3. Optional therapist public profile fields:
   - `publicSlug`
   - `isPublicBookable`

---

## 3) API Enhancements

1. Replace routes to public slug style:
   - `GET /public/therapists/:slug/availability`
   - `POST /public/therapists/:slug/bookings`
2. Add therapist booking queue endpoints:
   - `GET /therapists/bookings/pending`
   - `PATCH /therapists/bookings/:sessionId/approve`
   - `PATCH /therapists/bookings/:sessionId/reject`
3. Add FE-facing status contract for booking lifecycle if needed.

---

## 4) Notification Enhancements

1. Event-based notification routing abstraction.
2. Channel selection by event type:
   - booking created
   - booking approved/rejected
   - booking rescheduled
3. Optional WhatsApp therapist notifications with cost controls and opt-in.

---

## 5) Out of Scope for V2 (for now)

1. Full patient portal domain module split.
2. Billing/paywall logic for booking channels.
3. Advanced calendar marketplace integrations beyond Google.
