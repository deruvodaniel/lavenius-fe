# Patient Management Tasks

## Implementation
```typescript
// Use: patientService for API calls
import { patientService } from '@/lib/services';

// Use: usePatientStore for state
import { usePatientStore } from '@/lib/stores';

// Use: usePatients hook for components
import { usePatients } from '@/lib/hooks/usePatients';
```

## CRUD Operations
```typescript
const { patients, loading, error, fetchPatients, createPatient, updatePatient, deletePatient } = usePatients();

// Fetch all
await fetchPatients();

// Create
await createPatient({ firstName, lastName, email, ... });

// Update
await updatePatient(id, { diagnosis: 'Updated' });

// Delete
await deletePatient(id);
```

## Search
```typescript
const results = usePatientStore(state => state.searchPatients('john'));
```

## Selectors
```typescript
import { selectActivePatients } from '@/lib/stores';
const activePatients = usePatientStore(selectActivePatients);
```
