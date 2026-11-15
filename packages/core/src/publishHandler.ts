import fs from 'fs';
import path from 'path';
import { extractAuthToken, hashSha256 } from './auth.js';
import { getGitProvider, GitFileChange } from './gitProvider.js';

export interface CmsPublishOptions {
  projectRoot?: string;
  adminSecret?: string;
  gitEnabled?: boolean;
  gitBranch?: string;
  gitProvider?: string;
  gitToken?: string;
  gitOwner?: string;
  gitRepo?: string;
}

async function ensureEnvLoaded(projectRoot: string) {
  try {
    const candidates = [
      path.join(projectRoot, '.env'),
      path.join(projectRoot, '..', '.env'),
      path.join(process.cwd(), '.env'),
      path.join(process.cwd(), '..', '.env'),
    ];

    for (const envPath of candidates) {
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf-8');
        for (const line of content.split('\n')) {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
            const [k, ...v] = trimmed.split('=');
            const key = k.trim();
            let val = v.join('=').trim();
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
              val = val.slice(1, -1);
            }
            if (!(key in process.env)) {
              process.env[key] = val;
            }
          }
        }
      }
    }
  } catch {}
}

function findModifiedContentFiles(dir: string, baseDir: string = dir): GitFileChange[] {
  const changes: GitFileChange[] = [];
  if (!fs.existsSync(dir)) return changes;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.git' && entry.name !== '.astro' && entry.name !== 'dist') {
        changes.push(...findModifiedContentFiles(fullPath, baseDir));
      }
    } else if (entry.isFile()) {
      const isTextContent = (entry.name.endsWith('.json') || entry.name.endsWith('.md') || entry.name.endsWith('.mdx')) && entry.name !== 'package.json' && entry.name !== 'package-lock.json';
      const isMediaContent = /\.(png|jpg|jpeg|webp|gif|svg)$/i.test(entry.name);
      if (isTextContent || isMediaContent) {
        const relPath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
        const content = isMediaContent ? fs.readFileSync(fullPath).toString('base64') : fs.readFileSync(fullPath, 'utf-8');
        changes.push({ path: relPath, content });
      }
    }
  }
  return changes;
}

function findRepoRoot(startDir: string): string {
  let current = path.resolve(startDir);
  while (current !== path.parse(current).root) {
    if (fs.existsSync(path.join(current, '.git')) || fs.existsSync(path.join(current, 'template', 'site.config.json'))) {
      return current;
    }
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  return startDir;
}

export async function processCmsPublishRequest(
  request: Request,
  options: CmsPublishOptions = {}
): Promise<Response> {
  const projectRoot = options.projectRoot || process.cwd();
  await ensureEnvLoaded(projectRoot);

  const token = extractAuthToken(request);
  const rawSecret = options.adminSecret || process.env.CMS_ADMIN_SECRET || '';
  const expectedHash = await hashSha256(rawSecret);

  if (!token || token !== expectedHash) {
    return new Response(
      JSON.stringify({ success: false, message: 'Unauthorized: Invalid or missing authentication token.' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const envGitEnabled = process.env.CMS_GIT_ENABLED;
  const envDeployBranch = process.env.GIT_DEPLOY_BRANCH ?? process.env.CMS_GIT_BRANCH;

  const isGitEnabled = options.gitEnabled !== undefined
    ? options.gitEnabled
    : (
        String(envGitEnabled).toLowerCase() === 'true' ||
        String(envGitEnabled) === '1' ||
        (envGitEnabled !== 'false' && envGitEnabled !== '0' && Boolean(envDeployBranch))
      );

  if (!isGitEnabled) {
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Git publishing is not enabled (CMS_GIT_ENABLED=false).',
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const targetBranch = options.gitBranch || process.env.CMS_GIT_BRANCH || process.env.GIT_DEPLOY_BRANCH;
  if (!targetBranch) {
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Git publishing enabled but target branch (CMS_GIT_BRANCH or GIT_DEPLOY_BRANCH) is not configured.',
        errors: ['Target Git branch undefined. Publishing cancelled.'],
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const gitToken = options.gitToken || process.env.GIT_TOKEN;
  if (!gitToken) {
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Missing Git publication token (GIT_TOKEN undefined).',
        errors: ['Missing Git API token (GIT_TOKEN). Cannot publish.'],
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const gitOwner = options.gitOwner || process.env.GIT_OWNER || 'malibub-digital';
  const gitRepo = options.gitRepo || process.env.GIT_REPO || 'sites';
  const providerType = options.gitProvider || process.env.GIT_PROVIDER || 'github';

  try {
    const repoRoot = findRepoRoot(projectRoot);
    const targetProjectRoot = fs.existsSync(path.join(repoRoot, 'template', 'site.config.json'))
      ? path.join(repoRoot, 'template')
      : repoRoot;

    const srcDir = path.join(targetProjectRoot, 'src', 'content');
    const templateSrcDir = path.join(targetProjectRoot, 'template', 'src', 'content');
    const contentDir = fs.existsSync(srcDir) ? srcDir : (fs.existsSync(templateSrcDir) ? templateSrcDir : targetProjectRoot);

    const modifiedFiles = findModifiedContentFiles(contentDir, repoRoot);

    if (modifiedFiles.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No content files (.json/.md) to publish.',
          gitPushed: false,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const provider = getGitProvider(providerType);
    const result = await provider.publish({
      owner: gitOwner,
      repo: gitRepo,
      branch: targetBranch,
      commitMessage: 'cms(publish): update content via editor',
      files: modifiedFiles,
      token: gitToken,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: result.message,
        gitPushed: true,
        commitSha: result.commitSha,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (gitErr: any) {
    return new Response(
      JSON.stringify({
        success: false,
        message: `Error publishing via API on ${providerType}: ${gitErr.message}`,
        errors: [gitErr.message],
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
