import type { Core } from '@strapi/strapi';

export async function synchronizeMembershipDetailsLayout(strapi: Core.Strapi) {
  const marker = strapi.store({ type: 'core', name: 'membership-details-layout' });
  if (await marker.get({ key: 'v1' })) return;
  const service = strapi.plugin('content-manager').service('content-types');
  const schemas: Record<string, Record<string, string>> = {
    'api::organization-application.organization-application': {
      facebookUrl: 'Social Media Profile — Facebook',
      instagramUrl: 'Social Media Profile — Instagram',
      linkedinUrl: 'Social Media Profile — LinkedIn',
      organizationImage: 'Organization Card Cover / Legacy Organization Images',
      organizationLogo: 'Organization Logo',
      organizationActivityPhotos: 'Photos of Organizational Activities',
    },
    'api::leadership-application.leadership-application': {
      position: 'Position', assessment: 'Assessment Center — Answers',
      resumeCv: 'CV / Portfolio', orgProfileDoc: 'Organization Profile Document',
      leadershipProofDoc: 'Proof of Leadership Experience', additionalDocs: 'Additional Supporting Documents',
    },
  };
  for (const [uid, labels] of Object.entries(schemas)) {
    const model = strapi.contentTypes[uid as keyof typeof strapi.contentTypes];
    const configuration = await service.findConfiguration(model);
    const metadatas = { ...configuration.metadatas };
    for (const [name, label] of Object.entries(labels)) {
      metadatas[name] = {
        ...metadatas[name], edit: { ...metadatas[name]?.edit, label },
        list: { ...metadatas[name]?.list, label },
      };
    }
    // Keep the historical portfolio URL attribute/data, but use one upload input.
    const edit = configuration.layouts.edit.map((row: { name: string; size: number }[]) =>
      uid.includes('leadership-application') ? row.filter(field => field.name !== 'portfolio') : row
    ).filter((row: unknown[]) => row.length);
    const visible = new Set(edit.flat().map((field: { name: string }) => field.name));
    for (const name of Object.keys(labels)) if (!visible.has(name)) edit.push([{ name, size: 12 }]);
    await service.updateConfiguration(model, {
      ...configuration, metadatas, layouts: { ...configuration.layouts, edit },
    });
  }
  await marker.set({ key: 'v1', value: true });
}
