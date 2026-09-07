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

export async function synchronizeRbacPermissions(strapi: Core.Strapi) {
  try {
    const roles = await strapi.db.query('plugin::users-permissions.role').findMany();

    for (const role of roles) {
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

    strapi.log.info('🔒 [RBAC Sync] All Content API permissions populated in database successfully.');
  } catch (err: any) {
    strapi.log.error(`[RBAC Sync Error]: ${err?.message || err}`);
  }
}