export interface GitFileChange {
  path: string;
  content: string;
}

export interface GitPublishPayload {
  owner: string;
  repo: string;
  branch: string;
  commitMessage: string;
  files: GitFileChange[];
  token: string;
  apiUrl?: string;
  baseBranch?: string;
  createPullRequest?: boolean;
  pullRequestTitle?: string;
  pullRequestBody?: string;
}

export interface GitPublishResult {
  success: boolean;
  message: string;
  commitSha?: string;
  pullRequestUrl?: string;
  pullRequestNumber?: number;
}

export interface GitProvider {
  publish(payload: GitPublishPayload): Promise<GitPublishResult>;
}

export class GitHubProvider implements GitProvider {
  async publish(payload: GitPublishPayload): Promise<GitPublishResult> {
    const baseUrl = payload.apiUrl || 'https://api.github.com';
    const {
      owner,
      repo,
      branch,
      commitMessage,
      files,
      token,
      baseBranch,
      createPullRequest,
      pullRequestTitle,
      pullRequestBody,
    } = payload;

    const headers = {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      'User-Agent': 'git-headless-cms',
    };

    // 1. Get branch ref SHA (or create branch from baseBranch if it does not exist)
    let refRes = await fetch(`${baseUrl}/repos/${owner}/${repo}/git/ref/heads/${branch}`, { headers });
    let latestCommitSha: string;

    if (!refRes.ok) {
      if (refRes.status === 404 && baseBranch && baseBranch !== branch) {
        // Retrieve baseBranch SHA to initialize the target branch
        const baseRefRes = await fetch(`${baseUrl}/repos/${owner}/${repo}/git/ref/heads/${baseBranch}`, { headers });
        if (!baseRefRes.ok) {
          const errText = await baseRefRes.text();
          throw new Error(`[GitHubProvider] Failed to retrieve base branch '${baseBranch}': ${baseRefRes.status} ${errText}`);
        }
        const baseRefData = (await baseRefRes.json()) as { object: { sha: string } };
        latestCommitSha = baseRefData.object.sha;

        // Create new branch reference
        const createRefRes = await fetch(`${baseUrl}/repos/${owner}/${repo}/git/refs`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            ref: `refs/heads/${branch}`,
            sha: latestCommitSha,
          }),
        });

