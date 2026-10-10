# Neon Circuit

A standalone 3D arcade racing game built with React, Vite, and Three.js.

## Requirements

Use Node.js 20.19+ or 22.12+ and npm.

## Run locally

```sh
npm ci
npm run dev
```

## Build and preview

```sh
npm run build
npm run preview
```

Vite writes the static site to `dist/`. The Vercel configuration sets this as the deployment output and includes a fallback for direct URL requests.

## Deploy to Vercel

This project is configured as a static Vite site and does not need environment variables or a server. From this folder, run:

```sh
npx vercel
```

That creates a preview deployment. Once it looks right, publish to production with:

```sh
npx vercel --prod
```

Alternatively, import the project into Vercel from a Git repository and set this folder as the project root. The included `vercel.json` provides the install command, build command, output directory, SPA fallback, and baseline security headers.

Drive with W/A/S/D or the arrow keys. Press P or Escape to pause.

Drive with W/A/S/D or the arrow keys. Press P or Escape to pause.
