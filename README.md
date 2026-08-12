# Git Headless CMS Monorepo

> **Lightweight, framework-agnostic, and customizable Git-based Headless CMS engine.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![NPM Version](https://img.shields.io/npm/v/@git-headless-cms/core.svg)](https://www.npmjs.com/package/@git-headless-cms/core)

---

## 🌟 Overview

**Git Headless CMS** is a modular solution designed to turn any static or dynamic website (Astro, Next.js, Nuxt, HTML/Web Components) into a Git-backed Headless CMS. Content edits are saved locally during development or published directly as Git commits in production (via GitHub, GitLab, or Gitea REST APIs).

### Highlights
- 🚀 **No Heavy Database** : Your content resides directly in your JSON, Markdown (`.md`), and MDX files.
- 🔄 **Automated Git Workflow** : Publish directly to your target Git branch via GitHub REST API with automatic Git tree and commit construction.
- 🎨 **In-Context Editing** : Dynamic UI toolbar provided as a lightweight Web Component compatible with any framework.
- 🔒 **Concurrency & Authentication** : Admin secret hashing, Bearer/Cookie token support, and resource locking.
- 📦 **Modular Monorepo** : Import only the packages required for your setup.

---

## 📦 Monorepo Package Breakdown

| Package | Version | Description |
| :--- | :--- | :--- |
| [`@git-headless-cms/core`](./packages/core) | `0.1.0` | Core engine with REST API handlers, JSON/MD mutators, and Git Providers. |
| [`@git-headless-cms/astro`](./packages/astro) | `0.1.0` | Official Astro integration (automates API route injection). |
| [`@git-headless-cms/web-components`](./packages/web-components) | `0.1.0` | Framework-agnostic `<git-cms-toolbar>` UI element. |

---

## ⚡ Quickstart

### 1. Installation

```bash
# Install core engine
npm install @git-headless-cms/core

# For Astro projects
npm install @git-headless-cms/astro

# For frontend UI toolbar
npm install @git-headless-cms/web-components
```

### 2. Astro Integration

In your `astro.config.mjs`:

```javascript
import { defineConfig } from 'astro/config';
import gitCms from '@git-headless-cms/astro';

export default defineConfig({
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

### 3. Web Components Toolbar

```html
<script type="module" src="node_modules/@git-headless-cms/web-components/dist/index.js"></script>

<!-- Renders bottom floating toolbar -->
<git-cms-toolbar data-api-base="/api/cms"></git-cms-toolbar>
```

---

## 🛠️ REST API Endpoints

All requests are handled by `@git-headless-cms/core`:

- `POST /api/cms/save` : Saves local drafts and applies array & content operations (`ADD_ARRAY_ITEM`, `DELETE_ARRAY_ITEM`, `REORDER_ARRAY_ITEM`, `CREATE_CONTENT_FILE`, `DELETE_CONTENT_FILE`).
- `POST /api/cms/publish` : Publishes modified files to the configured Git repository.
- `POST /api/cms/lock` : Manages concurrent edit locks for resources.
- `POST /api/cms/upload` : Uploads media files to the local public upload folder.
- `POST /api/cms/reset` : Resets local state back to the disk version.
- `GET /api/cms/status` : Returns API health and Git configuration status.

---

## 📄 License

Distributed under the **MIT License**. Maintained by **MaliHub**.
