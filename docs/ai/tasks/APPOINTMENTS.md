# Appointment Management Tasks

## Implementation
```typescript
// Use: appointmentService for API calls
import { appointmentService } from '@/lib/services';

// Use: useAppointmentStore for state
import { useAppointmentStore } from '@/lib/stores';

// Use: useAppointments hook for components
import { useAppointments } from '@/lib/hooks/useAppointments';
```

## CRUD Operations
```typescript
const { appointments, loading, fetchUpcoming, createAppointment } = useAppointments();

// Fetch upcoming
await fetchUpcoming(30); // next 30 appointments

// Create
await createAppointment({
  patientId,
  dateTime: '2026-01-15T10:00:00Z',
  sessionType: 'INDIVIDUAL',
  status: 'SCHEDULED',
  cost: 100
});
```

## Selectors
```typescript
import { selectTodayAppointments } from '@/lib/stores';
const today = useAppointmentStore(selectTodayAppointments);
```
