import { extractAuthToken, hashSha256 } from './auth.js';
import { cmsLockPayloadSchema } from './schemas.js';

interface LockRecord {
  holderName: string;
  timestamp: number;
}

const locksStore = new Map<string, LockRecord>();
const LOCK_TIMEOUT_MS = 15 * 60 * 1000;

export function resetLockStore() {
  locksStore.clear();
}

export interface CmsLockOptions {
  adminSecret?: string;
}

export async function processCmsLockRequest(
  request: Request,
  options: CmsLockOptions = {}
): Promise<Response> {
  const token = extractAuthToken(request);
  const rawSecret = options.adminSecret || process.env.CMS_ADMIN_SECRET || 'admin123';
  const expectedHash = await hashSha256(rawSecret);

  if (!token || token !== expectedHash) {
    return new Response(
      JSON.stringify({ success: false, message: 'Unauthorized: Invalid or missing token.' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ success: false, message: 'Invalid JSON payload.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const parseResult = cmsLockPayloadSchema.safeParse(body);
  if (!parseResult.success) {
    return new Response(
      JSON.stringify({ success: false, message: 'Invalid structure.' }),
      { status: 422, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const { resourceId, action, holderName = 'User' } = parseResult.data;
  const now = Date.now();
  const existing = locksStore.get(resourceId);

  if (action === 'check') {
    if (existing && (now - existing.timestamp < LOCK_TIMEOUT_MS)) {
      return new Response(
        JSON.stringify({ isLocked: true, holderName: existing.holderName, isOwner: existing.holderName === holderName }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }
    return new Response(
      JSON.stringify({ isLocked: false, isOwner: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (action === 'acquire') {
    if (existing && existing.holderName !== holderName && (now - existing.timestamp < LOCK_TIMEOUT_MS)) {
      return new Response(
        JSON.stringify({ success: false, isLocked: true, holderName: existing.holderName, message: `Resource locked by ${existing.holderName}` }),
        { status: 423, headers: { 'Content-Type': 'application/json' } }
      );
    }
    locksStore.set(resourceId, { holderName, timestamp: now });
    return new Response(
      JSON.stringify({ success: true, isLocked: true, isOwner: true, message: 'Lock successfully acquired.' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (action === 'release') {
    locksStore.delete(resourceId);
    return new Response(
      JSON.stringify({ success: true, isLocked: false, message: 'Lock released.' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify({ success: false, message: 'Unrecognized action.' }),
    { status: 400, headers: { 'Content-Type': 'application/json' } }
  );
}
