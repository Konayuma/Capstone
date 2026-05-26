import crypto from 'crypto';
import prisma from '../config/db.js';
import env from '../config/env.js';

const DEFAULT_IMPORT_ROOTS = ['README.md', 'docs', 'requirements', 'notes', 'architecture', 'reports'];
const TEXT_EXTENSIONS = new Set(['.md', '.markdown', '.mdx', '.txt', '.rst', '.adoc', '.csv', '.json', '.yaml', '.yml', '.toml']);

const normalizePath = (value) => String(value || '')
  .trim()
  .replace(/\\/g, '/')
  .replace(/^\/+|\/+$/g, '');

const buildRepositoryUrl = (owner, repo) => `https://github.com/${owner}/${repo}`;

const normalizePrivateKey = (value) => String(value || '')
  .replace(/\\n/g, '\n')
  .trim();

const buildBlobUrl = (owner, repo, branch, relativePath) => {
  const encodedPath = normalizePath(relativePath)
    .split('/')
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join('/');

  return `${buildRepositoryUrl(owner, repo)}/blob/${encodeURIComponent(branch)}/${encodedPath}`;
};

const parseRepositoryReference = (value) => {
  const trimmed = String(value || '').trim();

  if (!trimmed) {
    throw Object.assign(new Error('Enter a GitHub repository URL or owner/name pair.'), { status: 400 });
  }

  const clean = trimmed.replace(/\.git$/i, '');
  const sshMatch = clean.match(/github\.com[:/]([^/]+)\/([^/]+)$/i);
  if (sshMatch) {
    return {
      owner: sshMatch[1],
      repo: sshMatch[2],
      repositoryUrl: buildRepositoryUrl(sshMatch[1], sshMatch[2]),
    };
  }

  try {
    const parsedUrl = new URL(clean.startsWith('http') ? clean : `https://${clean}`);
    if (!/github\.com$/i.test(parsedUrl.hostname)) {
      throw new Error();
    }

    const parts = parsedUrl.pathname.split('/').filter(Boolean);
    if (parts.length < 2) {
      throw new Error();
    }

    return {
      owner: parts[0],
      repo: parts[1],
      repositoryUrl: buildRepositoryUrl(parts[0], parts[1]),
    };
  } catch {
    const parts = clean.split('/').filter(Boolean);
    if (parts.length < 2) {
      throw Object.assign(new Error('Use a GitHub repository URL like https://github.com/owner/repo.'), { status: 400 });
    }

    return {
      owner: parts[0],
      repo: parts[1],
      repositoryUrl: buildRepositoryUrl(parts[0], parts[1]),
    };
  }
};

const normalizeOptionalPath = (value, fallback = '') => {
  const normalized = normalizePath(value);
  return normalized || fallback;
};

const getManagedRoots = (project) => {
  const roots = [
    project.githubDocsPath,
    project.githubRequirementsPath,
    project.githubNotesPath,
    ...DEFAULT_IMPORT_ROOTS,
  ]
    .map((root) => normalizePath(root))
    .filter(Boolean);

  return [...new Set(roots)];
};

const pathMatchesManagedRoot = (relativePath, root) => relativePath === root || relativePath.startsWith(`${root}/`);

const inferFileCategory = (relativePath, roots) => {
  const normalizedPath = normalizePath(relativePath);
  const lowerPath = normalizedPath.toLowerCase();

  if (roots.some((root) => pathMatchesManagedRoot(normalizedPath, root) && root.toLowerCase().includes('require'))) {
    return 'requirements';
  }

  if (roots.some((root) => pathMatchesManagedRoot(normalizedPath, root) && root.toLowerCase().includes('note'))) {
    return 'notes';
  }

  if (lowerPath === 'readme.md' || lowerPath.startsWith('docs/')) {
    return 'documentation';
  }

  if (lowerPath.startsWith('requirements/')) {
    return 'requirements';
  }

  if (lowerPath.startsWith('notes/')) {
    return 'notes';
  }

  if (lowerPath.startsWith('architecture/') || lowerPath.startsWith('reports/')) {
    return 'documentation';
  }

  return 'documentation';
};

const inferFileType = (relativePath, roots) => `github:${inferFileCategory(relativePath, roots)}`;

