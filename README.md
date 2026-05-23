# Alma Gov — עלמה גוב

Official website for Alma Gov, Israeli singer-songwriter.

## Stack

- **Framework:** Next.js 16 (App Router) + TypeScript (strict)
- **Styling:** Tailwind CSS v4, configured for RTL
- **CMS:** Custom admin panel at `/admin` — NextAuth v5 auth, Vercel KV storage
  (local dev falls back to `data/content.json`). See `lib/admin-store.ts` and
  the admin routes under `app/admin/`.
- **Fonts:** Heebo (body), Playpen Sans (display fallback — swap for Gveret Levin)
- **Animations:** Framer Motion
- **Contact form:** Self-hosted — server action writes to KV; messages inbox at `/admin/messages`
- **Hosting:** Vercel

## Setup

```bash
npm install
cp .env.example .env.local
# Fill in env vars (see below)
npm run dev
```

## Environment Variables

See `.env.example` for the full list. The essentials:

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | Public site URL (used by sitemap + OG metadata base URL) |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD_HASH` / `AUTH_SECRET` | Admin panel credentials (generate with `npm run admin:password`) |
| `KV_*` (rest API URL + tokens) | Vercel KV — production content storage. Leave blank for local dev (falls back to `data/content.json`). |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob — production image upload storage. Leave blank for local dev. |

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | TypeScript type check |
| `npm run format` | Format with Prettier |
| `npm run admin:password` | Generate a bcrypt hash + AUTH_SECRET for the admin panel |

## Fonts

The display font slot (`--font-handwritten`) currently uses **Playpen Sans** (Google Fonts) as a fallback.
The recommended primary font is **Gveret Levin** (free, OFL) from [AlefAlefAlef](https://github.com/AlefAlefAlef/gveret-levin).

To swap in the handwritten font:

1. Download `GveretLevin-Regular.woff2` from the GitHub repo
2. Place it at `/public/fonts/handwritten-heb.woff2`
3. Update `app/layout.tsx` — swap the `Playpen_Sans` import for `next/font/local` (instructions in the file)

## Project Structure

```
app/
  [locale]/(site)/ # Public-facing pages (home, diary, music, shows, gallery, about, contact)
  admin/           # Custom admin panel (NextAuth-gated)
  api/             # API routes (admin, auth, etc.)
components/
  ui/              # Reusable UI (Button, PolaroidFrame, TicketStub, etc.)
  decorative/      # SVG doodles (Heart, Daisy, Star, etc.)
  layout/          # Header, Footer
lib/
  content/         # Public content types, queries, and image helpers (reads admin store)
  admin-store.ts   # Vercel KV / JSON-file backed content store
  utils.ts         # cn() helper
public/
  fonts/           # Custom web fonts
  images/          # Static images
scripts/           # Utility scripts (admin password generator, etc.)
```
