import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

const formatBuildDate = (date: Date) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
};

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  const buildDate = process.env.VITALITE_BUILD_DATE || env.VITALITE_BUILD_DATE || formatBuildDate(new Date());
  const gaMeasurementId = process.env.VITE_GA_MEASUREMENT_ID || env.VITE_GA_MEASUREMENT_ID || '';

  return {
    base: process.env.GITHUB_PAGES === 'true' ? '/vitalite/' : '/',
    plugins: [
      {
        name: 'vitalite-ga-measurement-id',
        transformIndexHtml(html) {
          return html.replaceAll('__VITALITE_GA_MEASUREMENT_ID__', gaMeasurementId);
        },
      },
      react(),
      tailwindcss(),
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      __VITALITE_BUILD_DATE__: JSON.stringify(buildDate),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify: file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            const normalizedId = id.split(path.sep).join('/');
            if (normalizedId.endsWith('/src/seo-data.json')) return 'seo-pages-data';
            if (normalizedId.endsWith('/src/projects-data.json')) return 'project-pages-data';
            if (normalizedId.endsWith('/src/seo-contexts.json')) return 'seo-contexts-data';
            if (!id.includes('node_modules')) return undefined;
            if (id.includes('react') || id.includes('react-dom')) return 'react-vendor';
            if (id.includes('motion')) return 'motion-vendor';
            if (id.includes('lucide-react')) return 'icons-vendor';
            return 'vendor';
          },
        },
      },
    },
  };
});
