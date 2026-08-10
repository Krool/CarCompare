This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

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

For the GitHub Pages deploy, add the key as a repository secret named `IMAGIN_CUSTOMER`;
`.github/workflows/deploy.yml` already passes it through. With the secret unset the build
falls back to the watermarked demo account.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
