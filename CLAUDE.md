# Working in CarCompare

Car comparison web app. Next.js 16 (App Router) + React 19 + TypeScript + Tailwind v4.
Static export deployed to GitHub Pages.

## Build and check
- Install:    npm ci
- Lint:       npm run lint        (ESLint 9 flat config)
- Typecheck:  npx tsc --noEmit
- Build:      npm run build       (Next static export to ./out)
- Dev:        npm run dev
- Data sync:  npm run sync-data   (scripts/sync-car-data.ts)

There is no unit-test suite. The verification signal is lint + typecheck + build passing.

## Code standards
- Do not touch unrelated files.
- Keep types in `src/types` authoritative; update them when data shape changes.
- The car dataset lives in `src/data/cars.json`. Treat it as data: validate before/after
  edits with the relevant `scripts/validate-cars.js` / `scripts/audit-database.js`.
- Explain any user-facing or data-schema change in the PR summary.

## Release and approval
Default branch is `master`. Pushing/merging to `master` triggers `.github/workflows/deploy.yml`
and ships to GitHub Pages, so a merged PR IS the production deploy.

## Repo map
- `src/app/`         Next App Router (layout.tsx, page.tsx, globals.css)
- `src/components/`  React UI (CarTable, CompareModal, FilterControls, SetupWizard, ...)
- `src/lib/`         utilities (carUtils, analytics, constants, useFocusTrap)
- `src/data/`        cars.json, the vehicle dataset
- `src/types/`       TypeScript types (car.ts)
- `scripts/`         data maintenance + sync (sync-car-data.ts, validate-cars.js, ...)
- `public/`          static assets
