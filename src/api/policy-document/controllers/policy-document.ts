/**
 * policy-document controller
 */

import { factories } from '@strapi/strapi';

// Read-only public tokens must never expose drafts through a query parameter.
function canReadDrafts(ctx: any): boolean {
  const credentials = ctx.state.auth?.credentials;
  if (credentials?.type === 'full-access') return true;
  if (
    credentials?.permissions?.some(
      (permission: any) =>
        permission.action === 'api::policy-document.policy-document.update',
    )
  )
    return true;
  return ['admin', 'editor', 'reviewer', 'viewer'].includes(
    ctx.state.user?.role?.type,
  );
}

export default factories.createCoreController(
  'api::policy-document.policy-document',
  () => ({
    async find(ctx) {
      if (!canReadDrafts(ctx))
        ctx.query = { ...ctx.query, status: 'published' };
      return super.find(ctx);
    },
    async findOne(ctx) {
      if (!canReadDrafts(ctx))
        ctx.query = { ...ctx.query, status: 'published' };
      return super.findOne(ctx);
    },
  }),
);
