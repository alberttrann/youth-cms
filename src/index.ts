import type { Core } from '@strapi/strapi';

/**
 * Read actions the frontend calls anonymously (no API token):
 * GET /api/members, /api/members/:documentId, /api/projects, /api/projects/:documentId,
 * /api/team-members, /api/team-members/:documentId
 */
const PUBLIC_READ_ACTIONS = [
  'api::member.member.find',
  'api::member.member.findOne',
  'api::project.project.find',
  'api::project.project.findOne',
  'api::team-member.team-member.find',
  'api::team-member.team-member.findOne',
];

/**
 * Grant the Public role read access to Member + Project.
 *
 * Without this the FE gets 403 on every request and surfaces
 * "Unable to load members (403)". Idempotent: only creates the rows that are
 * missing, so re-running against a configured database is a no-op.
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
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register({ strapi }: { strapi: Core.Strapi }) {
    // Server-side twins of the admin registrations in src/admin/app.tsx.
    // Both sides must use the same uid (global::<name>) or schema validation fails at boot.
    strapi.customFields.register({
      name: 'multi-enum',
      type: 'json',
    });
    // `string`, not `enumeration`: Strapi normalises enum values to alphanumerics,
    // which would mangle "Southeast Asia" / "North Africa & Egypt". The FE renders
    // project.region verbatim, so the exact human-readable string has to survive.
    strapi.customFields.register({
      name: 'single-enum',
      type: 'string',
    });
  },

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    await grantPublicRead(strapi);
  },
};
