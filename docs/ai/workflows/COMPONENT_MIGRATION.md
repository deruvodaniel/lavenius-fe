# Component Migration Workflow

## Step-by-step

### 1. Identify Component
- File: `src/components/[feature]/[Component].tsx`
- Current state: Direct API calls or old context usage

### 2. Replace Data Fetching
**Before:**
```typescript
const [data, setData] = useState([]);
useEffect(() => {
  fetch('/api/...').then(res => res.json()).then(setData);
}, []);
```

**After:**
```typescript
import { usePatients } from '@/lib/hooks/usePatients';
const { patients, loading, fetchPatients } = usePatients();
useEffect(() => { fetchPatients(); }, []);
```

### 3. Replace Form Submission
**Before:**
```typescript
const handleSubmit = async (data) => {
  await fetch('/api/...', { method: 'POST', body: JSON.stringify(data) });
};
```

**After:**
```typescript
const { createPatient } = usePatients();
const handleSubmit = async (data) => {
  await createPatient(data);
};
```

### 4. Update UI Components
- Replace any custom buttons/inputs with shadcn/ui
- Use Form component for forms
- Add loading states with Skeleton
- Add error handling with toast

### 5. Test
- Component renders
- Data fetches correctly
- Forms submit successfully
- Loading states work
- Errors display properly

### 6. Commit
```bash
git add src/components/[feature]/[Component].tsx
git commit -m "feat: migrate [Component] to new architecture"
```
