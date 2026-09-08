import type { Core } from '@strapi/strapi';
const jwt = require('jsonwebtoken');

export default async (policyContext: any, config: any, { strapi }: { strapi: Core.Strapi }) => {
  const authHeader = policyContext.request.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }

  const token = authHeader.substring(7);
  const secret = process.env.JWT_SECRET || process.env.ADMIN_JWT_SECRET || 'you-secret-key-fallback';

  try {
    const decoded = jwt.verify(token, secret);
    if (decoded && (decoded.id || decoded.email)) {
      policyContext.state.portalAdmin = decoded;
      return true;
    }
  } catch (err: any) {
    // Dual fallback: also verify against ADMIN_JWT_SECRET if different
    try {
      const adminSecret = process.env.ADMIN_JWT_SECRET || secret;
      const decodedAdmin = jwt.verify(token, adminSecret);
      if (decodedAdmin && (decodedAdmin.id || decodedAdmin.email)) {
        policyContext.state.portalAdmin = decodedAdmin;
        return true;
      }
    } catch {
      return false;
    }
  }

  return false;
};