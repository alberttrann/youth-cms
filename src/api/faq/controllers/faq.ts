import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::faq.faq', ({ strapi }) => ({
  async reorder(ctx) {
    const { ids } = ctx.request.body as { ids?: unknown };

    if (!Array.isArray(ids)) {
      ctx.badRequest('Request body must include an "ids" array');
      return;
    }

    try {
      const updated = await strapi.service('api::faq.faq').reorder(ids as string[]);
      ctx.body = { data: updated };
    } catch (error) {
      ctx.badRequest((error as Error).message);
    }
  },
}));