const inferMimeType = (relativePath) => {
  const lowerPath = normalizePath(relativePath).toLowerCase();
  if (lowerPath.endsWith('.md') || lowerPath.endsWith('.markdown') || lowerPath.endsWith('.mdx')) return 'text/markdown';
  if (lowerPath.endsWith('.txt') || lowerPath.endsWith('.rst') || lowerPath.endsWith('.adoc')) return 'text/plain';
  if (lowerPath.endsWith('.json')) return 'application/json';
  if (lowerPath.endsWith('.yaml') || lowerPath.endsWith('.yml')) return 'application/yaml';
  if (lowerPath.endsWith('.toml')) return 'application/toml';
  if (lowerPath.endsWith('.csv')) return 'text/csv';
  return 'text/plain';
};

const ensureGithubAppCredentials = () => {
  if (!env.GITHUB_APP_ID || !normalizePrivateKey(env.GITHUB_APP_PRIVATE_KEY)) {
    throw Object.assign(new Error('Set GITHUB_APP_ID and GITHUB_APP_PRIVATE_KEY to enable GitHub App sync.'), { status: 400 });
  }
};

const buildAppJwt = () => {
  ensureGithubAppCredentials();

  const header = { alg: 'RS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iat: now - 60,
    exp: now + 540,
    iss: env.GITHUB_APP_ID,
  };

  const unsignedToken = [header, payload]
    .map((part) => Buffer.from(JSON.stringify(part)).toString('base64url'))
    .join('.');

  const signature = crypto
    .createSign('RSA-SHA256')
    .update(unsignedToken)
    .sign(normalizePrivateKey(env.GITHUB_APP_PRIVATE_KEY), 'base64url');

  return `${unsignedToken}.${signature}`;
};

const isSupportedDocumentPath = (relativePath) => {
  const normalizedPath = normalizePath(relativePath);
  if (!normalizedPath) {
    return false;
  }

  const lowerPath = normalizedPath.toLowerCase();
  if (lowerPath === 'readme.md') return true;

  const extension = lowerPath.slice(lowerPath.lastIndexOf('.'));
  return TEXT_EXTENSIONS.has(extension);
};

