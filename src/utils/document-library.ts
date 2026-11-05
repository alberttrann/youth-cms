import type { Core } from '@strapi/strapi';
import { errors } from '@strapi/utils';
import legalDocuments from '../data/legal-documents.json';

const UID = 'api::policy-document.policy-document' as const;
export const DOCUMENT_SECTIONS = [
  ['charter', 'Y.O.U Charter', 'governance', 'archive'],
  ['governance-policy', 'Governance Policy', 'governance', 'archive'],
  ['protocol', 'Protocol', 'governance', 'slides'],
  ['code-of-conduct', 'Code of Conduct', 'governance', 'archive'],
  ['donation-terms', 'Donation Terms', 'governance', 'archive'],
  ['bluebook', 'Bluebook', 'governance', 'slides'],
  [
    'community-guidelines',
    'Community & Content Guidelines',
    'governance',
    'archive',
  ],
  ['membership-agreement', 'Membership Agreement', 'membership', 'archive'],
  ['careers', 'Careers', 'membership', 'archive'],
  ['operational-guidelines', 'Operational Guidelines', 'membership', 'archive'],
  ['annual-report', 'Annual Report', 'annual-reports', 'annual-report'],
  ['terms-of-service', 'Terms of Service', 'legal', 'legal'],
  ['privacy-policy', 'Privacy Policy', 'legal', 'legal'],
] as const;

export function registerDocumentLibraryMiddleware(strapi: Core.Strapi) {
  strapi.documents.use(async (context, next) => {
    if (context.uid === UID && ['create', 'update'].includes(context.action)) {
      const params = context.params as {
        data?: Record<string, any>;
        documentId?: string;
      };
      const data = params.data;
      if (data) {
        const previous =
          !data.section && params.documentId
            ? await strapi
                .documents(UID)
                .findOne({ documentId: params.documentId })
            : null;
        const section = DOCUMENT_SECTIONS.find(
          (item) => item[0] === (data.section || previous?.section),
        );
        if (section) {
          data.category = section[2];
          data.displayMode = section[3];
        }
        if (section?.[2] === 'legal') data.slug = section[0];
        if (section && section[0] !== 'careers') data.continent = null;
        if (data.revision && !/^(?:v?\d+\.\d+|\d+)$/.test(data.revision)) {
          throw new errors.ValidationError(
            'Version must have the form 0.0, for example 1.2.',
          );
        }
        for (const item of [
          data,
          ...(Array.isArray(data.archives) ? data.archives : []),
        ]) {
          for (const field of ['url', 'externalUrl', 'embedUrl']) {
            if (!item[field]) continue;
            try {
              const url = new URL(item[field]);
              if (url.protocol !== 'https:' || url.username || url.password)
                throw new Error();
            } catch {
              throw new errors.ValidationError(
                'Document links must be public HTTPS URLs, not iframe HTML.',
              );
            }
          }
        }
      }
    }
    return next();
  });
}

