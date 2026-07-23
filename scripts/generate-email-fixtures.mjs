import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import process from 'node:process';

import { createServer } from 'vite';

const FIXTURE_DIRECTORY = resolve('src/email/compatibility/fixtures');
const checkOnly = process.argv.includes('--check');
const server = await createServer({
  appType: 'custom',
  logLevel: 'error',
  server: { middlewareMode: true },
});

let hasMismatch = false;

try {
  const registry = await server.ssrLoadModule(
    '/src/features/templates/templateRegistry.ts',
  );
  const core = await server.ssrLoadModule('/src/email/core/index.ts');

  await mkdir(FIXTURE_DIRECTORY, { recursive: true });

  for (const definition of registry.listTemplates()) {
    const draft = registry.getTemplateDefaults(definition.id);
    const result = definition.render(draft, core.exportRenderContext);
    if (result.errors.length > 0) {
      throw new Error(
        `Cannot generate ${definition.id}: ${result.errors
          .map((error) => error.message)
          .join('; ')}`,
      );
    }

    const fixturePath = resolve(FIXTURE_DIRECTORY, `${definition.id}.html`);
    const expected = `${result.html}\n`;

    if (checkOnly) {
      const current = await readFile(fixturePath, 'utf8').catch(() => null);
      if (current !== expected) {
        hasMismatch = true;
        process.stderr.write(`Outdated email fixture: ${definition.id}\n`);
      }
    } else {
      await writeFile(fixturePath, expected, 'utf8');
      process.stdout.write(`Generated ${definition.id}.html\n`);
    }
  }
} finally {
  await server.close();
}

if (hasMismatch) {
  process.exitCode = 1;
}
