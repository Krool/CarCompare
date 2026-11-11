# CarCompare

Side-by-side car comparison tool. Live at https://krool.github.io/CarCompare/

Next.js static export, deployed to GitHub Pages on every push to `master`.

## Getting Started

```bash
npm install
npm run dev            # dev server
npm run lint           # eslint
npx tsc --noEmit       # typecheck
npm run validate-data  # dataset checks
npm run build          # static export
```

Open [http://localhost:3000/CarCompare](http://localhost:3000/CarCompare) with your browser to see the result.
(`next.config.ts` sets `basePath: "/CarCompare"` for GitHub Pages, and it applies in dev too.)

You can start editing the page by modifying `src/app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to load Outfit (UI) and DM Mono (tabular data), both from Google Fonts.

## Car images

Vehicle renders come from [IMAGIN.studio](https://www.imagin.studio/), requested at
runtime by `getCarImageUrl` in `src/lib/carUtils.ts`.

By default the app requests them under IMAGIN's public demo account (`customer=img`),
which stamps a large "IMAGIN studio" watermark across the middle of every image. The
watermark is baked into the returned pixels — it is a property of the demo account, not
something the app can strip or crop around. The only way to remove it is to render under
a real IMAGIN account.

If you have an account key, set it at build time and no code change is needed:

```bash
NEXT_PUBLIC_IMAGIN_CUSTOMER=your-customer-key npm run build
```

For the GitHub Pages deploy, store the key as a repository secret named `IMAGIN_CUSTOMER`;
`.github/workflows/deploy.yml` already passes it through. With it unset, the build falls
back to the watermarked demo account.

> **This customer key is public, not secret.** The browser makes the IMAGIN request, so
> `NEXT_PUBLIC_*` values are inlined into the client bundle at build time and are readable
> in view-source on the deployed site. GitHub Actions will mask the value in build logs,
> which makes it *look* protected — it isn't. Treat it as a public identifier: assume
> anyone can render images against the account, and if IMAGIN supports origin or referrer
> locking, restrict the account to your Pages domain, since that is the only control that
> actually limits use.

## Deploying

Statically exported (`output: "export"` in `next.config.ts`) and shipped to GitHub Pages by
`.github/workflows/deploy.yml` on every push to `master` — a merged PR IS the production
deploy. `.github/workflows/pr-checks.yml` runs the same lint / typecheck / data-validation /
build gate on pull requests. See `CLAUDE.md`.
