import type { APIRoute } from 'astro';
import { POST as batchUploadPost } from '../../admin/live/batch-upload';

export const prerender = false;

export const POST: APIRoute = async (context) => {
  return batchUploadPost(context);
};
