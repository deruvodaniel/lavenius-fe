# Lavenius Frontend Guidelines

> Última actualización: Febrero 14, 2026

## General Guidelines

* Only use absolute positioning when necessary. Opt for responsive and well structured layouts that use flexbox and grid by default
* Refactor code as you go to keep code clean
* Keep file sizes small (<200 lines) and put helper functions and components in their own files
* Use existing UI components (`Input`, `Button`, `Card`) from shadcn/ui - NEVER edit files in components/ui/
* All changes must be frontend only - no backend changes allowed
* Follow DRY/KISS principles
* TypeScript strict mode - no `any`, no implicit any

## Design System Guidelines

### Colors (Minimalistas)
- **Icons only** should have color (e.g., `text-red-500`, `text-indigo-600`)
- **Text** in gray tones (`text-gray-900`, `text-gray-500`, `text-gray-400`)
- **Backgrounds** neutral or white (`bg-white`, `bg-gray-50`)
- **Badges** with soft colors (`bg-red-100 text-red-800`, `bg-green-100 text-green-800`)
- **Primary actions** use indigo (`bg-indigo-600 hover:bg-indigo-700`)

### Card Components
All Card components MUST have `bg-white` for visual consistency:

```tsx
// ✅ Correct
<Card className="p-4 bg-white">
  {/* content */}
</Card>

// ✅ With left border accent
<Card className="p-4 bg-white border-l-4 border-l-indigo-500">
  {/* content */}
</Card>

// ❌ Incorrect - missing bg-white
<Card className="p-4">
  {/* content */}
</Card>
```

### Container Components
Main containers should have consistent styling:

```tsx
// ✅ Standard container
<div className="bg-white rounded-lg shadow-sm border border-gray-200">
  {/* content */}
</div>

// ✅ With overflow control
<div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
  {/* content */}
</div>
```

### ConfigSection Pattern
For configuration cards, use this pattern:

```tsx
const ConfigSection = ({ title, description, icon: Icon, children, iconColor }) => (
  <Card className="p-6 bg-white">
    <div className="flex items-start gap-4">
      <div className="p-2 bg-gray-100 rounded-lg">
        <Icon className={`h-5 w-5 ${iconColor || 'text-gray-600'}`} />
      </div>
      <div className="flex-1">
        <h3 className="font-medium text-gray-900">{title}</h3>
        <p className="text-sm text-gray-500 mt-1">{description}</p>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  </Card>
);
```

### Empty States
Use the shared EmptyState component:

```tsx
<EmptyState
  icon={SearchIcon}
  title="No results found"
  description="Try adjusting your search criteria"
  action={{ label: "Clear filters", onClick: handleClear }}
/>
```

### Loading States
Use SkeletonCard/SkeletonList for loading:

```tsx
{isLoading ? (
  <SkeletonList items={5} />
) : (
  <ActualContent />
)}
```

### "Coming Soon" Overlay
For features not yet implemented:

```tsx
<div className="relative">
  {/* Feature content */}
  <div className="absolute inset-0 bg-white/80 backdrop-blur-[1px] flex items-center justify-center rounded-lg">
    <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
      PRÓXIMAMENTE
    </span>
  </div>
</div>
```

## Component Patterns

### Sorting Controls
```tsx
<select
  value={sortBy}
  onChange={(e) => onSortChange(e.target.value)}
  className="h-10 pl-8 pr-3 text-sm border border-gray-200 rounded-md bg-white"
>
  <option value="date-desc">Más reciente</option>
  <option value="date-asc">Más antiguo</option>
  <option value="name-asc">A-Z</option>
  <option value="name-desc">Z-A</option>
</select>
```

### View Toggle (List/Table)
```tsx
<div className="flex border border-gray-200 rounded-md overflow-hidden">
  <button
    onClick={() => setViewMode('cards')}
    className={`p-2 ${viewMode === 'cards' ? 'bg-indigo-50 text-indigo-600' : 'bg-white text-gray-500'}`}
  >
    <LayoutGrid className="h-4 w-4" />
  </button>
  <button
    onClick={() => setViewMode('table')}
    className={`p-2 ${viewMode === 'table' ? 'bg-indigo-50 text-indigo-600' : 'bg-white text-gray-500'}`}
  >
    <List className="h-4 w-4" />
  </button>
</div>
```

## File Structure

```
src/
├── components/
│   ├── ui/              # shadcn (DO NOT EDIT)
│   ├── shared/          # EmptyState, Skeleton, NotFound
│   ├── agenda/          # Agenda, FullCalendarView, TurnoDrawer
│   ├── cobros/          # Cobros, PaymentStats, PaymentDrawer
│   ├── config/          # Configuracion, CalendarSync
│   ├── pacientes/       # Pacientes, PacienteDrawer
│   ├── perfil/          # Perfil (user profile)
│   └── layout/          # Sidebar, Header
├── lib/
│   ├── hooks/           # useAuth, usePatients, useSessions, usePayments
│   ├── stores/          # Zustand stores
│   └── types/           # TypeScript types
```

## Git Commit Style

```bash
# Feature
feat(ui): add user profile section with sidebar navigation

# Fix
fix(calendar): add null checks for resize errors

# Style/UI
style(cards): add bg-white for visual consistency

# Refactor
refactor(config): reorganize días off section
```
