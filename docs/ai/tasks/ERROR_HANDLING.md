# Error Handling Tasks

## Error Boundary
```typescript
// Wrap app with ErrorBoundary
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

## API Errors
All services throw `ApiClientError`:
```typescript
import { ApiClientError } from '@/lib/api/client';

try {
  await patientService.create(data);
} catch (error) {
  if (error instanceof ApiClientError) {
    // error.statusCode: 401, 403, 404, 409, 422
    // error.message: Human-readable
    // error.error: API error code
  }
}
```

## Store Errors
All stores have error state:
```typescript
const { error, clearError } = usePatientStore();

useEffect(() => {
  if (error) {
    toast.error(error);
    clearError();
  }
}, [error]);
```

## Auto-logout on 401
ApiClient automatically logs out on 401 responses.
