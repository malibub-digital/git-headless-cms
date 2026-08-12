import { describe, it, expect, beforeEach } from 'vitest';
import { processCmsLockRequest, resetLockStore } from './lockHandler.js';
import { hashSha256 } from './auth.js';

describe('Lock Handler', () => {
  let validToken: string;

  beforeEach(async () => {
    resetLockStore();
    validToken = await hashSha256('admin123');
  });

  it('rejects unauthenticated requests', async () => {
    const req = new Request('http://localhost/api/cms/lock', {
      method: 'POST',
      body: JSON.stringify({ resourceId: 'page1', action: 'check' }),
    });
    const res = await processCmsLockRequest(req, { adminSecret: 'admin123' });
    expect(res.status).toBe(401);
  });

  it('acquires lock for resource', async () => {
    const req = new Request('http://localhost/api/cms/lock', {
      method: 'POST',
      headers: { Authorization: `Bearer ${validToken}` },
      body: JSON.stringify({ resourceId: 'page1', action: 'acquire', holderName: 'UserA' }),
    });
    const res = await processCmsLockRequest(req, { adminSecret: 'admin123' });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.isLocked).toBe(true);
  });

  it('prevents acquiring lock if held by another user', async () => {
    const req1 = new Request('http://localhost/api/cms/lock', {
      method: 'POST',
      headers: { Authorization: `Bearer ${validToken}` },
      body: JSON.stringify({ resourceId: 'page1', action: 'acquire', holderName: 'UserA' }),
    });
    await processCmsLockRequest(req1, { adminSecret: 'admin123' });

    const req2 = new Request('http://localhost/api/cms/lock', {
      method: 'POST',
      headers: { Authorization: `Bearer ${validToken}` },
      body: JSON.stringify({ resourceId: 'page1', action: 'acquire', holderName: 'UserB' }),
    });
    const res2 = await processCmsLockRequest(req2, { adminSecret: 'admin123' });
    expect(res2.status).toBe(423);
    const data2 = await res2.json();
    expect(data2.isLocked).toBe(true);
    expect(data2.holderName).toBe('UserA');
  });

  it('releases acquired lock', async () => {
    const reqAcquire = new Request('http://localhost/api/cms/lock', {
      method: 'POST',
      headers: { Authorization: `Bearer ${validToken}` },
      body: JSON.stringify({ resourceId: 'page1', action: 'acquire', holderName: 'UserA' }),
    });
    await processCmsLockRequest(reqAcquire, { adminSecret: 'admin123' });

    const reqRelease = new Request('http://localhost/api/cms/lock', {
      method: 'POST',
      headers: { Authorization: `Bearer ${validToken}` },
      body: JSON.stringify({ resourceId: 'page1', action: 'release' }),
    });
    const res = await processCmsLockRequest(reqRelease, { adminSecret: 'admin123' });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.isLocked).toBe(false);
  });
});
