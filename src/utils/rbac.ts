import type { Core } from '@strapi/strapi';

export async function synchronizeRbacPermissions(strapi: Core.Strapi) {
  try {
    const roleService = strapi.service('plugin::users-permissions.role');
    const roles: any[] = await roleService.find();

    const authRole = roles.find((r: any) => r.type === 'authenticated');
    const pubRole = roles.find((r: any) => r.type === 'public');

    // 1. Grant ALL permissions to Authenticated role
    if (authRole) {
      const fullRole = await roleService.findOne(authRole.id);
      if (fullRole && fullRole.permissions) {
        // Loop through all permissions in the tree (api::*, plugin::upload, plugin::users-permissions)
        for (const [sectionKey, sectionObj] of Object.entries(fullRole.permissions as Record<string, any>)) {
          const controllers = (sectionObj as any).controllers || {};
          for (const [controllerName, controllerObj] of Object.entries(controllers)) {
            for (const actionName of Object.keys(controllerObj as Record<string, any>)) {
              (controllerObj as any)[actionName].enabled = true;
            }
          }
        }
        await roleService.updateRole(authRole.id, fullRole);
        strapi.log.info('🔒 [RBAC] All permissions enabled for Authenticated role.');
      }
    }

    // 2. Grant public read & form create permissions
    if (pubRole) {
      const fullRole = await roleService.findOne(pubRole.id);
      if (fullRole && fullRole.permissions) {
        for (const [sectionKey, sectionObj] of Object.entries(fullRole.permissions as Record<string, any>)) {
          const controllers = (sectionObj as any).controllers || {};
          for (const [controllerName, controllerObj] of Object.entries(controllers)) {
            for (const actionName of Object.keys(controllerObj as Record<string, any>)) {
              const isFormOrAuth =
                sectionKey.includes('inquiry') ||
                sectionKey.includes('application') ||
                sectionKey.includes('support') ||
                sectionKey.includes('portal-auth');

              if (isFormOrAuth) {
                if (['create', 'login', 'me'].includes(actionName)) {
                  (controllerObj as any)[actionName].enabled = true;
                }
              } else if (sectionKey.includes('upload')) {
                if (actionName === 'upload') {
                  (controllerObj as any)[actionName].enabled = true;
                }
              } else if (sectionKey.startsWith('api::')) {
                if (['find', 'findOne'].includes(actionName)) {
                  (controllerObj as any)[actionName].enabled = true;
                }
              }
            }
          }
        }
        await roleService.updateRole(pubRole.id, fullRole);
        strapi.log.info('🌐 [RBAC] Public permissions enabled.');
      }
    }
  } catch (err: any) {
    strapi.log.error(`[RBAC Sync Error]: ${err?.message || err}`);
  }
}