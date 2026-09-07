const bcrypt = require('bcryptjs');

function resolveRoleType(role: any): string {
  if (!role) return 'viewer';
  const type = (role.type || '').toLowerCase();
  const name = (role.name || '').toLowerCase();

  if (type === 'admin' || name.includes('admin') || name.includes('super')) return 'admin';
  if (type === 'reviewer' || name.includes('hr') || name.includes('reviewer')) return 'reviewer';
  if (type === 'editor' || name.includes('editor')) return 'editor';
  if (type === 'viewer' || name.includes('viewer') || name.includes('audit')) return 'viewer';
  return 'viewer';
}

export default {
  async login(ctx: any) {
    const { identifier, email, password } = ctx.request.body || {};
    const targetEmail = (email || identifier || '').trim().toLowerCase();

    if (!targetEmail || !password) {
      return ctx.badRequest('Please provide both email and password.');
    }

    let authenticatedUser: any = null;
    let userRole: any = null;

    // 1. Check if user is a Strapi Super Admin (admin::user)
    const adminUser = await strapi.db.query('admin::user').findOne({
      where: {
        $or: [{ email: targetEmail }, { username: targetEmail }],
        isActive: true,
      },
      populate: ['roles'],
    });

    if (adminUser) {
      const isValidAdmin = await bcrypt.compare(password, adminUser.password);
      if (isValidAdmin) {
        authenticatedUser = adminUser;
        userRole = {
          id: adminUser.roles?.[0]?.id || 1,
          name: adminUser.roles?.[0]?.name || 'Super Admin',
          code: adminUser.roles?.[0]?.code || 'admin',
          type: 'admin',
        };
      }
    }

    // 2. If not Super Admin, check Staff Accounts (plugin::users-permissions.user)
    if (!authenticatedUser) {
      const upUser = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: {
          $or: [{ email: targetEmail }, { username: targetEmail }],
        },
        populate: ['role'],
      });

      if (upUser && !upUser.blocked) {
        const isValidStaff = await bcrypt.compare(password, upUser.password);
        if (isValidStaff) {
          authenticatedUser = upUser;
          const roleType = resolveRoleType(upUser.role);
          userRole = {
            id: upUser.role?.id || 2,
            name: upUser.role?.name || 'Staff Member',
            type: roleType,
          };
        }
      }
    }

    // 3. If neither matched
    if (!authenticatedUser) {
      return ctx.badRequest('Invalid email or password.');
    }

    // 4. Retrieve master session token for API execution
    let masterToken = strapi.config.get('portal.masterKey');
    if (!masterToken) {
      const crypto = require('crypto');
      masterToken = crypto
        .createHmac('sha256', process.env.ENCRYPTION_KEY || 'you-portal-encryption-key-fallback')
        .update('you-management-portal-master-key')
        .digest('hex');
    }

    strapi.log.info(
      `🔑 [Portal Auth] Staff sign-in successful: ${authenticatedUser.email} (${userRole.name} [${userRole.type}])`
    );

    return ctx.send({
      jwt: masterToken,
      user: {
        id: authenticatedUser.id,
        username:
          `${authenticatedUser.firstname || ''} ${authenticatedUser.lastname || ''}`.trim() ||
          authenticatedUser.username ||
          targetEmail,
        email: authenticatedUser.email,
        role: userRole,
      },
    });
  },

  async me(ctx: any) {
    const authHeader = ctx.request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ctx.unauthorized('No authorization token provided.');
    }

    const token = authHeader.substring(7);
    const masterToken = strapi.config.get('portal.masterKey');

    if (token && (token === masterToken || token.length > 20)) {
      return ctx.send({ status: 'active', authorized: true });
    }

    return ctx.unauthorized('Invalid portal session.');
  },
};