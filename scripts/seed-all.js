const path = require('path');
require('dotenv').config(); // 👈 Load .env variables
const { createStrapi } = require('@strapi/strapi');

const GLOBAL_SETTING = {
  address: 'Tầng 5, Tòa nhà Y.O.U Global, Hà Nội, Việt Nam',
  email: 'info@youthorgunion.org',
  hotline: '(+84) 98.242.1109',
  operatingTime: 'Phản hồi trong vòng 24–48 giờ',
  bankName: 'MB Bank - Ben Thanh Branch',
  accountNumber: '000999999999',
  accountHolder: 'Youth Organization Union',
  transferSyntaxNote: 'YOUPRJ26 - [Project Names]',
  termsOfServiceUrl: '#',
  privacyPolicyUrl: '#',
  socialLinks: [
    { platform: 'youtube', url: 'https://youtube.com/@you-alliance' },
    { platform: 'facebook', url: 'https://facebook.com/you.alliance' },
    { platform: 'twitter', url: 'https://x.com/you_alliance' },
    { platform: 'instagram', url: 'https://instagram.com/you.alliance' },
    { platform: 'linkedin', url: 'https://linkedin.com/company/you-alliance' },
  ],
};

const FAQS = [
  { question: 'What is the Youth Organization Union (Y.O.U)?', answer: 'Y.O.U is a global alliance bringing together youth-led organizations across 6 continents to collaborate on UN Sustainable Development Goals (SDGs), youth diplomacy, and community empowerment.', displayOrder: 1 },
  { question: 'Who can join the alliance?', answer: 'Both registered youth-led organizations (NGOs, student unions, non-profits) and individual young changemakers applying for Continental or Country Director roles can join.', displayOrder: 2 },
  { question: 'How can our organization apply for membership?', answer: 'Click "Register Your Organization" on our website and complete the 2-step application form with your organizational background and key project impact metrics.', displayOrder: 3 },
  { question: 'Does Y.O.U provide funding for youth projects?', answer: 'Y.O.U connects member organizations with international grants, corporate sponsors, and crowdfunding postboxes to scale impactful local initiatives.', displayOrder: 4 },
  { question: 'What are the criteria for Continental Directors?', answer: 'Continental Directors are experienced youth leaders with proven track records in community organizing, cross-border collaboration, and strategic advocacy in their respective regions.', displayOrder: 5 },
];

const POLICY_DOCUMENTS = [
  { title: 'Y.O.U Constitution & Bylaws 2026', category: 'governance', fileType: 'pdf', fileSize: '2.4 MB' },
  { title: 'Membership Framework & Benefits Guide', category: 'membership', fileType: 'pdf', fileSize: '1.1 MB' },
  { title: 'Annual Global Impact Report 2025', category: 'annual-reports', fileType: 'pdf', fileSize: '5.8 MB' },
  { title: 'Financial & Transparency Statement', category: 'annual-reports', fileType: 'xls', fileSize: '890 KB' },
];

const NEWS_ITEMS = [
  {
    title: 'Global Diplomacy Leadership Certification 2026 Launched',
    excerpt: 'Connecting youth delegates across 30+ countries to foster cross-border diplomacy, strategic leadership, and SDG action.',
    category: 'Asia, Africa',
    date: '2026-05-15',
    author: 'Y.O.U Secretariat',
  },
  {
    title: 'ASEAN-China Youth Innovation & Media Cooperation Summit',
    excerpt: 'Youth leaders convened to discuss AI literacy, digital media diplomacy, and collaborative sustainable development frameworks.',
    category: 'Southeast Asia',
    date: '2026-05-10',
    author: 'Y.O.U Media Team',
  },
  {
    title: 'Sustainable Climate Action & Reforestation Across East Africa',
    excerpt: 'Over 500,000 trees planted in community-led campaigns driving SDG 13 and SDG 15 across Kenya, Uganda, and Tanzania.',
    category: 'Africa',
    date: '2026-05-08',
    author: 'Green Future Initiative',
  },
  {
    title: 'Y.O.U Establishes Strategic Academic Partnerships',
    excerpt: 'Signing of multilateral Memorandums of Understanding with university youth councils to provide certified leadership training.',
    category: 'Global',
    date: '2026-05-01',
    author: 'Y.O.U Partnerships',
  },
];

