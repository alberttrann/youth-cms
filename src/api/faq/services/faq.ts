import { factories } from '@strapi/strapi';

export default factories.createCoreService('api::faq.faq', ({ strapi }) => ({
  async reorder(documentIds: string[]) {
    if (!Array.isArray(documentIds) || documentIds.length === 0) {
      throw new Error('Reorder requires a non-empty array of FAQ IDs');
    }

    const seen = new Set<string>();
    for (const id of documentIds) {
      if (typeof id !== 'string' || id.length === 0) {
        throw new Error('Each FAQ ID must be a non-empty string');
      }
      if (seen.has(id)) {
        throw new Error(`Duplicate FAQ ID in reorder request: ${id}`);
      }
      seen.add(id);
    }

    for (const id of documentIds) {
      const existing = await strapi.db.query('api::faq.faq').findOne({
        where: { documentId: id },
        select: ['documentId'],
      });
      if (!existing) {
        throw new Error(`Unknown FAQ ID: ${id}`);
      }
    }

    return strapi.db.transaction(async () => {
      const results: { documentId: string; displayOrder: number }[] = [];
      for (let i = 0; i < documentIds.length; i += 1) {
        const documentId = documentIds[i];
        await strapi.documents('api::faq.faq').update({
          documentId,
          data: { displayOrder: i + 1 },
        });
        results.push({ documentId, displayOrder: i + 1 });
      }
      return results;
    });
  },
}));
