# @malihub/git-headless-cms-web-components

> **Framework-agnostic Web Component toolbar for in-context editing with Git Headless CMS.**

[![NPM Version](https://img.shields.io/npm/v/@malihub/git-headless-cms-web-components.svg)](https://www.npmjs.com/package/@malihub/git-headless-cms-web-components)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 🚀 Installation

```bash
npm install @malihub/git-headless-cms-web-components
```

---

## 💡 Usage

### JavaScript / TypeScript

Import the package to register the custom element `<git-cms-toolbar>`:

```typescript
import '@malihub/git-headless-cms-web-components';
```

In your HTML document:

```html
<git-cms-toolbar data-api-base="/api/cms"></git-cms-toolbar>
```

---

## 🎨 CSS Theme Variables

The component exposes CSS custom properties for styling:

```css
git-cms-toolbar {
  --ghc-bg: #0f172a;
  --ghc-text: #f8fafc;
  --ghc-primary: #0284c7;
  --ghc-success: #16a34a;
  --ghc-danger: #e11d48;
}
```

---

## ⚡ Attributes & Features

- `data-api-base`: Base URL for CMS API endpoints (defaults to `/api/cms`).
- Automatically toggles `data-cms-editing="true|false"` on the `<html>` root element when switching between **Preview** and **Edit** modes.
- Direct action buttons: **Save**, **Reset** (clear local drafts), and **Publish** (trigger Git commit & push).

---

## 📄 License

MIT © [MaliHub](https://github.com/malihub-digital)
