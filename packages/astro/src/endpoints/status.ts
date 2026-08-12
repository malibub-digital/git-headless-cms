import type { APIRoute } from 'astro';
import { processCmsStatusRequest } from '@malihub/git-headless-cms-core';

export const prerender = false;

export const ALL: APIRoute = async ({ request }) => {
  return await processCmsStatusRequest(request);
};
