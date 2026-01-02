# UI Component Guidelines

## Design System: shadcn/ui
ALL UI components MUST use shadcn/ui. Never create custom buttons, inputs, dialogs, etc.

## Available Components
- Button, Input, Textarea, Select, Checkbox, Switch
- Dialog, Drawer, Sheet, Popover, Dropdown Menu
- Card, Table, Tabs, Accordion
- Form (with react-hook-form integration)
- Calendar, Date Picker
- Toast (sonner), Alert, Alert Dialog
- Badge, Avatar, Skeleton

## Usage Pattern
```typescript
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Form, FormField, FormItem, FormLabel } from '@/components/ui/form';

// shadcn variants for styling
<Button variant="default | destructive | outline | secondary | ghost | link">
<Input className="additional-tailwind-classes" />
```

## Forms
ALWAYS use shadcn Form + react-hook-form:
```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

const form = useForm({
  resolver: zodResolver(schema),
  defaultValues: { email: '', password: '' }
});

<Form {...form}>
  <FormField name="email" render={({ field }) => (
    <FormItem>
      <FormLabel>Email</FormLabel>
      <Input {...field} />
    </FormItem>
  )} />
</Form>
```

## Theming
Components are theme-agnostic. Use Tailwind classes for spacing/layout, shadcn for components.
NEVER hardcode colors - use theme variables (bg-background, text-foreground, etc.)