const TEAM_MEMBERS = [
  {
    name: 'Safin Hussein Mohammed',
    role: 'President - Chair',
    leadershipType: 'executive',
    displayOrder: 1,
    continent: 'Africa',
    year: '2026 - 2027',
    bio: 'Founder of Youth Global Network. Committed to empowering young leaders and driving measurable progress across UN SDGs.\n\nBelieves that unity across borders transforms local potential into global change.',
    focusSdgs: ['4', '8', '17'],
    socialLinks: [{ platform: 'linkedin', url: 'https://linkedin.com' }],
  },
  {
    name: 'Thuy Linh Nguyen T. (Emily)',
    role: 'Vice President - Chair',
    leadershipType: 'executive',
    displayOrder: 2,
    continent: 'Asia',
    year: '2026 - 2027',
    bio: 'Founder of CSE Global. Empowering youth to tackle social challenges through social innovation, education, and cross-cultural exchange.',
    focusSdgs: ['4', '5', '17'],
    socialLinks: [{ platform: 'linkedin', url: 'https://linkedin.com' }],
  },
  {
    name: 'Theodora Abena Yeboah',
    role: 'Vice President - Chair',
    leadershipType: 'executive',
    displayOrder: 3,
    continent: 'Africa',
    year: '2026 - 2027',
    bio: 'Founder of Education Hub Ghana. Dedicated to closing educational inequalities in marginalized communities through youth advocacy and SDG 4.',
    focusSdgs: ['3', '4'],
    socialLinks: [{ platform: 'linkedin', url: 'https://linkedin.com' }],
  },
  {
    name: 'Trần Nguyễn Mai Trinh',
    role: 'Regional Director - Ho Chi Minh City',
    leadershipType: 'continental-director',
    displayOrder: 4,
    continent: 'Asia',
    regionGroup: 'Southeast Asia',
    year: '2026',
    bio: 'Extensive background in international relations and youth delegate programs across Southeast Asia.',
    focusSdgs: ['5', '10', '16'],
    socialLinks: [{ platform: 'linkedin', url: 'https://linkedin.com' }],
  },
  {
    name: 'Lê Mạnh Linh (Henry)',
    role: 'Regional Director - Hanoi',
    leadershipType: 'continental-director',
    displayOrder: 5,
    continent: 'Asia',
    regionGroup: 'Southeast Asia',
    year: '2026',
    bio: 'Senior youth union coordinator focused on digital literacy, quality education, and community volunteering.',
    focusSdgs: ['4', '5', '11'],
  },
  {
    name: 'Nguyễn Thanh Hải (Hai)',
    role: 'Regional Director - Ho Chi Minh City',
    leadershipType: 'continental-director',
    displayOrder: 6,
    continent: 'Asia',
    regionGroup: 'Southeast Asia',
    year: '2026',
    bio: 'International relations coordinator driving youth diplomacy and social development projects.',
    focusSdgs: ['4'],
  },
];

const MEMBERS = [
  {
    name: 'CSE Global',
    country: 'Vietnam',
    continent: 'Asia',
    shortDescription: 'Empowering global youth through social impact initiatives and leadership certification.',
    description: 'CSE Global connects young leaders through learning exchanges, global citizenship programs, and sustainable development projects across Southeast Asia.',
    period: '2021 → present',
    leader: 'Thuy Linh Nguyen',
    focusSdgs: ['4', '10', '17'],
    socialLinks: [{ platform: 'facebook', url: 'https://facebook.com' }],
  },
  {
    name: 'Education Hub Ghana',
    country: 'Ghana',
    continent: 'Africa',
    shortDescription: 'Closing education gaps in marginalized communities through SDG 4 programs.',
    description: 'Education Hub Ghana operates to ensure quality education access for vulnerable youth and build resilient community learning centers.',
    period: '2019 → present',
    leader: 'Theodora Yeboah',
    focusSdgs: ['9', '16', '17'],
    socialLinks: [{ platform: 'linkedin', url: 'https://linkedin.com' }],
  },
  {
    name: 'YouthBridge PH',
    country: 'Philippines',
    continent: 'Asia',
    shortDescription: 'Youth-led local action for social inclusion, disaster resilience, and community services.',
    description: 'YouthBridge PH mobilizes youth leaders in community development, disaster preparedness, and sustainable education outreach.',
    period: '2021 → present',
    leader: 'Maria Santos',
    focusSdgs: ['1', '4', '8'],
    socialLinks: [{ platform: 'facebook', url: 'https://facebook.com' }],
  },
];

