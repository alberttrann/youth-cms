import type { Core } from '@strapi/strapi';

const PUBLIC_ACTIONS = [
  // Public Reads
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

  // Public Form Submissions
  'api::inquiry.inquiry.create',
  'api::leadership-application.leadership-application.create',
  'api::organization-application.organization-application.create',
  'api::support-submission.support-submission.create',

  // Public Upload
  'plugin::upload.content-api.upload',
];

const ALL_STAFF_ACTIONS = [
  // Members
  'api::member.member.find', 'api::member.member.findOne', 'api::member.member.create', 'api::member.member.update', 'api::member.member.delete',

  // Projects
  'api::project.project.find', 'api::project.project.findOne', 'api::project.project.create', 'api::project.project.update', 'api::project.project.delete',

  // Leadership Team
  'api::team-member.team-member.find', 'api::team-member.team-member.findOne', 'api::team-member.team-member.create', 'api::team-member.team-member.update', 'api::team-member.team-member.delete',

  // News & Stories
  'api::news-item.news-item.find', 'api::news-item.news-item.findOne', 'api::news-item.news-item.create', 'api::news-item.news-item.update', 'api::news-item.news-item.delete',

  // Policy Documents
  'api::policy-document.policy-document.find', 'api::policy-document.policy-document.findOne', 'api::policy-document.policy-document.create', 'api::policy-document.policy-document.update', 'api::policy-document.policy-document.delete',

  // FAQs
  'api::faq.faq.find', 'api::faq.faq.findOne', 'api::faq.faq.create', 'api::faq.faq.update', 'api::faq.faq.delete',

  // Pages & Single Types
  'api::page.page.find', 'api::page.page.findOne', 'api::page.page.create', 'api::page.page.update', 'api::page.page.delete',
  'api::about-us.about-us.find', 'api::about-us.about-us.update',
  'api::home-page.home-page.find', 'api::home-page.home-page.update',
  'api::global-setting.global-setting.find', 'api::global-setting.global-setting.update',

  // ATS & Applications
  'api::leadership-application.leadership-application.find', 'api::leadership-application.leadership-application.findOne', 'api::leadership-application.leadership-application.create', 'api::leadership-application.leadership-application.update', 'api::leadership-application.leadership-application.delete',

  'api::organization-application.organization-application.find', 'api::organization-application.organization-application.findOne', 'api::organization-application.organization-application.create', 'api::organization-application.organization-application.update', 'api::organization-application.organization-application.delete',

  'api::inquiry.inquiry.find', 'api::inquiry.inquiry.findOne', 'api::inquiry.inquiry.create', 'api::inquiry.inquiry.update', 'api::inquiry.inquiry.delete',

  'api::support-submission.support-submission.find', 'api::support-submission.support-submission.findOne', 'api::support-submission.support-submission.create', 'api::support-submission.support-submission.update', 'api::support-submission.support-submission.delete',

  // Upload Plugin
  'plugin::upload.content-api.upload', 'plugin::upload.content-api.find', 'plugin::upload.content-api.findOne', 'plugin::upload.content-api.destroy',

  // Users & Permissions Plugin
  'plugin::users-permissions.user.find', 'plugin::users-permissions.user.findOne', 'plugin::users-permissions.user.create', 'plugin::users-permissions.user.update', 'plugin::users-permissions.user.destroy', 'plugin::users-permissions.user.me',
  'plugin::users-permissions.role.find', 'plugin::users-permissions.role.findOne', 'plugin::users-permissions.role.create', 'plugin::users-permissions.role.update', 'plugin::users-permissions.role.destroy',
  'plugin::users-permissions.auth.callback', 'plugin::users-permissions.auth.connect',
];

const DESIRED_ROLES = [
  { name: 'Super Admin', description: 'Full access to all portal settings and content.', type: 'admin' },
  { name: 'Content Editor', description: 'Can create, edit, and publish content.', type: 'editor' },
  { name: 'HR / Reviewer', description: 'Review candidate applications and letters.', type: 'reviewer' },
  { name: 'Viewer / Auditor', description: 'Read-only access to portal metrics.', type: 'viewer' },
];

export async function synchronizeRbacPermissions(strapi: Core.Strapi) {
  try {
    // 1. Ensure custom roles exist
    const existingRoles = await strapi.db.query('plugin::users-permissions.role').findMany();

    for (const desired of DESIRED_ROLES) {
      const exists = existingRoles.some(
        (r: any) =>
          r.name?.toLowerCase() === desired.name.toLowerCase() ||
          r.type?.toLowerCase() === desired.type.toLowerCase()
      );

      if (!exists) {
        await strapi.db.query('plugin::users-permissions.role').create({
          data: {
            name: desired.name,
            description: desired.description,
            type: desired.type,
          },
        });
        strapi.log.info(`👥 [RBAC] Created role: ${desired.name}`);
      }
    }

    // 2. Fetch fresh list of roles
    const allRoles = await strapi.db.query('plugin::users-permissions.role').findMany();
    const superAdminRole = allRoles.find(
      (r: any) => r.name?.toLowerCase() === 'super admin' || r.type === 'admin'
    );

    // 3. Populate explicit permission rows in up_permissions table
    for (const role of allRoles) {
      const targetActions = role.type === 'public' ? PUBLIC_ACTIONS : ALL_STAFF_ACTIONS;

      const existingPerms = await strapi.db.query('plugin::users-permissions.permission').findMany({
        where: { role: role.id },
        select: ['action'],
      });

      const existingSet = new Set(existingPerms.map((p: any) => p.action));
      const missing = targetActions.filter((a) => !existingSet.has(a));

      for (const action of missing) {
        await strapi.db.query('plugin::users-permissions.permission').create({
          data: { action, role: role.id },
        });
      }
    }

    // 4. Synchronize Strapi Admin Users into Content API without overriding custom roles
    if (superAdminRole) {
      const adminUsers = await strapi.db.query('admin::user').findMany({
        where: { isActive: true },
        populate: ['roles'],
      });

      for (const adminUser of adminUsers) {
        const email = adminUser.email.toLowerCase();
        let upUser = await strapi.db.query('plugin::users-permissions.user').findOne({
          where: { email },
          populate: ['role'],
        });

        if (upUser) {
          //  ONLY upgrade if the user has NO role or is on the generic 'authenticated' role
          const isGeneric = !upUser.role || upUser.role.type === 'authenticated';
          if (isGeneric) {
            await strapi.db.query('plugin::users-permissions.user').update({
              where: { id: upUser.id },
              data: {
                role: superAdminRole.id,
                confirmed: true,
                blocked: false,
              },
            });
            strapi.log.info(`👑 [RBAC Sync] Initialized Super Admin role for ${email}`);
          }
        } else {
          // First-time creation
          await strapi.db.query('plugin::users-permissions.user').create({
            data: {
              username: adminUser.username || email.split('@')[0],
              email,
              password: adminUser.password,
              confirmed: true,
              blocked: false,
              role: superAdminRole.id,
            },
          });
          strapi.log.info(`👑 [RBAC Sync] Created matching Super Admin account for ${email}`);
        }
      }
    }

    strapi.log.info('🔒 [RBAC Sync] Roles, permissions, and Super Admin accounts synchronized.');
  } catch (err: any) {
    strapi.log.error(`[RBAC Sync Error]: ${err?.message || err}`);
  }
}