        if (!createRefRes.ok) {
          const errText = await createRefRes.text();
          throw new Error(`[GitHubProvider] Failed to create branch '${branch}' from '${baseBranch}': ${createRefRes.status} ${errText}`);
        }
      } else {
        const errText = await refRes.text();
        throw new Error(`[GitHubProvider] Failed to retrieve branch '${branch}': ${refRes.status} ${errText}`);
      }
    } else {
      const refData = (await refRes.json()) as { object: { sha: string } };
      latestCommitSha = refData.object.sha;
    }

    // 2. Get parent commit to retrieve tree SHA
    const commitRes = await fetch(`${baseUrl}/repos/${owner}/${repo}/git/commits/${latestCommitSha}`, { headers });
    if (!commitRes.ok) {
      throw new Error(`[GitHubProvider] Failed to retrieve parent commit (${latestCommitSha})`);
    }
    const commitData = (await commitRes.json()) as { tree: { sha: string } };
    const baseTreeSha = commitData.tree.sha;

    // 2b. Compare files with remote tree/blobs to only commit real changes
    const treeFullRes = await fetch(`${baseUrl}/repos/${owner}/${repo}/git/trees/${baseTreeSha}?recursive=1`, { headers });
    const remoteTreeMap = new Map<string, string>();
    if (treeFullRes.ok) {
      const treeFullData = (await treeFullRes.json()) as { tree?: Array<{ path: string; sha: string; type: string }> };
      if (treeFullData.tree) {
        for (const item of treeFullData.tree) {
          if (item.type === 'blob') {
            remoteTreeMap.set(item.path, item.sha);
          }
        }
      }
    }

    // Filter files: check git blob sha
    const actualChanges: GitFileChange[] = [];
    for (const f of files) {
      const remoteSha = remoteTreeMap.get(f.path);
      if (!remoteSha) {
        actualChanges.push(f);
      } else {
        // Calculate git blob sha: sha1("blob " + size + "\0" + content)
        const contentBuffer = Buffer.from(f.content, 'utf-8');
        const header = `blob ${contentBuffer.length}\0`;
        const crypto = await import('crypto');
        const localSha = crypto.createHash('sha1').update(Buffer.concat([Buffer.from(header), contentBuffer])).digest('hex');
        if (localSha !== remoteSha) {
          actualChanges.push(f);
        }
      }
    }

    if (actualChanges.length === 0) {
      return {
        success: true,
        message: 'All content files are identical to remote repository. Nothing to commit.',
      };
    }

    // 3. Create new tree
    const treeItems = actualChanges.map((f) => ({
      path: f.path,
      mode: '100644',
      type: 'blob',
      content: f.content,
    }));

    const createTreeRes = await fetch(`${baseUrl}/repos/${owner}/${repo}/git/trees`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        base_tree: baseTreeSha,
        tree: treeItems,
      }),
    });

    if (!createTreeRes.ok) {
      const errText = await createTreeRes.text();
      throw new Error(`[GitHubProvider] Failed to create Git tree: ${createTreeRes.status} ${errText}`);
    }
    const treeData = (await createTreeRes.json()) as { sha: string };
    const newTreeSha = treeData.sha;

    // 4. Create commit
    const createCommitRes = await fetch(`${baseUrl}/repos/${owner}/${repo}/git/commits`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        message: commitMessage,
        tree: newTreeSha,
        parents: [latestCommitSha],
      }),
    });

    if (!createCommitRes.ok) {
      const errText = await createCommitRes.text();
      throw new Error(`[GitHubProvider] Failed to create Git commit: ${createCommitRes.status} ${errText}`);
    }
    const newCommitData = (await createCommitRes.json()) as { sha: string };
    const newCommitSha = newCommitData.sha;

    // 5. Update branch ref
    const updateRefRes = await fetch(`${baseUrl}/repos/${owner}/${repo}/git/refs/heads/${branch}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        sha: newCommitSha,
        force: false,
      }),
    });

    if (!updateRefRes.ok) {
      const errText = await updateRefRes.text();
      throw new Error(`[GitHubProvider] Failed to update branch reference: ${updateRefRes.status} ${errText}`);
    }

    let prUrl: string | undefined;
    let prNumber: number | undefined;

    // 6. Handle automatic Pull Request creation if configured and branch !== baseBranch
    if (createPullRequest && baseBranch && baseBranch !== branch) {
      try {
        const prRes = await fetch(`${baseUrl}/repos/${owner}/${repo}/pulls`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            title: pullRequestTitle || `cms(content): updates from web editor`,
            head: branch,
            base: baseBranch,
            body: pullRequestBody || `### CMS Publication\n\nAutomated publication from CMS Web Editor.\nCommit: ${newCommitSha}\nFiles modified: ${actualChanges.length}`,
          }),
        });

        if (prRes.ok) {
          const prData = (await prRes.json()) as { html_url: string; number: number };
          prUrl = prData.html_url;
          prNumber = prData.number;
        } else if (prRes.status === 422) {
          // A PR likely already exists for this branch -> fetch existing open PR
          const existingPrRes = await fetch(`${baseUrl}/repos/${owner}/${repo}/pulls?head=${owner}:${branch}&base=${baseBranch}&state=open`, { headers });
          if (existingPrRes.ok) {
            const existingPrs = (await existingPrRes.json()) as Array<{ html_url: string; number: number }>;
            if (existingPrs.length > 0) {
              prUrl = existingPrs[0].html_url;
              prNumber = existingPrs[0].number;
            }
          }
        }
      } catch {
        // PR creation error shouldn't fail the commit publish result
      }
    }

    return {
      success: true,
      message: `Successfully published changes to GitHub (Commit: ${newCommitSha.substring(0, 7)}).`,
      commitSha: newCommitSha,
      pullRequestUrl: prUrl,
      pullRequestNumber: prNumber,
    };
  }
}

export function getGitProvider(providerType: string = 'github'): GitProvider {
  switch (providerType.toLowerCase()) {
    case 'github':
      return new GitHubProvider();
    default:
      throw new Error(`[GitProvider] Unsupported Git provider: '${providerType}'`);
  }
}
