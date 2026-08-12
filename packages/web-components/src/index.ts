export class GitCmsToolbarElement extends HTMLElement {
  private mode: 'preview' | 'edit' = 'preview';
  private apiBase: string = '/api/cms';

  connectedCallback() {
    this.apiBase = this.getAttribute('data-api-base') || '/api/cms';
    this.render();
    this.setupListeners();
  }

  private render() {
    this.innerHTML = `
      <style>
        :host, git-cms-toolbar {
          --ghc-bg: #0f172a;
          --ghc-text: #f8fafc;
          --ghc-primary: #0284c7;
          --ghc-success: #16a34a;
          --ghc-danger: #e11d48;
          font-family: system-ui, -apple-system, sans-serif;
        }
        .ghc-toolbar-bar {
          position: fixed;
          bottom: 1rem;
          left: 50%;
          transform: translateX(-50%);
          z-index: 99999;
          background: var(--ghc-bg);
          color: var(--ghc-text);
          padding: 0.5rem 1rem;
          border-radius: 9999px;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          box-shadow: 0 10px 25px -5px rgba(0,0,0,0.5);
          border: 1px solid rgba(255,255,255,0.1);
        }
        .ghc-btn {
          background: transparent;
          border: 1px solid rgba(255,255,255,0.2);
          color: var(--ghc-text);
          padding: 0.35rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .ghc-btn:hover {
          background: rgba(255,255,255,0.1);
        }
        .ghc-btn-primary {
          background: var(--ghc-primary);
          border-color: var(--ghc-primary);
        }
        .ghc-btn-success {
          background: var(--ghc-success);
          border-color: var(--ghc-success);
        }
        .ghc-btn-danger {
          background: rgba(225, 29, 72, 0.2);
          border-color: var(--ghc-danger);
          color: #fca5a5;
        }
        .ghc-btn-active {
          background: #ffffff;
          color: #0f172a;
        }
      </style>

      <div class="ghc-toolbar-bar">
        <span style="font-weight:700; font-size:0.75rem; letter-spacing:0.05em; opacity:0.8;">GIT CMS</span>
        
        <button type="button" id="ghc-btn-preview" class="ghc-btn ${this.mode === 'preview' ? 'ghc-btn-active' : ''}">Preview</button>
        <button type="button" id="ghc-btn-edit" class="ghc-btn ${this.mode === 'edit' ? 'ghc-btn-active' : ''}">Edit</button>

        <button type="button" id="ghc-btn-reset" class="ghc-btn ghc-btn-danger" title="Discard local drafts and reset from disk">Reset</button>
        <button type="button" id="ghc-btn-save" class="ghc-btn ghc-btn-primary">Save</button>
        <button type="button" id="ghc-btn-publish" class="ghc-btn ghc-btn-success">Publish</button>
      </div>
    `;
  }

  private setupListeners() {
    const btnPreview = this.querySelector('#ghc-btn-preview');
    const btnEdit = this.querySelector('#ghc-btn-edit');
    const btnReset = this.querySelector('#ghc-btn-reset');
    const btnSave = this.querySelector('#ghc-btn-save');
    const btnPublish = this.querySelector('#ghc-btn-publish');

    btnPreview?.addEventListener('click', () => this.setMode('preview'));
    btnEdit?.addEventListener('click', () => this.setMode('edit'));

    btnReset?.addEventListener('click', async () => {
      if (confirm('Do you want to discard your local changes and reset the page to the disk version?')) {
        try {
          const res = await fetch(`${this.apiBase}/reset`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ scope: 'full' }),
          });
          const data = await res.json();
          if (data.success) {
            localStorage.removeItem('cms_drafts');
            localStorage.removeItem('cms_operations');
            window.location.reload();
          } else {
            alert(`Reset error: ${data.message}`);
          }
        } catch (err: any) {
          alert(`Network error: ${err.message}`);
        }
      }
    });

    btnSave?.addEventListener('click', async () => {
      const draftsStr = localStorage.getItem('cms_drafts') || '{}';
      const opsStr = localStorage.getItem('cms_operations') || '[]';
      try {
        const res = await fetch(`${this.apiBase}/save`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            drafts: JSON.parse(draftsStr),
            operations: JSON.parse(opsStr),
          }),
        });
        const data = await res.json();
        if (data.success) {
          alert('Saved successfully!');
          localStorage.removeItem('cms_drafts');
          localStorage.removeItem('cms_operations');
          window.location.reload();
        } else {
          alert(`Save error: ${data.message}`);
        }
      } catch (err: any) {
        alert(`Network error: ${err.message}`);
      }
    });

    btnPublish?.addEventListener('click', async () => {
      if (confirm('Publish saved changes to the Git repository?')) {
        try {
          const res = await fetch(`${this.apiBase}/publish`, { method: 'POST' });
          const data = await res.json();
          if (data.success) {
            alert(data.message || 'Published successfully!');
          } else {
            alert(`Publish error: ${data.message}`);
          }
        } catch (err: any) {
          alert(`Network error: ${err.message}`);
        }
      }
    });
  }

  private setMode(mode: 'preview' | 'edit') {
    this.mode = mode;
    document.documentElement.setAttribute('data-cms-editing', mode === 'edit' ? 'true' : 'false');
    this.render();
    this.setupListeners();
  }
}

if (typeof window !== 'undefined' && !customElements.get('git-cms-toolbar')) {
  customElements.define('git-cms-toolbar', GitCmsToolbarElement);
}
