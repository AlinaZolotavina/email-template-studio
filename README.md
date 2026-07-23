# Email Template Studio

Static React application for configuring fixed email templates, previewing them, and exporting compatible table-based HTML with inline CSS.

## Requirements

- Node.js version from `.nvmrc` (currently Node.js 22)
- npm

Install the locked dependencies:

```bash
npm ci
```

## Local development

```bash
npm run dev
```

The local Vite server uses `/` as its base path. To verify a GitHub Pages-style
repository subpath locally, build and smoke test with the same base:

```bash
VITE_BASE_PATH=/email-template-studio/ npm run build
VITE_BASE_PATH=/email-template-studio/ npm run smoke:release
```

In PowerShell:

```powershell
$env:VITE_BASE_PATH = '/email-template-studio/'
npm run build
npm run smoke:release
Remove-Item Env:VITE_BASE_PATH
```

## Quality checks

```bash
npm run lint
npm run typecheck
npm run test:run
npm run fixtures:email:check
npm run build
npm run test:e2e
```

## GitHub Pages deployment

The `Deploy to GitHub Pages` workflow runs on pushes to `main` and can also be
started manually. It installs dependencies with `npm ci`, runs the quality
checks, builds with the configured Pages base path, smoke tests the artifact,
and deploys `dist` with the official GitHub Pages Actions. The base path comes
from GitHub Pages metadata, so project sites, user sites, and custom domains use
their configured path.

Repository setup:

1. Push the repository to GitHub.
2. Open **Settings > Pages**.
3. Select **GitHub Actions** as the deployment source.
4. Push to `main`, or run **Deploy to GitHub Pages** from the Actions tab.

The workflow exposes the deployed URL through the protected `github-pages`
environment. A real deployment requires a configured GitHub remote and
repository permissions; local builds do not publish anything.