// Run once, preserving existing drafts, edited bodies and all historical files.
export async function initializeDocumentLibrary(strapi: Core.Strapi) {
  const store = strapi.store({ type: 'core', name: 'document-library' });
  if (await store.get({ key: 'v1' })) return;
  for (const item of legalDocuments) {
    const existing = await strapi
      .documents(UID)
      .findMany({
        filters: {
          section: item.data.section as 'terms-of-service' | 'privacy-policy',
        },
        status: 'draft',
        limit: 1,
      });
    if (!existing.length) {
      await strapi
        .documents(UID)
        .create({ data: item.data as any, status: 'published' });
    }
  }
  let order = 0;
  for (const [
    section,
    title,
    category,
    displayMode,
  ] of DOCUMENT_SECTIONS.filter(
    (item) => item[2] !== 'legal' && item[0] !== 'annual-report',
  )) {
    const continents =
      section === 'careers'
        ? (['Africa', 'America', 'Asia', 'Australia', 'Europe'] as const)
        : ([undefined] as const);
    for (const continent of continents) {
      const slug = continent ? `careers-${continent.toLowerCase()}` : section;
      const existing = await strapi
        .documents(UID)
        .findMany({
          filters: {
            $or: [
              { slug },
              { title: continent ? `Careers - ${continent}` : title },
              { section, ...(continent ? { continent } : {}) },
            ],
          },
          status: 'draft',
          limit: 1,
        });
      // Classify a matching legacy entry rather than creating a duplicate. Update
      // metadata on both stored variants without publishing any draft body.
      if (existing[0] && !existing[0].section)
        await strapi.db.query(UID).updateMany({
          where: {
            documentId: existing[0].documentId,
            section: { $null: true },
          },
          data: {
            section,
            category,
            displayMode,
            ...(existing[0].slug ? {} : { slug }),
            ...(continent ? { continent } : {}),
          },
        });
      if (!existing.length)
        await strapi.documents(UID).create({
          data: {
            title: continent ? `Careers - ${continent}` : title,
            slug,
            section,
            category,
            displayMode,
            ...(continent ? { continent } : {}),
            displayOrder: order++,
            revision: '0.0',
          },
          status: 'draft',
        });
    }
  }
  // Transfer the existing bundled JD listing to CMS; its original URL is kept.
  const jdTitle = 'Job Description for Continental Directors';
  const existingJd = await strapi
    .documents(UID)
    .findMany({ filters: { title: jdTitle }, status: 'draft', limit: 1 });
  if (existingJd[0] && !existingJd[0].section)
    await strapi.db.query(UID).updateMany({
      where: { documentId: existingJd[0].documentId, section: { $null: true } },
      data: {
        section: 'careers',
        category: 'membership',
        displayMode: 'archive',
        ...(existingJd[0].slug ? {} : { slug: 'continental-directors-jd' }),
      },
    });
  if (!existingJd.length)
    await strapi.documents(UID).create({
      data: {
        title: jdTitle,
        slug: 'continental-directors-jd',
        category: 'membership',
        section: 'careers',
        revision: '0.0',
        effectiveDate: '2026-09-09',
        displayMode: 'archive',
        externalUrl:
          'https://youthorgunion.com/documents/job-description-for-continental-directors.pdf',
      },
      status: 'published',
    });
  await store.set({ key: 'v1', value: true });
}

export async function synchronizeDocumentLibraryLayout(strapi: Core.Strapi) {
  const marker = strapi.store({
    type: 'core',
    name: 'document-library-layout',
  });
  if (await marker.get({ key: 'v1' })) return;
  const service = strapi.plugin('content-manager').service('content-types');
  const model = strapi.contentTypes[UID];
  const configuration = await service.findConfiguration(model);
  const labels: Record<string, string> = {
    title: 'Document Title',
    section: 'Website Section',
    slug: 'Stable Page Slug',
    category: 'Category (set automatically from Section)',
    continent: 'Careers - Continent',
    revision: 'Version (e.g. 0.0)',
    effectiveDate: 'Effective / Report Date',
    displayMode: 'Display Mode (set automatically from Section)',
    externalUrl: 'Public Source Link',
    embedUrl: 'Optional Published Embed URL',
    content: 'Embedded Page Content',
    coverImage: 'Annual Report Card Image',
    slideImages: 'Protocol / Bluebook Slides',
    archives: 'Archived Versions (separate frozen public links)',
    displayOrder: 'Display Order',
    file: 'Optional File',
  };
  const metadatas = { ...configuration.metadatas };
  const edit = [...configuration.layouts.edit];
  const visible = new Set(
    edit.flat().map((field: { name: string }) => field.name),
  );
  for (const [name, label] of Object.entries(labels)) {
    metadatas[name] = {
      ...metadatas[name],
      edit: { ...metadatas[name]?.edit, label },
      list: { ...metadatas[name]?.list, label },
    };
    if (!visible.has(name)) edit.push([{ name, size: 12 }]);
  }
  await service.updateConfiguration(model, {
    ...configuration,
    metadatas,
    layouts: { ...configuration.layouts, edit },
  });
  await marker.set({ key: 'v1', value: true });
}
