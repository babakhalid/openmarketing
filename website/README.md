# openmarketing.dev

The OpenMarketing website and docs: an [Astro](https://astro.build) static site styled with Tailwind CSS v4 in the desktop app's colors. It is deployed on Vercel from this folder; every push to `main` goes to production.

## Run

```sh
cd website
npm install
npm run dev       # http://localhost:4321
npm run build     # copies the installers, then builds to dist/
```

## Layout

| Path | Role |
| --- | --- |
| `src/pages/index.astro` | The homepage: hero video, workflow steps, agents, tools and install |
| `src/pages/docs/` | Renders the docs collection (`[...slug].astro`) and the docs index |
| `src/content/docs/` | The docs, one Markdown file per page. Frontmatter needs `title`, `description`, `section` and `order` (see `src/content/config.ts`) |
| `src/layouts/main.astro` | Shared page shell: navigation, footer, SEO and Open Graph tags |
| `src/styles/global.css` | Color tokens (dark and light), typography and the Tailwind setup |
| `public/` | Static files: the hero video (`hero.mp4`, `hero.webm`, `hero-poster.jpg`, made in `apps/hero-video`), app screenshots and the installers |

## Notes

- `public/install`, `install.ps1`, `install-skills` and `install-skills.ps1` are copies of `scripts/install/*`, refreshed by `npm run build` through `scripts/sync-website-installers.mjs`. Edit the originals, not these copies.
- To add a docs page, create a Markdown file under `src/content/docs/<section>/` with the frontmatter above, then add it to the `sections` list at the top of `src/pages/docs/[...slug].astro` so it shows in the sidebar.
