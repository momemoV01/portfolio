// @ts-check

import mdx from '@astrojs/mdx';
import vercel from '@astrojs/vercel';
import { defineConfig, fontProviders } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  site: 'https://momemo-dev.vercel.app',
  output: 'server',
  adapter: vercel(),
  // 로컬 loopback 별칭과 배포 프록시 차이는 폼별 CSRF 토큰으로 검증한다.
  security: {
    checkOrigin: false,
  },
  integrations: [
    mdx(),
    react(),
  ],

  fonts: [
      {
          provider: fontProviders.local(),
          name: 'Atkinson',
          cssVariable: '--font-atkinson',
          fallbacks: ['sans-serif'],
          options: {
              variants: [
                  {
                      src: ['./src/assets/fonts/atkinson-regular.woff'],
                      weight: 400,
                      style: 'normal',
                      display: 'swap',
                  },
                  {
                      src: ['./src/assets/fonts/atkinson-bold.woff'],
                      weight: 700,
                      style: 'normal',
                      display: 'swap',
                  },
              ],
          },
      },
    ],

  vite: {
    plugins: [tailwindcss()],
  },
});
