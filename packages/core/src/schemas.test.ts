import { describe, it, expect } from 'vitest';
import {
  cmsSaveOperationSchema,
  cmsSavePayloadSchema,
  cmsLockPayloadSchema,
  cmsResetPayloadSchema,
} from './schemas.js';

describe('CMS Schemas', () => {
  it('validates ADD_ARRAY_ITEM operation', () => {
    const validOp = {
      type: 'ADD_ARRAY_ITEM',
      arrayPath: 'siteConfig.navigation.links',
      defaultData: { label: 'Home', url: '/' },
    };
    const result = cmsSaveOperationSchema.safeParse(validOp);
    expect(result.success).toBe(true);
  });

  it('validates DELETE_ARRAY_ITEM operation', () => {
    const validOp = {
      type: 'DELETE_ARRAY_ITEM',
      arrayPath: 'siteConfig.navigation.links',
      index: 2,
    };
    const result = cmsSaveOperationSchema.safeParse(validOp);
    expect(result.success).toBe(true);
  });

  it('validates REORDER_ARRAY_ITEM operation', () => {
    const validOp = {
      type: 'REORDER_ARRAY_ITEM',
      arrayPath: 'siteConfig.navigation.links',
      fromIndex: 0,
      toIndex: 3,
    };
    const result = cmsSaveOperationSchema.safeParse(validOp);
    expect(result.success).toBe(true);
  });

  it('validates CREATE_CONTENT_FILE operation', () => {
    const validOp = {
      type: 'CREATE_CONTENT_FILE',
      collection: 'services',
      slug: 'new-service',
      frontmatter: { title: 'New Service' },
      content: '# Hello',
    };
    const result = cmsSaveOperationSchema.safeParse(validOp);
    expect(result.success).toBe(true);
  });

  it('validates DELETE_CONTENT_FILE operation', () => {
    const validOp = {
      type: 'DELETE_CONTENT_FILE',
      collection: 'services',
      slug: 'old-service',
    };
    const result = cmsSaveOperationSchema.safeParse(validOp);
    expect(result.success).toBe(true);
  });

  it('validates complete cmsSavePayloadSchema', () => {
    const payload = {
      drafts: { 'siteConfig.title': 'My Site' },
      operations: [
        {
          type: 'ADD_ARRAY_ITEM',
          arrayPath: 'siteConfig.links',
        },
      ],
    };
    const result = cmsSavePayloadSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it('validates cmsLockPayloadSchema', () => {
    const payload = {
      resourceId: 'page-1',
      action: 'acquire',
      holderName: 'Alice',
    };
    const result = cmsLockPayloadSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it('validates cmsResetPayloadSchema', () => {
    const payload = {
      scope: 'full',
    };
    const result = cmsResetPayloadSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });
});
