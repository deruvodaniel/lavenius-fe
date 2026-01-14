# Authentication Tasks

## Implementation
```typescript
// Use: authService for API calls
import { authService } from '@/lib/services';

// Use: useAuthStore for state
import { useAuthStore } from '@/lib/stores';

// Use: useAuth hook for components
import { useAuth } from '@/lib/hooks/useAuth';
```

## Login Flow
1. User submits credentials + passphrase
2. Call `authService.login()`
3. Service stores token (localStorage) + userKey (sessionStorage)
4. Store updates user state
5. Redirect to dashboard

## Protected Routes
```typescript
const isAuthenticated = useAuthStore(state => state.isAuthenticated);
if (!isAuthenticated) return <Navigate to="/login" />;
```

## Logout Flow
1. Call `authService.logout()`
2. Clear localStorage + sessionStorage
3. Reset store state
4. Redirect to login
