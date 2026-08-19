import { randomBytes } from 'node:crypto';
import type { Core } from '@strapi/strapi';

type ControllerContext = {
  request?: { body?: { email?: unknown; password?: string } };
  state?: { auth?: unknown };
  status?: number;
  send: (body: unknown) => void;
};

type AuthController = {
  forgotPassword: (ctx: ControllerContext) => Promise<void>;
};

type Plugin = {
  controllers: {
    contentmanageruser: {
      create: (ctx: ControllerContext) => Promise<void>;
    };
    auth: ({ strapi }: { strapi: Core.Strapi }) => AuthController;
  };
};

export default (plugin: Plugin) => {
  const originalAuthFactory = plugin.controllers.auth;
  const originalCreate = plugin.controllers.contentmanageruser.create;
  let forgotPassword: AuthController['forgotPassword'];

  plugin.controllers.auth = ({ strapi }) => {
    const controller = originalAuthFactory({ strapi });
    forgotPassword = controller.forgotPassword;
    return controller;
  };

  plugin.controllers.contentmanageruser.create = async (ctx) => {
    if (ctx.request?.body) {
      ctx.request.body.password = randomBytes(32).toString('base64url');
    }

    await originalCreate(ctx);

    if ((ctx.status ?? 200) >= 400 || !forgotPassword) return;

    const email = ctx.request?.body?.email;
    if (typeof email !== 'string') return;

    await forgotPassword({
      request: { body: { email } },
      state: { auth: ctx.state?.auth },
      send: () => undefined,
    });
  };

  return plugin;
};
