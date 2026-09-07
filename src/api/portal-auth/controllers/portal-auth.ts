const bcrypt = require('bcryptjs');

export default {
  async login(ctx: any) {
    const { identifier, email, password } = ctx.request.body || {};
    const targetEmail = (email || identifier || '').trim().toLowerCase();

    if (!targetEmail || !password) {
      return ctx.badRequest('Please provide both email and password.');
    }

    // 1. Check credentials against Strapi Admin User table
    const adminUser = await strapi.db.query('admin::user').findOne({
      where: { email: targetEmail },
      populate: ['roles'],
    });

    if (!adminUser || !adminUser.isActive) {
      return ctx.badRequest('Invalid identifier or password');
    }

    const isValid = await bcrypt.compare(password, adminUser.password);
    if (!isValid) {
      return ctx.badRequest('Invalid identifier or password');
    }

    // 2. Generate a Full-Access Master Token using Strapi's admin::api-token service
    let accessKey = process.env.STRAPI_API_TOKEN;

    if (!accessKey) {
      try {
        const tokenData = await strapi.service('admin::api-token').create({
          name: `Portal Master Token ${Date.now()}`,
          description: 'Auto-generated master token for management portal session',
          type: 'full-access',
          lifespan: null,
        });
        accessKey = tokenData.accessKey;
      } catch (err: any) {
        strapi.log.warn(`[Portal Auth] API token generation error: ${err.message}`);
      }
    }

    if (!accessKey) {
      return ctx.internalServerError('Could not issue a master authorization token for portal.');
    }

    strapi.log.info(`🔑 [Portal Auth] Admin session authorized with Master Token for: ${adminUser.email}`);

    return ctx.send({
      jwt: accessKey,
      user: {
        id: adminUser.id,
        username: `${adminUser.firstname || ''} ${adminUser.lastname || ''}`.trim() || adminUser.username || adminUser.email,
        email: adminUser.email,
        role: {
          id: adminUser.roles?.[0]?.id || 1,
          name: adminUser.roles?.[0]?.name || 'Super Admin',
          code: adminUser.roles?.[0]?.code || 'strapi-super-admin',
        },
      },
    });
  },

  async me(ctx: any) {
    const authHeader = ctx.request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ctx.unauthorized('No authorization token provided.');
    }

    const adminUsers = await strapi.db.query('admin::user').findMany({
      where: { isActive: true },
      populate: ['roles'],
      limit: 1,
    });

    const adminUser = adminUsers[0];

    return ctx.send({
      id: adminUser?.id || 1,
      username: adminUser
        ? `${adminUser.firstname || ''} ${adminUser.lastname || ''}`.trim() || adminUser.username
        : 'Super Admin',
      email: adminUser?.email || 'admin@youthorgunion.org',
      role: {
        id: adminUser?.roles?.[0]?.id || 1,
        name: adminUser?.roles?.[0]?.name || 'Super Admin',
        code: adminUser?.roles?.[0]?.code || 'strapi-super-admin',
      },
    });
  },
};