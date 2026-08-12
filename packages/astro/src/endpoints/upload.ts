import type { APIRoute } from 'astro';
import { processCmsUploadRequest } from '@malihub/git-headless-cms-core';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  return await processCmsUploadRequest(request);
};
