
# Lavenius Frontend

Aplicación frontend de Lavenius (React + Vite + TypeScript).

## Desarrollo local

```bash
npm install
npm run dev
```

Servidor local por defecto: `http://localhost:5173`.

## Scripts principales

```bash
npm run dev
npm run type-check
npm run lint
npm run test -- --run
npm run build
```

## Deploy a produccion (Vercel)

El frontend deploya directamente en Vercel y existen dos ambientes productivos separados por rama:

| Proyecto Vercel | Dominio | Rama productiva |
|---|---|---|
| `lavenius-fe` | `www.terapp-ia.com` | `terappia` |
| `somostilia` | `www.somostilia.com` | `main` |

Al mergear en la rama productiva correspondiente, Vercel ejecuta el deploy automaticamente.

## Politica de ramas para releases

- Siempre pushear primero a `tilia`.
- Los PR siempre deben apuntar a `tilia`.
- Nunca abrir PR directo a `main`.
- `main` se considera rama de produccion y solo se actualiza por promocion aprobada.

## Configuracion de Vercel

La configuración de salida está en `vercel.json`:

- `outputDirectory`: `build`
- Reescritura SPA para rutas cliente hacia `index.html`

## Documentacion adicional

Para el proceso completo de release, smoke tests y rollback ver:

- `../docs/FRONTEND_PRODUCTION_DEPLOY.md`
  