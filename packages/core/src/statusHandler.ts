import { extractAuthToken, hashSha256 } from './auth.js';

export interface CmsStatusOptions {
  adminSecret?: string;
  gitEnabled?: boolean;
  gitBranch?: string;
}

export async function processCmsStatusRequest(
  request: Request,
  options: CmsStatusOptions = {}
): Promise<Response> {
  const token = extractAuthToken(request);
  const rawSecret = options.adminSecret || process.env.CMS_ADMIN_SECRET || '';
  const expectedHash = await hashSha256(rawSecret);

  const isAuthenticated = token === expectedHash;

  const envGitEnabled = process.env.CMS_GIT_ENABLED;
  const targetBranch = options.gitBranch || process.env.CMS_GIT_BRANCH || process.env.GIT_DEPLOY_BRANCH || 'main';

  const isGitEnabled = options.gitEnabled !== undefined
    ? options.gitEnabled
    : (String(envGitEnabled).toLowerCase() === 'true' || String(envGitEnabled) === '1');

  return new Response(
    JSON.stringify({
      status: 'ok',
      version: '0.1.0',
      authenticated: isAuthenticated,
      git: {
        enabled: isGitEnabled,
        branch: targetBranch,
        provider: process.env.GIT_PROVIDER || 'github',
        repo: process.env.GIT_REPO || 'sites',
      },
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}
