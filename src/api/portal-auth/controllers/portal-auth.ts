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
    let isAdminSource = false;

    // 1. Check if user is in Strapi Admin User table
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
        isAdminSource = true;
      }
    }

    // 2. Fallback: check Content API Staff User table
    let upUser = await strapi.db.query('plugin::users-permissions.user').findOne({
      where: {
        $or: [{ email: targetEmail }, { username: targetEmail }],
      },
      populate: ['role'],
    });

    if (!authenticatedUser && upUser && !upUser.blocked) {
      const isValidStaff = await bcrypt.compare(password, upUser.password);
      if (isValidStaff) {
        authenticatedUser = upUser;
      }
    }

    if (!authenticatedUser) {
      return ctx.badRequest('Invalid email or password.');
    }

    // 3. Resolve roles without overwriting intentional assignments
    const superAdminRole = await strapi.db.query('plugin::users-permissions.role').findOne({
      where: { $or: [{ name: 'Super Admin' }, { type: 'admin' }] },
    });

    const viewerRole = await strapi.db.query('plugin::users-permissions.role').findOne({
      where: { $or: [{ name: 'Viewer / Auditor' }, { type: 'viewer' }] },
    });

    const authDefaultRole = await strapi.db.query('plugin::users-permissions.role').findOne({
      where: { type: 'authenticated' },
    });

    if (!upUser) {
      // First-time sync: Admins get Super Admin, other accounts get Viewer (least privilege)
      const initialRoleId = isAdminSource
        ? superAdminRole?.id || authDefaultRole?.id || 1
        : viewerRole?.id || authDefaultRole?.id || 1;

      upUser = await strapi.db.query('plugin::users-permissions.user').create({
        data: {
          username: authenticatedUser.username || targetEmail.split('@')[0],
          email: targetEmail,
          password: authenticatedUser.password,
          confirmed: true,
          blocked: false,
          role: initialRoleId,
        },
        populate: ['role'],
      });
    } else if (isAdminSource && (!upUser.role || upUser.role.type === 'authenticated')) {
      // Upgrade to Super Admin ONLY on first initialization (not if previously demoted or changed)
      await strapi.db.query('plugin::users-permissions.user').update({
        where: { id: upUser.id },
        data: {
          role: superAdminRole?.id,
          confirmed: true,
          blocked: false,
        },
      });
      upUser = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { id: upUser.id },
        populate: ['role'],
      });
    }

    // 4. Determine final resolved role from the database
    const assignedRole = upUser?.role || (isAdminSource ? superAdminRole : viewerRole);
    const resolvedType = resolveRoleType(assignedRole);

    const userRole = {
      id: assignedRole?.id || 1,
      name: assignedRole?.name || (resolvedType === 'admin' ? 'Super Admin' : 'Staff Member'),
      type: resolvedType,
    };

    // 5. Retrieve master token for backend operation authorization
    let masterToken = strapi.config.get('portal.masterKey');
    if (!masterToken) {
      const crypto = require('crypto');
      masterToken = crypto
        .createHmac('sha256', process.env.ENCRYPTION_KEY || 'you-portal-encryption-key-fallback')
        .update('you-management-portal-master-key')
        .digest('hex');
    }

    strapi.log.info(
      `🔑 [Portal Auth] Sign-in successful: ${authenticatedUser.email} (${userRole.name} [${userRole.type}])`
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