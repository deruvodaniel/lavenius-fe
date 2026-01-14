# New Feature Workflow

## 1. Define Types
Add to `src/lib/types/api.types.ts`:
```typescript
export interface NewEntity {
  id: string;
  // fields...
}

export interface CreateNewEntityDto {
  // fields without id...
}
```

## 2. Create Service
`src/lib/services/new.service.ts`:
```typescript
import { apiClient } from '@/lib/api/client';
import type { NewEntity, CreateNewEntityDto } from '@/lib/types/api.types';

class NewService {
  async getAll(): Promise<NewEntity[]> {
    const response = await apiClient.get('/new-entities');
    return response.data;
  }
  
  async create(dto: CreateNewEntityDto): Promise<NewEntity> {
    const response = await apiClient.post('/new-entities', dto);
    return response.data;
  }
}

export const newService = new NewService();
```

## 3. Create Store
`src/lib/stores/new.store.ts`:
```typescript
import { create } from 'zustand';
import { newService } from '@/lib/services';

interface NewStore {
  entities: NewEntity[];
  isLoading: boolean;
  error: string | null;
  fetchEntities: () => Promise<void>;
  createEntity: (dto: CreateNewEntityDto) => Promise<void>;
}

export const useNewStore = create<NewStore>((set) => ({
  entities: [],
  isLoading: false,
  error: null,
  
  fetchEntities: async () => {
    set({ isLoading: true, error: null });
    try {
      const entities = await newService.getAll();
      set({ entities, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },
  
  createEntity: async (dto) => {
    set({ isLoading: true });
    const entity = await newService.create(dto);
    set(state => ({ entities: [...state.entities, entity], isLoading: false }));
  }
}));
```

## 4. Create Hook
`src/lib/hooks/useNew.ts`:
```typescript
import { useNewStore } from '@/lib/stores';

export const useNew = () => {
  const entities = useNewStore(state => state.entities);
  const loading = useNewStore(state => state.isLoading);
  const error = useNewStore(state => state.error);
  const fetchEntities = useNewStore(state => state.fetchEntities);
  const createEntity = useNewStore(state => state.createEntity);
  
  return { entities, loading, error, fetchEntities, createEntity };
};
```

## 5. Write Tests
`src/__tests__/services/new.service.test.ts`

## 6. Create Component
Use shadcn/ui, hook, and proper error handling

## 7. Commit Each Step
```bash
git commit -m "feat(new): add types"
git commit -m "feat(new): add service"
git commit -m "feat(new): add store"
git commit -m "feat(new): add hook"
git commit -m "feat(new): add tests"
git commit -m "feat(new): add component"
```
