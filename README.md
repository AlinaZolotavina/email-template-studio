# Email Template Studio

Email Template Studio is a web-based **vibe coding project** for creating reusable HTML email templates, developed with **OpenAI Codex**.

Choose a template, customize its content and appearance, preview the result, and export the generated HTML for use in your own projects.

**Live demo:** https://alinazolotavina.github.io/email-template-studio/

## Features

- Browse email templates by category
- Search templates from the template gallery
- Customize template content and styles
- Change colors, typography, buttons, links, and other content
- Add or remove optional content blocks
- Remove blocks such as articles or social media links when they are not needed
- Preview the email while editing
- Switch between desktop and mobile preview
- Generate email-friendly HTML
- Copy the generated HTML or download it as an `.html` file
- Keep editing changes in the current browser tab using session storage

## Available templates

The current version includes two template categories:

- Newsletter (Weekly Digest, Promotional Offer)
- Welcome (Welcome Email, Onboarding Email)

Each template can be customized rather than being limited to its original content. More categories and templates are planned.

## How it works

The workflow is intentionally simple:

1. **Choose a template**  
   Browse the available templates or search for one by name.

2. **Make it yours**  
   Customize the text, colors, buttons, images, and other available content. Optional blocks can be added or removed depending on the template.

3. **Export HTML**  
   Preview the result and copy or download the generated HTML for use in another project.

## Email HTML

The exported emails use a table-based structure with inline CSS.

The exported HTML contains the final customized content rather than the editor interface or application-specific state.

## Tech stack

- React
- TypeScript
- Vite
- Redux Toolkit
- Zod
- Vitest
- React Testing Library
- Playwright
- OpenAI Codex

## Requirements

- Node.js version specified in `.nvmrc` (currently Node.js 22)
- npm

## Getting started

Install the dependencies:

```bash
npm ci
```

Start the development server:

```bash
npm run dev
```

The application will be available at the local Vite development URL.

## Quality checks

Run the available checks with:

```bash
npm run lint
npm run typecheck
npm run test:run
npm run fixtures:email:check
npm run build
npm run test:e2e
```

## GitHub Pages

The project can be deployed to GitHub Pages using the Deploy to GitHub Pages workflow.
The workflow:

1. Installs dependencies with npm ci
2. Runs the project quality checks
3. Builds the application with the configured Pages base path
4. Smoke tests the generated artifact
5. Deploys the dist directory to GitHub Pages
   Repository setup
6. Push the repository to GitHub.
7. Open Settings → Pages.
8. Set Source to GitHub Actions.
9. Push to main, or manually run Deploy to GitHub Pages from the Actions tab.

The application uses the configured GitHub Pages base path during the build, so it can work with repository pages as well as custom domains.

## Local GitHub Pages-style build

To test the application locally with a repository subpath:

```bash
VITE_BASE_PATH=/email-template-studio/ npm run build
VITE_BASE_PATH=/email-template-studio/ npm run smoke:release
```

In PowerShell:

```bash
$env:VITE_BASE_PATH = '/email-template-studio/'
npm run build
npm run smoke:release
Remove-Item Env:VITE_BASE_PATH
```

## Roadmap

The project is still under active development.

Planned improvements include:

- Add more template categories and more email templates
- Improve and refine existing templates
- Continue debugging and improving the editor
- Expand customization options
- Improve email rendering and compatibility
- Add more reusable content blocks

## Project status

Email Template Studio is currently a work in progress.
The core workflow — choosing a template, customizing it, previewing it, and exporting HTML — is already available. New templates, categories, and editor features will be added over time.
