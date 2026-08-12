# @git-headless-cms/core

> **Core Engine for Git Headless CMS (REST API Handlers, JSON/Markdown Mutators, Git Providers & Auth).**

[![NPM Version](https://img.shields.io/npm/v/@git-headless-cms/core.svg)](https://www.npmjs.com/package/@git-headless-cms/core)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 🚀 Installation

```bash
npm install @git-headless-cms/core
```

---

## 💡 Usage with Fetch API & Node.js

The package exports `createCmsRequestHandler` compatible with standard `Request` and `Response` objects (Node 18+, Astro, Next.js, Cloudflare Workers, etc.).

```typescript
import { createCmsRequestHandler } from '@git-headless-cms/core';

const handleCmsRequest = createCmsRequestHandler({
  basePath: '/api/cms',
  adminSecret: process.env.CMS_ADMIN_SECRET || 'your-admin-secret',
  gitEnabled: true,
  gitBranch: 'main',
  gitProvider: 'github',
  gitOwner: 'your-org',
  gitRepo: 'your-repo',
});

// Example inside an HTTP handler
export async function onRequest(req: Request): Promise<Response> {
  const response = await handleCmsRequest(req);
  return response || new Response('Not found', { status: 404 });
}
```

---

## 🛠️ Supported Save Operations

The `processCmsSaveRequest` handler processes two types of updates:
1. **Direct Drafts** : Key-value pairs using `siteConfig.navigation.title` or `folder/file.md::title`.
2. **Typed Operations (`operations`)** :
   - `ADD_ARRAY_ITEM` : Appends an item to a JSON list.
   - `DELETE_ARRAY_ITEM` : Removes an item by index.
   - `REORDER_ARRAY_ITEM` : Moves an item from one index to another.
   - `CREATE_CONTENT_FILE` : Creates a Markdown file with frontmatter in the target collection.
   - `DELETE_CONTENT_FILE` : Deletes a Markdown file from a collection.

---

## 🔒 Environment Variables

- `CMS_ADMIN_SECRET` : Admin secret key used to generate and verify SHA-256 tokens.
- `CMS_GIT_ENABLED` : Enable or disable Git publishing (`true`/`false`).
- `CMS_GIT_BRANCH` / `GIT_DEPLOY_BRANCH` : Target Git branch (e.g., `main`).
- `GIT_TOKEN` : Personal Access Token (PAT) for GitHub.
- `GIT_OWNER` : Repository owner.
- `GIT_REPO` : Repository name.

---

## 📄 License

MIT © [MaliHub](https://github.com/malihub-digital)
