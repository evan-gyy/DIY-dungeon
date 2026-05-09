# AGENTS.md

## Cursor Cloud specific instructions

This is a **purely client-side Vite + TypeScript browser game** (武林传说 / WuxiaDungeon). There is no backend, no database, no Docker, and no environment variables.

### Services

| Service | Command | URL |
|---------|---------|-----|
| Vite Dev Server | `npm run dev` | `http://localhost:5173` |

### Useful commands

- **Install dependencies:** `npm install`
- **Dev server:** `npm run dev` (starts Vite with HMR at port 5173)
- **Type check:** `npx tsc --noEmit`
- **Production build:** `npm run build` (runs `tsc && vite build`, output in `dist/`)
- **Preview production build:** `npm run preview`

### Notes

- There are **no automated tests** in this project (no test framework configured).
- There is **no linter** configured (no ESLint/Prettier). Type checking via `tsc --noEmit` is the closest equivalent.
- The game state is stored in browser `localStorage`. To reset, clear localStorage for `localhost:5173`.
- Static assets (portraits, CGs, music) are served from the `public/` directory.
- The project uses path aliases: `@/*` maps to `src/*` (configured in `tsconfig.json` and resolved by Vite).
