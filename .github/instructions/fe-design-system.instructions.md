---
applyTo: "**/*.tsx,**/*.ts,**/*.css"
description: "TerappIA frontend design system rules. Apply when writing or reviewing any component, style, or theme change. Covers token usage, typography, color system, dark mode, and shadcn/ui conventions."
---

# TerappIA Frontend Design System

## Principio Core

**Nunca usar colores hardcodeados.** Todo color, fondo, borde y tipografía debe ir a través de un token CSS definido en `src/index.css` y mapeado en `tailwind.config.js`.

---

## Sistema de Tokens (CSS Variables)

Definidos en `src/index.css` bajo `:root` (light) y `.dark`.

### Paleta principal

| Token Tailwind | Variable CSS | Uso |
|---|---|---|
| `bg-background` | `--background` | Fondo de página |
| `text-foreground` | `--foreground` | Texto principal |
| `bg-card` | `--card` | Fondo de cards |
| `text-card-foreground` | `--card-foreground` | Texto en cards |
| `bg-primary` | `--primary` | Botones primarios, acciones principales |
| `text-primary-foreground` | `--primary-foreground` | Texto sobre primario |
| `bg-primary-light` | `--primary-light` | Superficies suaves con tono primario |
| `bg-primary-muted` | `--primary-muted` | Fondo hover/secciones secundarias |
| `text-primary-hover` | `--primary-hover` | Color primary en estado hover |
| `bg-primary-deep` | `--primary-deep` | Sidebar, headers oscuros |
| `bg-secondary` | `--secondary` | Acciones secundarias |
| `bg-muted` | `--muted` | Fondos de inputs, zonas inactivas |
| `text-muted-foreground` | `--muted-foreground` | Texto secundario, placeholders |
| `bg-accent` | `--accent` | Accent oliva/sage (highlights, badges) |
| `text-accent-foreground` | `--accent-foreground` | Texto sobre accent |
| `bg-accent-light` | `--accent-light` | Versión suave del accent |
| `border-border` | `--border` | Bordes, separadores |
| `bg-input-background` | `--input-background` | Fondo de inputs en dark mode |
| `bg-destructive` | `--destructive` | Acciones de borrado/error |
| `bg-popover` | `--popover` | Fondo de popovers, dropdowns |

### Valores actuales (referencia — cambiar SOLO en `index.css`)

Paleta **"Clay & Sage"** — humanista terrosa, profesional y cálida.

**Light mode:**
- Primary: `#B8553A` (clay/terracotta)
- Accent: `#5C6B3A` (olive/sage)
- Background: `#FAF6F0` (warm sand)
- Foreground: `#2A211B` (warm near-black)

**Dark mode:**
- Primary: `#E08363` (clay brillante)
- Accent: `#A4B57A` (sage brillante)
- Background: `#1B1714` (warm coffee-black)
- Foreground: `#F0E8DC` (warm cream)

---

## Cómo cambiar colores o tipografía

Para cambiar la paleta **completa** de la app, solo modificar los valores de `src/index.css`:
- `:root { }` para light mode
- `.dark { }` para dark mode

Nunca tocar los nombres de las variables — solo sus valores hex.

Para cambiar **tipografía global**, modificar la propiedad `font-family` en el `body` de `src/index.css`.

---

## Reglas de Implementación

### ✅ Correcto

```tsx
// Usar tokens Tailwind mapeados a CSS variables
<div className="bg-background text-foreground">
<button className="bg-primary text-primary-foreground hover:bg-primary-hover">
<span className="text-muted-foreground">
<div className="border border-border bg-card">
<div className="bg-primary-light"> {/* superficie suave */}
```

### ❌ Incorrecto — hardcoded

```tsx
// NUNCA usar colores hardcodeados en Tailwind
<div className="bg-indigo-600">         // ❌
<div className="text-gray-500">         // ❌
<div className="bg-purple-50">          // ❌
<div className="border-indigo-100">     // ❌
<div style={{ color: '#2D0051' }}>     // ❌
```

---

## shadcn/ui

- **NUNCA** modificar archivos en `src/components/ui/` — son primitivos de shadcn.
- Extender via `className` en el lugar de uso.
- Usar `cn()` de `@/lib/utils` para combinar clases condicionalmente.

```tsx
// ✅ Extender shadcn sin tocar el primitivo
<Button className="bg-primary hover:bg-primary-hover text-primary-foreground">

// ✅ cn() para condicionales
<Card className={cn("bg-card border-border", isActive && "bg-primary-light")}>
```

---

## Dark Mode

- Dark mode se activa via clase `.dark` en el `<html>` (gestionado por `next-themes`).
- **Nunca** usar `dark:bg-indigo-*` o similares hardcodeados — los tokens ya manejan ambos modos.
- Los componentes son automáticamente dark-mode-aware si usan solo tokens.

```tsx
// ✅ Automáticamente dark-mode-aware
<div className="bg-background text-foreground">

// ❌ Dark mode hardcodeado — no usar
<div className="bg-white dark:bg-gray-900">
```

---

## Tipografía

- **Fuente base: Inter** (Google Fonts, cargada via `<link>` en `index.html`).
- Stack completo: `'Inter', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif` (fallback nativo si la fuente no carga).
- `font-variant-numeric: tabular-nums` aplicado globalmente — ideal para tablas, horarios, importes.
- `font-feature-settings: 'cv11', 'ss01', 'ss03'` — variantes legibles de `1`, `a` y `g`.
- Pesos disponibles: 400 (regular), 500 (medium), 600 (semibold), 700 (bold), 800 (extrabold).
- Tamaños via utilidades Tailwind (`text-sm`, `text-base`, `text-lg`, etc.).
- Para cambiar la fuente global: modificar `<link>` en `index.html` + `font-family` en `body` de `index.css` + `fontFamily.sans` en `tailwind.config.js`.

---

## Radius y Bordes

| Tailwind | Variable | Valor base |
|---|---|---|
| `rounded-lg` | `--radius` | `0.75rem` (12px) |
| `rounded-md` | `calc(--radius - 2px)` | `0.625rem` (10px) |
| `rounded-sm` | `calc(--radius - 4px)` | `0.5rem` (8px) |

Para cambiar el radio global: modificar `--radius` en `src/index.css`.

---

## Chart Colors

Usar `bg-chart-1` … `bg-chart-5` para gráficos. No usar colores ad-hoc en Recharts/Tremor.

---

## Audit Checklist

Al revisar un componente, verificar:

- [ ] Sin colores hardcodeados (`indigo-*`, `gray-*`, `purple-*`, `#hex`)
- [ ] Sin `dark:` con valores hardcodeados
- [ ] Sin modificaciones a `src/components/ui/`
- [ ] Inputs usan `bg-input` / `bg-input-background`
- [ ] Cards usan `bg-card` / `border-border`
- [ ] Acciones primarias usan `bg-primary hover:bg-primary-hover`
- [ ] Textos secundarios usan `text-muted-foreground`
- [ ] Superficies suaves usan `bg-primary-light` o `bg-primary-muted`