const buildGithubHeaders = (token) => {
  const headers = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'Capstone Studio',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

const readGithubResponse = async (response, fallbackMessage) => {
  const responseText = await response.text();

  try {
    const parsed = JSON.parse(responseText);
    if (parsed?.message) {
      return parsed.message;
    }
  } catch {
    // Fall through to the fallback message.
  }

  return responseText || fallbackMessage;
};

const githubRequest = async (pathname, token) => {
  const response = await fetch(new URL(pathname, env.GITHUB_API_BASE_URL), {
    headers: buildGithubHeaders(token),
  });

  if (!response.ok) {
    const message = await readGithubResponse(response, `GitHub request failed (${response.status})`);
    throw Object.assign(new Error(message), { status: response.status });
  }

  return response.json();
};

const getInstallationAccessToken = async (installationId) => {
  const jwt = buildAppJwt();
  const response = await fetch(new URL(`/app/installations/${installationId}/access_tokens`, env.GITHUB_API_BASE_URL), {
    method: 'POST',
    headers: buildGithubHeaders(jwt),
  });

  if (!response.ok) {
    const message = await readGithubResponse(response, `Unable to create installation token (${response.status})`);
    throw Object.assign(new Error(message), { status: response.status });
  }

  const payload = await response.json();
  if (!payload?.token) {
    throw Object.assign(new Error('GitHub installation token response was missing a token.'), { status: 502 });
  }

  return payload.token;
};

const resolveSyncUserId = (project, syncUserId) => syncUserId
  || project.createdBy
  || project.supervisorId
  || null;

const collectGithubFiles = (tree, project, branch) => {
  const managedRoots = getManagedRoots(project);

  return tree
    .filter((entry) => entry.type === 'blob')
    .map((entry) => ({
      path: normalizePath(entry.path),
      size: typeof entry.size === 'number' ? entry.size : null,
    }))
    .filter((entry) => isSupportedDocumentPath(entry.path))
    .filter((entry) => managedRoots.some((root) => pathMatchesManagedRoot(entry.path, root)))
    .map((entry) => ({
      fileName: entry.path,
      filePath: buildBlobUrl(project.githubRepositoryOwner, project.githubRepositoryName, branch, entry.path),
      fileType: inferFileType(entry.path, managedRoots),
      mimeType: inferMimeType(entry.path),
      size: entry.size,
    }));
};

const updateProjectSyncState = async (projectId, data) => prisma.project.update({
  where: { id: projectId },
  data,
});

export const githubService = {
  parseRepositoryReference,

  getProjectConnection(project) {
    return {
      repositoryUrl: project.githubRepositoryUrl || '',
      owner: project.githubRepositoryOwner || '',
      repo: project.githubRepositoryName || '',
      installationId: project.githubInstallationId || '',
      defaultBranch: project.githubDefaultBranch || 'main',
      docsPath: project.githubDocsPath || 'docs',
      requirementsPath: project.githubRequirementsPath || 'requirements',
      notesPath: project.githubNotesPath || 'notes',
      syncEnabled: Boolean(project.githubSyncEnabled),
      connectedAt: project.githubConnectedAt,
      lastSyncedAt: project.githubLastSyncedAt,
      lastSyncStatus: project.githubLastSyncStatus || '',
      lastSyncSummary: project.githubLastSyncSummary || '',
      lastSyncError: project.githubLastSyncError || '',
    };
  },

  async saveProjectConnection(projectId, payload) {
    const repository = parseRepositoryReference(payload.repositoryUrl);
    const installationId = Number(payload.installationId);

    if (!Number.isInteger(installationId) || installationId <= 0) {
      throw Object.assign(new Error('Enter a valid GitHub App installation ID.'), { status: 400 });
    }

    const installationToken = await getInstallationAccessToken(installationId);
    const repositoryMetadata = await githubRequest(`/repos/${repository.owner}/${repository.repo}`, installationToken);

    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        githubRepositoryUrl: repository.repositoryUrl,
        githubRepositoryOwner: repository.owner,
        githubRepositoryName: repository.repo,
        githubInstallationId: installationId,
        githubDefaultBranch: normalizeOptionalPath(payload.defaultBranch, 'main'),
        githubDocsPath: normalizeOptionalPath(payload.docsPath, 'docs'),
        githubRequirementsPath: normalizeOptionalPath(payload.requirementsPath, 'requirements'),
        githubNotesPath: normalizeOptionalPath(payload.notesPath, 'notes'),
        githubSyncEnabled: true,
        githubConnectedAt: new Date(),
        githubLastSyncedAt: null,
        githubLastSyncStatus: null,
        githubLastSyncSummary: null,
        githubLastSyncError: null,
      },
    });

    const resolvedProject = updatedProject.githubDefaultBranch
      ? updatedProject
      : await prisma.project.update({
        where: { id: projectId },
        data: { githubDefaultBranch: repositoryMetadata.default_branch || 'main' },
      });

    return {
      project: resolvedProject,
      connection: this.getProjectConnection(resolvedProject),
    };
  },

  async disconnectProjectConnection(projectId) {
    await prisma.$transaction([
      prisma.file.deleteMany({
        where: {
          projectId,
          fileType: {
            startsWith: 'github:',
          },
        },
      }),
      prisma.project.update({
        where: { id: projectId },
        data: {
          githubRepositoryUrl: null,
          githubRepositoryOwner: null,
          githubRepositoryName: null,
          githubInstallationId: null,
          githubDefaultBranch: null,
          githubDocsPath: null,
          githubRequirementsPath: null,
          githubNotesPath: null,
          githubSyncEnabled: false,
          githubConnectedAt: null,
          githubLastSyncedAt: null,
          githubLastSyncStatus: null,
          githubLastSyncSummary: null,
          githubLastSyncError: null,
        },
      }),
    ]);

    const updatedProject = await prisma.project.findUnique({ where: { id: projectId } });

    return {
      project: updatedProject,
      connection: updatedProject ? this.getProjectConnection(updatedProject) : null,
    };
  },

  async syncProjectRepository(project, syncUserId) {
    if (!project.githubRepositoryOwner || !project.githubRepositoryName) {
      throw Object.assign(new Error('Connect a GitHub repository before syncing.'), { status: 400 });
    }

    if (!project.githubInstallationId) {
      throw Object.assign(new Error('Add a GitHub App installation ID before syncing.'), { status: 400 });
    }

    let branch = project.githubDefaultBranch || 'main';
    let repositoryTree;
    const installationToken = await getInstallationAccessToken(project.githubInstallationId);

    try {
      repositoryTree = await githubRequest(`/repos/${project.githubRepositoryOwner}/${project.githubRepositoryName}/git/trees/${encodeURIComponent(branch)}?recursive=1`, installationToken);
    } catch (error) {
      if (![404, 422].includes(error.status)) {
        throw error;
      }

      const repositoryMetadata = await githubRequest(`/repos/${project.githubRepositoryOwner}/${project.githubRepositoryName}`, installationToken);
      if (repositoryMetadata?.default_branch && repositoryMetadata.default_branch !== branch) {
        branch = repositoryMetadata.default_branch;
        repositoryTree = await githubRequest(`/repos/${project.githubRepositoryOwner}/${project.githubRepositoryName}/git/trees/${encodeURIComponent(branch)}?recursive=1`, installationToken);
      } else {
        throw error;
      }
    }

    const githubFiles = collectGithubFiles(repositoryTree.tree || [], project, branch);
    const uploadedBy = resolveSyncUserId(project, syncUserId);

    if (!uploadedBy) {
      throw Object.assign(new Error('The project needs an owner before GitHub files can be imported.'), { status: 400 });
    }

    await prisma.$transaction(async (transaction) => {
      await transaction.file.deleteMany({
        where: {
          projectId: project.id,
          fileType: {
            startsWith: 'github:',
          },
        },
      });

      if (githubFiles.length > 0) {
        await transaction.file.createMany({
          data: githubFiles.map((file) => ({
            projectId: project.id,
            uploadedBy,
            fileName: file.fileName,
            filePath: file.filePath,
            fileType: file.fileType,
            mimeType: file.mimeType,
            size: file.size,
          })),
        });
      }

      await transaction.project.update({
        where: { id: project.id },
        data: {
          githubSyncEnabled: true,
          githubLastSyncedAt: new Date(),
          githubLastSyncStatus: 'success',
          githubLastSyncSummary: githubFiles.length
            ? `Imported ${githubFiles.length} GitHub file${githubFiles.length === 1 ? '' : 's'} from ${project.githubRepositoryOwner}/${project.githubRepositoryName}.`
            : `No supported documentation files were found in ${project.githubRepositoryOwner}/${project.githubRepositoryName}.`,
          githubLastSyncError: null,
        },
      });
    });

    const updatedProject = await prisma.project.findUnique({ where: { id: project.id } });

    return {
      project: updatedProject,
      repository: {
        owner: project.githubRepositoryOwner,
        repo: project.githubRepositoryName,
        branch,
      },
      importedCount: githubFiles.length,
      skippedCount: Math.max(0, (repositoryTree.tree || []).filter((entry) => entry.type === 'blob').length - githubFiles.length),
    };
  },

  async handleWebhookRequest(req) {
    if (!env.GITHUB_WEBHOOK_SECRET) {
      throw Object.assign(new Error('Set GITHUB_WEBHOOK_SECRET to enable GitHub webhooks.'), { status: 400 });
    }

    const signatureHeader = req.headers['x-hub-signature-256'];
    const rawBody = String(req.rawBody || '');

    if (!signatureHeader || !rawBody) {
      throw Object.assign(new Error('GitHub webhook signature verification failed.'), { status: 401 });
    }

    const expectedSignature = `sha256=${crypto.createHmac('sha256', env.GITHUB_WEBHOOK_SECRET).update(rawBody).digest('hex')}`;
    const providedBuffer = Buffer.from(signatureHeader);
    const expectedBuffer = Buffer.from(expectedSignature);

    if (providedBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(providedBuffer, expectedBuffer)) {
      throw Object.assign(new Error('GitHub webhook signature did not match.'), { status: 401 });
    }

    const eventType = String(req.headers['x-github-event'] || '');
    if (!['push', 'repository'].includes(eventType)) {
      return { ignored: true, reason: `Unsupported event: ${eventType || 'unknown'}` };
    }

    const payload = req.body || {};
    const repositoryFullName = payload.repository?.full_name || payload.repository?.name;
    if (!repositoryFullName) {
      return { ignored: true, reason: 'Missing repository metadata.' };
    }

    const repository = parseRepositoryReference(repositoryFullName);
    const projects = await prisma.project.findMany({
      where: {
        githubSyncEnabled: true,
        githubRepositoryOwner: repository.owner,
        githubRepositoryName: repository.repo,
      },
    });

    const results = [];
    for (const project of projects) {
      try {
        const result = await this.syncProjectRepository(project, project.createdBy);
        results.push({ projectId: project.id, status: 'success', importedCount: result.importedCount });
      } catch (error) {
        await updateProjectSyncState(project.id, {
          githubLastSyncedAt: new Date(),
          githubLastSyncStatus: 'error',
          githubLastSyncSummary: `Webhook sync failed for ${repository.owner}/${repository.repo}.`,
          githubLastSyncError: error.message,
        });
        results.push({ projectId: project.id, status: 'error', message: error.message });
      }
    }

    return {
      repository,
      matchedProjects: projects.length,
      results,
    };
  },
};
