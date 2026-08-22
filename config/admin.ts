import type { Core } from '@strapi/strapi';

const PREVIEW_PATHS: Record<string, (documentId: string) => string> = {
  'api::project.project': (documentId) => `/projects/${encodeURIComponent(documentId)}`,
  'api::member.member': (documentId) => `/members/${encodeURIComponent(documentId)}`,
  'api::faq.faq': () => '/',
  'api::team-member.team-member': () => '/leadership',
  'api::policy-document.policy-document': () => '/policy-documents',
  'api::about-us.about-us': () => '/about-us',
};

const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Admin => {
  const clientUrl = env('CLIENT_URL', 'http://localhost:5173');
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
          const pathname = PREVIEW_PATHS[uid]?.(documentId);

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