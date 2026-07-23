import { createServer } from 'node:http';
import { readdir, readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, relative, resolve, sep } from 'node:path';
import process from 'node:process';

const projectRoot = resolve(import.meta.dirname, '..');
const distRoot = join(projectRoot, 'dist');
const thumbnailRoot = join(projectRoot, 'public', 'template-thumbnails');

function normalizeBase(value) {
  if (value === undefined || value.trim() === '') return '/';
  const withLeadingSlash = value.startsWith('/') ? value : `/${value}`;
  return withLeadingSlash.endsWith('/') ? withLeadingSlash : `${withLeadingSlash}/`;
}

const base = normalizeBase(process.env.VITE_BASE_PATH);
const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

function localAssetUrls(html) {
  return [...html.matchAll(/\b(?:href|src)="([^"]+)"/g)]
    .map((match) => match[1])
    .filter((url) => !/^(?:data:|https?:|#)/.test(url));
}

function resolveRequestPath(pathname) {
  if (!pathname.startsWith(base)) return null;
  const relativePath = pathname.slice(base.length) || 'index.html';
  const filePath = normalize(join(distRoot, relativePath));
  const relativeToDist = relative(distRoot, filePath);

  if (relativeToDist.startsWith(`..${sep}`) || relativeToDist === '..') return null;
  return filePath;
}

const server = createServer(async (request, response) => {
  try {
    const pathname = new globalThis.URL(
      request.url ?? '/',
      'http://127.0.0.1',
    ).pathname;
    const filePath = resolveRequestPath(pathname);
    if (filePath === null) {
      response.writeHead(404).end('Not found');
      return;
    }

    const file = await readFile(filePath);
    response.writeHead(200, {
      'content-type': contentTypes[extname(filePath)] ?? 'application/octet-stream',
    });
    response.end(file);
  } catch {
    response.writeHead(404).end('Not found');
  }
});

async function assertOk(origin, pathname) {
  const response = await globalThis.fetch(`${origin}${pathname}`);
  if (!response.ok) {
    throw new Error(`${pathname} returned HTTP ${response.status}.`);
  }
  return response;
}

try {
  await stat(join(distRoot, 'index.html'));
  const thumbnailFiles = (await readdir(thumbnailRoot))
    .filter((fileName) => fileName.endsWith('.png'))
    .sort();

  await new Promise((resolveListen) => server.listen(0, '127.0.0.1', resolveListen));
  const address = server.address();
  if (address === null || typeof address === 'string') {
    throw new Error('Could not determine the smoke server address.');
  }
  const origin = `http://127.0.0.1:${address.port}`;

  const rootResponse = await assertOk(origin, base);
  const indexHtml = await rootResponse.text();
  const assetUrls = localAssetUrls(indexHtml);

  if (assetUrls.length === 0) {
    throw new Error('The built index does not reference any local assets.');
  }

  for (const assetUrl of assetUrls) {
    if (!assetUrl.startsWith(base)) {
      throw new Error(`Asset URL "${assetUrl}" does not use base "${base}".`);
    }
    await assertOk(origin, assetUrl);
  }

  for (const fileName of thumbnailFiles) {
    await assertOk(origin, `${base}template-thumbnails/${fileName}`);
  }

  const rootPathResponse = await globalThis.fetch(`${origin}/`);
  if (base !== '/' && rootPathResponse.status !== 404) {
    throw new Error('Smoke server unexpectedly served the app outside its repository subpath.');
  }

  globalThis.console.log(
    `Release smoke passed at ${base}: ${assetUrls.length} built assets and ${thumbnailFiles.length} thumbnails.`,
  );
} finally {
  await new Promise((resolveClose, rejectClose) => {
    server.close((error) => (error === undefined ? resolveClose() : rejectClose(error)));
  });
}
