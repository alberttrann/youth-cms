/**
 * Seed 2 members + 3 projects from the Y.O.U frontend mock data.
 *
 * Runs through the Document Service (in-process), so it needs no API token
 * and creates no credentials. Idempotent: matches on `name`, updates if found.
 *
 *   { cat scripts/seed.js; printf '\nawait seed()\n.exit\n'; } |
 *     ENV_PATH=.env.local PORT=1338 NODE_OPTIONS=--no-network-family-autoselection npx strapi console
 *
 * Media fields (logo/cover/gallery/donationQr) are left empty — those need
 * real uploads through Cloudinary, not URL strings.
 */

const MEMBERS = [
  {
    name: 'Youth for Education Foundation',
    shortDescription:
      'Empowering youth through quality education programs across Southeast Asia.',
    description:
      'Youth for Education Foundation is dedicated to providing quality education and skill development programs for underprivileged youth in Southeast Asia. Our programs reach over 5,000 young people annually.',
    country: 'Vietnam',
    continent: 'Asia',
    focusSdgs: ['4', '10', '17'],
    period: '2019 → nay',
    leader: 'Dr. Hue Tran',
    socialLinks: [
      { platform: 'facebook', url: 'https://facebook.com/yef' },
      { platform: 'instagram', url: 'https://instagram.com/yef' },
    ],
  },
  {
    name: 'Green Future Initiative',
    shortDescription: 'Leading climate action and environmental sustainability projects.',
    description:
      'Green Future Initiative mobilizes young people to take climate action through tree planting, waste management, and renewable energy advocacy across Africa.',
    country: 'Kenya',
    continent: 'Africa',
    focusSdgs: ['13', '15', '7'],
    period: '2020 → nay',
    leader: 'James Kipchoge',
    socialLinks: [
      { platform: 'twitter', url: 'https://twitter.com/greenfuture' },
      { platform: 'linkedin', url: 'https://linkedin.com/company/greenfuture' },
    ],
  },
];

// `memberName` is resolved to a documentId after members are created.
const PROJECTS = [
  {
    name: 'Education for All Initiative',
    description:
      'A comprehensive program providing quality education access to underprivileged youth in rural Vietnam through mobile learning centers and scholarship programs.',
    impactIndication: 'Reached 2,000+ students in 15 provinces',
    region: 'Southeast Asia',
    countriesCovered: '["Vietnam","Cambodia","Laos"]',
    focusSdgs: ['4', '10'],
    projectStatus: 'ongoing',
    year: 2022,
    memberName: 'Youth for Education Foundation',
  },
  {
    name: 'Green Belt Movement',
    description:
      'Youth-led reforestation project planting 1 million trees across East Africa to combat deforestation and climate change.',
    impactIndication: '500,000 trees planted, 200 communities engaged',
    region: 'East Africa',
    countriesCovered: '["Kenya","Tanzania","Uganda"]',
    focusSdgs: ['13', '15'],
    projectStatus: 'ongoing',
    year: 2021,
    memberName: 'Green Future Initiative',
  },
  {
    name: 'Digital Literacy Campaign',
    description:
      'Providing digital skills training and internet access to youth in remote areas through community tech hubs.',
    impactIndication: '3,000 youth trained in digital skills',
    region: 'Southeast Asia',
    countriesCovered: '["Vietnam","Philippines"]',
    focusSdgs: ['4', '9'],
    projectStatus: 'completed',
    year: 2023,
    memberName: 'Youth for Education Foundation',
  },
];

/** Create-or-update by `name`, then publish. Returns the document. */
async function upsert(uid, data) {
  const existing = await strapi.documents(uid).findMany({
    filters: { name: data.name },
    status: 'draft',
    limit: 1,
  });

  const doc = existing.length
    ? await strapi.documents(uid).update({ documentId: existing[0].documentId, data })
    : await strapi.documents(uid).create({ data });

  // Publish so the REST API (which defaults to published) can see it.
  await strapi.documents(uid).publish({ documentId: doc.documentId });
  return doc;
}

async function seed() {
  const memberIds = {};

  for (const member of MEMBERS) {
    const doc = await upsert('api::member.member', member);
    memberIds[member.name] = doc.documentId;
    console.log(`member  ✔ ${member.name} (${doc.documentId})`);
  }

  for (const { memberName, ...project } of PROJECTS) {
    const member = memberIds[memberName];
    if (!member) throw new Error(`No member for project ${project.name}`);
    const doc = await upsert('api::project.project', { ...project, member });
    console.log(`project ✔ ${project.name} → ${memberName} (${doc.documentId})`);
  }

  const members = await strapi.documents('api::member.member').count({ status: 'published' });
  const projects = await strapi.documents('api::project.project').count({ status: 'published' });
  console.log(`\npublished: ${members} members, ${projects} projects`);
}

module.exports = { seed };
