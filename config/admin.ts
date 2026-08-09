import type { Core } from '@strapi/strapi';

const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Admin => {
  const clientUrl = env('CLIENT_URL', 'http://localhost:5173').replace(/\/$/, '');
  const previewSecret = env('PREVIEW_SECRET', '');

  return {
    auth: {
      secret: env('ADMIN_JWT_SECRET')!,
    },
    apiToken: {
      salt: env('API_TOKEN_SALT')!,
    },
    transfer: {
      token: {
        salt: env('TRANSFER_TOKEN_SALT')!,
      },
    },
    secrets: {
      encryptionKey: env('ENCRYPTION_KEY')!,
    },
    flags: {
      nps: env.bool('FLAG_NPS', true),
      promoteEE: false,
      docLinks: env.bool('FLAG_DOC_LINKS', true),
    },
    preview: {
      enabled: Boolean(previewSecret),
      config: {
        allowedOrigins: [clientUrl],
        async handler(uid, { documentId, status }) {
          const pathname =
            uid === 'api::project.project'
              ? `/projects/${encodeURIComponent(documentId)}`
              : uid === 'api::member.member'
                ? `/members/${encodeURIComponent(documentId)}`
                : null;

          if (!pathname) return null;

          const params = new URLSearchParams({
            url: pathname,
            secret: previewSecret,
            status: status ?? 'draft',
          });

          return `${clientUrl}/api/preview?${params.toString()}`;
        },
      },
    },
  };
};

export default config;
