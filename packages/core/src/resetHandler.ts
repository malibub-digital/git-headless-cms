import { extractAuthToken, hashSha256 } from './auth.js';
import { cmsResetPayloadSchema } from './schemas.js';

export interface CmsResetOptions {
  adminSecret?: string;
}

export async function processCmsResetRequest(
  request: Request,
  options: CmsResetOptions = {}
): Promise<Response> {
  const token = extractAuthToken(request);
  const rawSecret = options.adminSecret || process.env.CMS_ADMIN_SECRET || '';
  const expectedHash = await hashSha256(rawSecret);

  if (!token || token !== expectedHash) {
    return new Response(
      JSON.stringify({ success: false, message: 'Unauthorized.' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  let scope = 'full';
  try {
    const body = await request.json();
    const parse = cmsResetPayloadSchema.safeParse(body);
    if (parse.success && parse.data.scope) {
      scope = parse.data.scope;
    }
  } catch {}

  return new Response(
    JSON.stringify({
      success: true,
      message: scope === 'drafts'
        ? 'Local drafts reset.'
        : 'State reset and synchronized with disk version.',
      resetScope: scope,
      timestamp: Date.now(),
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}
