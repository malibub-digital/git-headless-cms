import type { APIRoute } from 'astro';
import { processCmsLockRequest } from '@malihub/git-headless-cms-core';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  return await processCmsLockRequest(request);
};