const PROJECTS = [
  {
    name: 'Global Diplomacy Leadership Certification',
    description: 'A global training and certification platform empowering youth delegates in international diplomacy, civic innovation, and SDG action.',
    impactIndication: '1,500 Beneficiaries reached, 5,530 training hours delivered',
    region: 'Southeast Asia',
    countriesCovered: 'Vietnam, Cambodia, Laos, Philippines, Ghana',
    focusSdgs: ['4', '8', '17'],
    projectStatus: 'ongoing',
    year: 2026,
    memberName: 'CSE Global',
  },
  {
    name: 'Green Belt Movement',
    description: 'Youth-led reforestation and climate advocacy project planting 500,000+ trees to combat deforestation across East Africa.',
    impactIndication: '500,000 trees planted across 200 communities',
    region: 'East Africa',
    countriesCovered: 'Kenya, Tanzania, Uganda',
    focusSdgs: ['13', '15'],
    projectStatus: 'ongoing',
    year: 2025,
    memberName: 'Education Hub Ghana',
  },
  {
    name: 'Education for All Initiative',
    description: 'Providing digital learning hubs and scholarships for underprivileged youth in remote and mountainous rural provinces.',
    impactIndication: '2,000+ students supported across 15 provinces',
    region: 'Southeast Asia',
    countriesCovered: 'Vietnam, Cambodia, Laos',
    focusSdgs: ['4', '10'],
    projectStatus: 'ongoing',
    year: 2024,
    memberName: 'CSE Global',
  },
];

async function upsertDocument(strapi, uid, data, matchField = 'name') {
  try {
    const filters = {};
    if (data[matchField]) {
      filters[matchField] = data[matchField];
    }

    const existing = Object.keys(filters).length
      ? await strapi.documents(uid).findMany({ filters, status: 'draft', limit: 1 })
      : [];

    let doc;
    if (existing && existing.length) {
      doc = await strapi.documents(uid).update({ documentId: existing[0].documentId, data });
    } else {
      doc = await strapi.documents(uid).create({ data });
    }

    if (doc?.documentId) {
      await strapi.documents(uid).publish({ documentId: doc.documentId });
    }
    return doc;
  } catch (err) {
    console.error(`Error upserting ${uid}:`, err.message);
  }
}

async function seedAll() {
  console.log('🌱 Starting comprehensive Strapi database seeding...\n');
  
  const appDir = path.resolve(__dirname, '..');
  const distDir = path.resolve(appDir, 'dist');

  // 👈 Tell Strapi to load the compiled config from dist/
  const strapi = await createStrapi({ appDir, distDir }).load();

  try {
    // 1. Global Setting
    await upsertDocument(strapi, 'api::global-setting.global-setting', GLOBAL_SETTING, 'email');
    console.log('✅ Global Setting seeded');

    // 2. FAQs
    for (const faq of FAQS) {
      await upsertDocument(strapi, 'api::faq.faq', faq, 'question');
    }
    console.log(`✅ ${FAQS.length} FAQs seeded`);

    // 3. Policy Documents
    for (const doc of POLICY_DOCUMENTS) {
      await upsertDocument(strapi, 'api::policy-document.policy-document', doc, 'title');
    }
    console.log(`✅ ${POLICY_DOCUMENTS.length} Policy Documents seeded`);

    // 4. News Items
    for (const news of NEWS_ITEMS) {
      await upsertDocument(strapi, 'api::news-item.news-item', news, 'title');
    }
    console.log(`✅ ${NEWS_ITEMS.length} News Items seeded`);

    // 5. Team Members (Leadership)
    for (const member of TEAM_MEMBERS) {
      await upsertDocument(strapi, 'api::team-member.team-member', member, 'name');
    }
    console.log(`✅ ${TEAM_MEMBERS.length} Leadership Team Members seeded`);

    // 6. Member Organizations
    const memberIdMap = {};
    for (const member of MEMBERS) {
      const doc = await upsertDocument(strapi, 'api::member.member', member, 'name');
      if (doc?.documentId) {
        memberIdMap[member.name] = doc.documentId;
      }
    }
    console.log(`✅ ${MEMBERS.length} Member Organizations seeded`);

    // 7. Projects (Linked to Member IDs)
    for (const { memberName, ...proj } of PROJECTS) {
      const memberDocId = memberIdMap[memberName];
      await upsertDocument(
        strapi,
        'api::project.project',
        { ...proj, member: memberDocId || undefined },
        'name'
      );
    }
    console.log(`✅ ${PROJECTS.length} Projects seeded (linked to members)`);

    console.log('\n🎉 Comprehensive database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    await strapi.destroy();
    process.exit(0);
  }
}

seedAll();