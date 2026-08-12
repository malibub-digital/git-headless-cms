import { describe, it, expect } from 'vitest';
import { hashSha256, extractAuthToken } from './auth.js';

describe('CMS Auth utilities', () => {
  it('hashes string correctly using SHA-256', async () => {
    const text = 'admin123';
    const hash = await hashSha256(text);
    expect(hash).toBe('240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9');
  });

  it('extracts token from Authorization Bearer header', () => {
    const request = new Request('http://localhost/api/cms/save', {
      headers: {
        Authorization: 'Bearer testtoken123',
      },
    });
    const token = extractAuthToken(request);
    expect(token).toBe('testtoken123');
  });

  it('extracts token from Cookie header', () => {
    const request = new Request('http://localhost/api/cms/save', {
      headers: {
        Cookie: 'foo=bar; cms_admin_token=cookietoken456; baz=qux',
      },
    });
    const token = extractAuthToken(request);
    expect(token).toBe('cookietoken456');
  });

  it('returns null when no token is present', () => {
    const request = new Request('http://localhost/api/cms/save');
    const token = extractAuthToken(request);
    expect(token).toBeNull();
  });
});
