# @git-headless-cms/astro

> **Official Astro Integration for Git Headless CMS (Automatic REST API route injection).**

[![NPM Version](https://img.shields.io/npm/v/@git-headless-cms/astro.svg)](https://www.npmjs.com/package/@git-headless-cms/astro)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 🚀 Installation

```bash
npm install @git-headless-cms/astro @git-headless-cms/core
```

---

## 💡 Configuration

Add `gitCmsIntegration` to your `astro.config.mjs`:

```javascript
import { defineConfig } from 'astro/config';
import gitCms from '@git-headless-cms/astro';

export default defineConfig({
  // Ensure 'hybrid' or 'server' mode to handle API endpoints dynamically
  output: 'hybrid',
  integrations: [
    gitCms({
      adminSecret: process.env.CMS_ADMIN_SECRET,
      gitEnabled: true,
      gitBranch: 'main',
    }),
  ],
});
```

The integration automatically injects the following API endpoints into your Astro application:
- `/api/cms/save`
- `/api/cms/publish`
- `/api/cms/lock`
- `/api/cms/upload`
- `/api/cms/reset`
- `/api/cms/status`

---

## 📄 License

MIT © [MaliHub](https://github.com/malihub-digital)
