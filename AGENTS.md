# finAns-frontend / AGENTS.md

React SPA (Vite + TypeScript + shadcn/ui). Спеки: `.platform-link` → finAns-platform.

> Единый файл инструкций для AI в этом репо — `AGENTS.md`.

## Контекст: связь с платформой

- OpenSpec changes: `finAns-platform/openspec/changes/`
- OpenSpec specs: `finAns-platform/openspec/specs/`

## Локальные правила

```bash
npm run dev
npm run lint && npm run typecheck && npm run build
```

- API: `src/lib/api-client.ts`, base URL `VITE_API_URL`
- UI: shadcn в `src/components/ui/`
- Features: `src/features/<name>/pages/`
