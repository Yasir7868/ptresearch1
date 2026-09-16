# This is NOT the Next.js you know

This is Next.js 16 — breaking changes vs training data. Read the relevant
guide in `node_modules/next/dist/docs/` before writing any code. Highlights:

- `params` / `searchParams` are **Promises** — `await` them (or `use()`).
- `middleware.ts` is now `proxy.ts`.
- `next lint` is removed — `npm run lint` runs the ESLint CLI (flat config in
  `eslint.config.mjs`).
- Turbopack is the default bundler.
- `images.domains` is dead; `remotePatterns` configured in `next.config.ts`
  for `https://ptresearch.shop/**`.
- Parallel routes require explicit `default.js`.

## Repo rules

- Read `PRODUCT.md` (hard rules — GLP display-name coding, contacts, copy)
  and `DESIGN.md` (D3 "Reference Grade" spec — warm bottle-green printed
  reference catalog) before building pages.
- Palette changes go in `content/brand-config.ts`, then `npm run gen:theme` —
  never hand-edit the generated block in `app/globals.css`.
- Verify with `npm run typecheck && npm run build` before handing off.
- The orchestrator owns git — do not commit or push.
