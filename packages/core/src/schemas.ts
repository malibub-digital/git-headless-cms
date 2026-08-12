import { z } from 'zod';

export const cmsSaveOperationSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('ADD_ARRAY_ITEM'),
    arrayPath: z.string(),
    defaultData: z.record(z.string(), z.any()).optional(),
  }),
  z.object({
    type: z.literal('DELETE_ARRAY_ITEM'),
    arrayPath: z.string(),
    index: z.number().int().min(0),
  }),
  z.object({
    type: z.literal('REORDER_ARRAY_ITEM'),
    arrayPath: z.string(),
    fromIndex: z.number().int().min(0),
    toIndex: z.number().int().min(0),
  }),
  z.object({
    type: z.literal('CREATE_CONTENT_FILE'),
    collection: z.string(),
    slug: z.string(),
    frontmatter: z.record(z.string(), z.any()),
    content: z.string().optional(),
  }),
  z.object({
    type: z.literal('DELETE_CONTENT_FILE'),
    collection: z.string(),
    slug: z.string(),
  }),
]);

export const cmsSavePayloadSchema = z.object({
  drafts: z.record(z.string(), z.string()).optional().default({}),
  operations: z.array(cmsSaveOperationSchema).optional().default([]),
  filePath: z.string().optional(),
});

export const cmsLockPayloadSchema = z.object({
  resourceId: z.string(),
  action: z.enum(['acquire', 'release', 'check']),
  holderName: z.string().optional(),
});

export const cmsResetPayloadSchema = z.object({
  scope: z.enum(['drafts', 'full']).optional().default('full'),
});

export type CmsSaveOperation = z.infer<typeof cmsSaveOperationSchema>;
export type CmsSavePayload = z.infer<typeof cmsSavePayloadSchema>;
export type CmsLockPayload = z.infer<typeof cmsLockPayloadSchema>;
export type CmsResetPayload = z.infer<typeof cmsResetPayloadSchema>;
