import type { Core } from '@strapi/strapi';
import crypto from 'crypto';
import { synchronizeRbacPermissions } from './utils/rbac';

const PUBLIC_PERMISSIONS = [
  'api::home-page.home-page.find',
  'api::home-page.home-page.findOne',
  'api::about-us.about-us.find',
  'api::about-us.about-us.findOne',
  'api::member.member.find',
  'api::member.member.findOne',
  'api::project.project.find',
  'api::project.project.findOne',
  'api::team-member.team-member.find',
  'api::team-member.team-member.findOne',
  'api::faq.faq.find',
  'api::faq.faq.findOne',
  'api::policy-document.policy-document.find',
  'api::policy-document.policy-document.findOne',
  'api::global-setting.global-setting.find',
  'api::page.page.find',
  'api::page.page.findOne',
  'api::news-item.news-item.find',
  'api::news-item.news-item.findOne',
  'api::inquiry.inquiry.create',
  'api::leadership-application.leadership-application.create',
  'api::organization-application.organization-application.create',
  'api::support-submission.support-submission.create',
  'plugin::upload.content-api.upload',
];

async function grantPublicPermissions(strapi: Core.Strapi) {
  try {
    const role = await strapi.db
      .query('plugin::users-permissions.role')
      .findOne({ where: { type: 'public' }, select: ['id'] });

    if (!role) return;

    const existing = await strapi.db.query('plugin::users-permissions.permission').findMany({
      where: { role: role.id, action: { $in: PUBLIC_PERMISSIONS } },
      select: ['action'],
    });

    const granted = new Set(existing.map((p: any) => p.action));
    const missing = PUBLIC_PERMISSIONS.filter((a) => !granted.has(a));

    for (const action of missing) {
      await strapi.db
        .query('plugin::users-permissions.permission')
        .create({ data: { action, role: role.id } });
    }
  } catch (err: any) {
    strapi.log.warn(`[Public Permissions Error]: ${err?.message}`);
  }
}

async function ensurePortalMasterToken(strapi: Core.Strapi) {
  try {
    const salt = process.env.API_TOKEN_SALT;
    const encryptionKey = process.env.ENCRYPTION_KEY || 'you-portal-encryption-key-fallback';

    if (!salt) {
      strapi.log.warn('[Portal Setup] API_TOKEN_SALT not found in environment.');
      return;
    }

    // Deterministic master token derived securely from encryption key & salt
    const rawKey = crypto
      .createHmac('sha256', encryptionKey)
      .update('you-management-portal-master-key')
      .digest('hex');

    const hashedKey = crypto
      .createHmac('sha512', salt)
      .update(rawKey)
      .digest('hex');

    const existing = await strapi.db.query('admin::api-token').findOne({
      where: { name: 'YOU Portal Master Token' },
    });

    if (!existing) {
      await strapi.db.query('admin::api-token').create({
        data: {
          name: 'YOU Portal Master Token',
          description: 'Auto-generated master token for Y.O.U Management Portal',
          type: 'full-access',
          accessKey: hashedKey,
          lifespan: null,
        },
      });
    } else {
      await strapi.db.query('admin::api-token').update({
        where: { id: existing.id },
        data: {
          type: 'full-access',
          accessKey: hashedKey,
        },
      });
    }

    // Store in-memory for the portal-auth controller
    strapi.config.set('portal.masterKey', rawKey);
    strapi.log.info('🔑 [Portal Master Token] Initialized permanent Full-Access Token for Portal.');
  } catch (err: any) {
    strapi.log.error(`[Portal Master Token Error]: ${err?.message || err}`);
  }
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
    await synchronizeRbacPermissions(strapi);
    await ensurePortalMasterToken(strapi);
  },
};