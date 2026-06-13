# finAns-frontend

React SPA для личной финансовой админки finAns.

**Стек:** React 18, TypeScript, Vite, shadcn/ui, TanStack Query/Table.

Спеки: `.platform-link` → finAns-platform.

## Dev setup

```bash
cp .env.example .env
npm install
npm run dev
```

Откройте http://localhost:5173 — proxy `/api` → backend :8080.

## Scripts

```bash
npm run dev        # dev server
npm run build      # production build
npm run lint       # ESLint
npm run typecheck  # TypeScript
```

## Структура

```
src/
  app/           # router, providers
  components/    # layout, ui (shadcn)
  features/      # transactions, tags, ...
  lib/           # api-client, utils
```
