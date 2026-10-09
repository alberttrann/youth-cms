import type { Core } from '@strapi/strapi';

/** Apply only this application's contact labels, preserving other admin customizations. */
export async function synchronizeOrganizationContactLayout(strapi: Core.Strapi) {
  const marker = strapi.store({ type: 'core', name: 'organization-contact-layout' });
  if (await marker.get({ key: 'v1' })) return;

  const uid = 'api::organization-application.organization-application';
  const model = strapi.contentTypes[uid];
  const service = strapi.plugin('content-manager').service('content-types');
  const configuration = await service.findConfiguration(model);
  const labels: Record<string, string> = {
    representativeFullName: "Head of Organization's Full Name",
    representativeEmail: "Head of Organization's Email",
    representativePhone: "Head of Organization's Phone Number",
    representativePhoneCode: "Head of Organization's Phone Country Code",
    isPrimaryContact: 'Head of Organization Is Primary Contact',
    contactPersonFullName: "Contact Person's Full Name",
    contactPersonEmail: "Contact Person's Email",
    contactPersonPhone: "Contact Person's Phone Number",
    contactPersonPhoneCode: "Contact Person's Phone Country Code",
  };
  const metadatas = { ...configuration.metadatas };
  for (const [name, label] of Object.entries(labels)) {
    metadatas[name] = {
      ...metadatas[name],
      edit: { ...metadatas[name]?.edit, label },
      list: { ...metadatas[name]?.list, label },
    };
  }
  const edit = [...configuration.layouts.edit];
  const visibleFields = new Set(edit.flat().map((field: { name: string }) => field.name));
  for (const name of Object.keys(labels)) {
    if (!visibleFields.has(name)) edit.push([{ name, size: 6 }]);
  }
  await service.updateConfiguration(model, {
    ...configuration, metadatas, layouts: { ...configuration.layouts, edit },
  });
  await marker.set({ key: 'v1', value: true });
}
