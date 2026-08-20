import type { Core } from '@strapi/strapi';

/**
 * Read actions the frontend calls anonymously (no API token):
 * GET /api/members, /api/members/:documentId
 * GET /api/projects, /api/projects/:documentId
 * GET /api/team-members, /api/team-members/:documentId
 * GET /api/pages, /api/pages/:documentId (Custom dynamic pages)
 * GET /api/faqs, /api/policy-documents
 */
const PUBLIC_READ_ACTIONS = [
  'api::member.member.find',
  'api::member.member.findOne',
  'api::project.project.find',
  'api::project.project.findOne',
  'api::team-member.team-member.find',
  'api::team-member.team-member.findOne',
  'api::page.page.find',
  'api::page.page.findOne',
  'api::faq.faq.find',
  'api::faq.faq.findOne',
  'api::policy-document.policy-document.find',
  'api::policy-document.policy-document.findOne',
];

/**
 * Grant the Public role read access to collections.
 * Idempotent: only creates the rows that are missing.
 */
async function grantPublicRead(strapi: Core.Strapi) {
  const role = await strapi.db
    .query('plugin::users-permissions.role')
    .findOne({ where: { type: 'public' }, select: ['id'] });

  if (!role) {
    strapi.log.warn('[bootstrap] public role not found, skipped permission grant');
    return;
  }

  const existing = await strapi.db.query('plugin::users-permissions.permission').findMany({
    where: { role: role.id, action: { $in: PUBLIC_READ_ACTIONS } },
    select: ['action'],
  });

  const granted = new Set(existing.map((permission: { action: string }) => permission.action));
  const missing = PUBLIC_READ_ACTIONS.filter((action) => !granted.has(action));

  for (const action of missing) {
    await strapi.db
      .query('plugin::users-permissions.permission')
      .create({ data: { action, role: role.id } });
  }

  strapi.log.info(
    missing.length
      ? `[bootstrap] granted public read: ${missing.join(', ')}`
      : '[bootstrap] public read permissions already in place'
  );
}

export default {
  /**
   * Register custom fields.
   */
  register({ strapi }: { strapi: Core.Strapi }) {
    strapi.customFields.register({
      name: 'multi-enum',
      type: 'json',
    });
    strapi.customFields.register({
      name: 'single-enum',
      type: 'string',
    });
  },

  /**
   * Bootstrap application logic and permissions.
   */
  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    await grantPublicRead(strapi);
  },
};