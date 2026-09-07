import type { Core } from '@strapi/strapi';
import { synchronizeRbacPermissions } from './utils/rbac';

export default {
  register({ strapi }: { strapi: Core.Strapi }) {
    strapi.customFields.register({ name: 'multi-enum', type: 'json' });
    strapi.customFields.register({ name: 'single-enum', type: 'string' });
  },

  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    //  Programmatic permission synchronization on every startup
    await synchronizeRbacPermissions(strapi);
  },
};