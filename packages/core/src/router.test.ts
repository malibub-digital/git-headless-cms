import { describe, it, expect } from 'vitest';
import { createCmsRequestHandler } from './router.js';

describe('CMS Router', () => {
  const handler = createCmsRequestHandler({ adminSecret: 'admin123' });

  it('returns null for non-CMS routes', async () => {
    const req = new Request('http://localhost/about');
    const res = await handler(req);
    expect(res).toBeNull();
  });

  it('returns 404 for unknown CMS subpath', async () => {
    const req = new Request('http://localhost/api/cms/unknown', { method: 'GET' });
    const res = await handler(req);
    expect(res).not.toBeNull();
    expect(res?.status).toBe(404);
  });

  it('routes to status endpoint', async () => {
    const req = new Request('http://localhost/api/cms/status', { method: 'GET' });
    const res = await handler(req);
    expect(res).not.toBeNull();
    expect(res?.status).toBe(200);
    const data = await res?.json();
    expect(data.status).toBe('ok');
    expect(data.version).toBe('0.1.0');
  });
});
