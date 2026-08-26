import type { Core } from '@strapi/strapi';

/**
 * Public actions that anonymous visitors can call:
 * - Read public content (members, projects, leadership, about-us, faqs, policy-documents, global-setting)
 * - Submit forms (inquiries, leadership applications, org applications, support submissions)
 * - Upload files (media, resumes, photos)
 */
const PUBLIC_PERMISSIONS = [
  // Public Reads
  'api::member.member.find',
  'api::member.member.findOne',
  'api::project.project.find',
  'api::project.project.findOne',
  'api::team-member.team-member.find',
  'api::team-member.team-member.findOne',
  'api::about-us.about-us.find',
  'api::faq.faq.find',
  'api::faq.faq.findOne',
  'api::policy-document.policy-document.find',
  'api::policy-document.policy-document.findOne',
  'api::global-setting.global-setting.find',

  // Public Creates (Forms)
  'api::inquiry.inquiry.create',
  'api::leadership-application.leadership-application.create',
  'api::organization-application.organization-application.create',
  'api::support-submission.support-submission.create',

  // Public Upload (Cho phép tải ảnh/CV lên Strapi Media Library)
  'plugin::upload.content-api.upload',
];

/**
 * Grant the Public role necessary read and create access.
 * Idempotent: only creates the rows that are missing.
 */
async function grantPublicPermissions(strapi: Core.Strapi) {
  const role = await strapi.db
    .query('plugin::users-permissions.role')
    .findOne({ where: { type: 'public' }, select: ['id'] });

  if (!role) {
    strapi.log.warn('[bootstrap] public role not found, skipped permission grant');
    return;
  }

  const existing = await strapi.db.query('plugin::users-permissions.permission').findMany({
    where: { role: role.id, action: { $in: PUBLIC_PERMISSIONS } },
    select: ['action'],
  });

  const granted = new Set(existing.map((permission: { action: string }) => permission.action));
  const missing = PUBLIC_PERMISSIONS.filter((action) => !granted.has(action));

  for (const action of missing) {
    await strapi.db
      .query('plugin::users-permissions.permission')
      .create({ data: { action, role: role.id } });
  }

  strapi.log.info(
    missing.length
      ? `[bootstrap] granted public permissions: ${missing.join(', ')}`
      : '[bootstrap] public permissions already in place'
  );
}

export default {
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

  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    await grantPublicPermissions(strapi);
  },
};