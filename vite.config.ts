import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

function normalizeBase(value: string | undefined): string {
  if (value === undefined || value.trim() === '') {
    return '/';
  }

  const withLeadingSlash = value.startsWith('/') ? value : `/${value}`;
  return withLeadingSlash.endsWith('/') ? withLeadingSlash : `${withLeadingSlash}/`;
}

export default defineConfig({
  base: normalizeBase(process.env.VITE_BASE_PATH),
  plugins: [react()],
});
