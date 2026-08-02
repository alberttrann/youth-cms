const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const STRAPI_TOKEN = process.env.STRAPI_TOKEN || '';

const projectData = {
  name: 'Global Diplomacy Leadership Certification',
  description: 'A social media platform connecting and fostering global citizenship. We have developed three core product models capable of serving users aged 05-60 to discover potentials, encourage development, and international recognition.',
  impactIndication: '1,500 Beneficiaries, 5,530 hours training, $500,000 USD SROI',
  region: 'Southeast Asia',
  countriesCovered: 'Vietnam, Morocco, Libya, Iraq, Yemen',
  focusSdgs: ['4', '8', '17'],
  projectStatus: 'ongoing',
  year: 2024,
};

const cseGlobalMember = {
  name: 'CSE Global',
  country: 'Vietnam',
  continent: 'Asia',
  shortDescription: 'Empowering global youth through social impact initiatives and leadership certification programs.',
};

async function importProject() {
  try {
    // 1. Create or get CSE Global member
    console.log('📊 Creating/linking CSE Global member...');
    const memberRes = await fetch(`${STRAPI_URL}/api/members`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(STRAPI_TOKEN && { 'Authorization': `Bearer ${STRAPI_TOKEN}` }),
      },
      body: JSON.stringify({ data: cseGlobalMember }),
    });

    if (!memberRes.ok) {
      throw new Error(`Failed to create member: ${memberRes.status}`);
    }

    const memberData = await memberRes.json();
    const memberId = memberData.data.documentId || memberData.data.id;
    console.log(`✅ CSE Global member created/linked (ID: ${memberId})`);

    // 2. Create project with member reference
    const projectPayload = {
      ...projectData,
      member: memberId,
    };

    console.log('📊 Creating Global Diplomacy project...');
    const projectRes = await fetch(`${STRAPI_URL}/api/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(STRAPI_TOKEN && { 'Authorization': `Bearer ${STRAPI_TOKEN}` }),
      },
      body: JSON.stringify({ data: projectPayload }),
    });

    if (!projectRes.ok) {
      throw new Error(`Failed to create project: ${projectRes.status}`);
    }

    const projectDataRes = await projectRes.json();
    const projectName = projectDataRes.data?.attributes?.name || projectDataRes.data?.name || 'Unknown';
    console.log(`✅ Project created: ${projectName}`);
    console.log('✨ Import complete!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

importProject();
