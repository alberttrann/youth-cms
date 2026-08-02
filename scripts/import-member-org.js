const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const STRAPI_TOKEN = process.env.STRAPI_TOKEN || '';

const memberData = {
  name: 'Education Hub Ghana',
  country: 'Ghana',
  continent: 'Africa',
  shortDescription: 'Education Hub Ghana was established to close education gaps in marginalized communities.',
  description: 'We operate within the framework of SDG4 to ensure no child is left behind in attaining quality education. Our focus is on providing quality education and building strong institutions.',
  leader: 'Theodora Yeboah',
  period: 'Since 2019',
  focusSdgs: ['9', '16', '17'],
};

async function importMember() {
  try {
    console.log('📊 Importing Education Hub Ghana...');

    const response = await fetch(`${STRAPI_URL}/api/members`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(STRAPI_TOKEN && { 'Authorization': `Bearer ${STRAPI_TOKEN}` }),
      },
      body: JSON.stringify({ data: memberData }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to import member: ${response.status} - ${error}`);
    }

    const result = await response.json();
    const memberName = result.data?.attributes?.name || result.data?.name || 'Unknown';
    console.log(`✅ Imported: ${memberName}`);
    console.log('✨ Import complete!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

importMember();
