import { processCmsSaveRequest, CmsSaveOptions } from './saveHandler.js';
import { processCmsPublishRequest, CmsPublishOptions } from './publishHandler.js';
import { processCmsLockRequest, CmsLockOptions } from './lockHandler.js';
import { processCmsUploadRequest, CmsUploadOptions } from './uploadHandler.js';
import { processCmsResetRequest, CmsResetOptions } from './resetHandler.js';
import { processCmsStatusRequest, CmsStatusOptions } from './statusHandler.js';

export interface CmsConfig extends CmsSaveOptions, CmsPublishOptions, CmsLockOptions, CmsUploadOptions, CmsResetOptions, CmsStatusOptions {
  basePath?: string;
}

export function createCmsRequestHandler(config: CmsConfig = {}) {
  const basePath = config.basePath || '/api/cms';

  return async function handleCmsRequest(request: Request): Promise<Response | null> {
    const url = new URL(request.url);
    const pathname = url.pathname;

    if (!pathname.startsWith(basePath)) {
      return null;
    }

    const subPath = pathname.substring(basePath.length);

    if (subPath === '/save' && request.method === 'POST') {
      return await processCmsSaveRequest(request, config);
    }

    if (subPath === '/publish' && request.method === 'POST') {
      return await processCmsPublishRequest(request, config);
    }

    if (subPath === '/lock' && request.method === 'POST') {
      return await processCmsLockRequest(request, config);
    }

    if (subPath === '/upload' && request.method === 'POST') {
      return await processCmsUploadRequest(request, config);
    }

    if (subPath === '/reset' && request.method === 'POST') {
      return await processCmsResetRequest(request, config);
    }

    if (subPath === '/status' && (request.method === 'GET' || request.method === 'POST')) {
      return await processCmsStatusRequest(request, config);
    }

    return new Response(
      JSON.stringify({ success: false, message: `Endpoint not found: ${request.method} ${pathname}` }),
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    );
  };
}
