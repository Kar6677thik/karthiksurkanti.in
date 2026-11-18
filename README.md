# karthiksurkanti.in

Source of [karthiksurkanti.in](https://karthiksurkanti.in): case studies of the systems Karthik Surkanti has rebuilt and measured, and a short tour of what runs on his home server.

Built with [Astro](https://astro.build) as a static site, served by nginx from a container on a home k3s cluster. A push to `main` builds and attests the image; the cluster picks it up within about five minutes.

## Run it

Requires Node.js 22+.

```sh
npm install
npm run dev                   # http://localhost:4321
npm run build                 # static site in dist/ (runs check:confidential first)
npm run check:confidential    # blocks home-server details from being published
```

## Layout

```text
src/content/work/   one Markdown file per case study (frontmatter = the numbers)
src/pages/          home, /work/<slug>, /run, 404
src/styles/         one stylesheet
public/media/       demo recordings and charts, copied from each project's repo
public/fonts/       Bodoni Moda and Jost, self-hosted (SIL Open Font License)
```

Rules for contributors are in [CLAUDE.md](CLAUDE.md).
