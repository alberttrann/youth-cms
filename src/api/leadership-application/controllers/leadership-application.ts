import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::leadership-application.leadership-application', () => ({
  async create(ctx) {
    const data = ctx.request.body?.data;
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return ctx.badRequest('Application data is required.');
    }
    const shortApplication = data.position === 'Marketing & Communication Member'
      || data.position === 'Secretary & Assistant';
    if (shortApplication) {
      // Ignore stale full-flow answers/uploads from cached or switched forms.
      for (const field of ['assessment', 'resumeCv', 'orgProfileDoc', 'leadershipProofDoc', 'additionalDocs', 'portfolio']) {
        delete data[field];
      }
    } else {
      // Preserve requirements for Directors and older clients without Position.
      if (!data.assessment || typeof data.assessment !== 'object' || Array.isArray(data.assessment)
        || Object.keys(data.assessment).length === 0) {
        return ctx.badRequest('Assessment Center answers are required for this position.');
      }
      const files = data.resumeCv;
      const hasCv = typeof files === 'number' || (Array.isArray(files) && files.length > 0)
        || (files && typeof files === 'object' && (files.connect?.length > 0 || files.set?.length > 0));
      if (!hasCv) return ctx.badRequest('CV / Portfolio is required for this position.');
    }
    return super.create(ctx);
  },
}));
