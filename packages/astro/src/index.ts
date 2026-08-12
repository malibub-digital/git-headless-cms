import type { AstroIntegration } from 'astro';
import type { CmsConfig } from '@malihub/git-headless-cms-core';
import { fileURLToPath } from 'node:url';

export interface GitCmsAstroOptions extends CmsConfig {
  enabled?: boolean;
}

export function gitCmsIntegration(options: GitCmsAstroOptions = {}): AstroIntegration {
  return {
    name: '@malihub/git-headless-cms-astro',
    hooks: {
      'astro:config:setup': ({ injectRoute }) => {
        if (options.enabled === false) return;

        const endpoints = ['save', 'publish', 'lock', 'upload', 'reset', 'status'];
        for (const ep of endpoints) {
          const entryPath = fileURLToPath(new URL(`./endpoints/${ep}.js`, import.meta.url));
          injectRoute({
            pattern: `/api/cms/${ep}`,
            entryPoint: entryPath,
            entrypoint: entryPath,
            prerender: false,
          } as any);
        }
      },
    },
  };
}

export default gitCmsIntegration;
