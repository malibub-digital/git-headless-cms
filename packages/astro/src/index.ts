import type { AstroIntegration } from 'astro';
import type { CmsConfig } from '@malihub/git-headless-cms-core';

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
          injectRoute({
            pattern: `/api/cms/${ep}`,
            entrypoint: `@malihub/git-headless-cms-astro/endpoints/${ep}`,
            prerender: false,
          });
        }
      },
    },
  };
}

export default gitCmsIntegration;
