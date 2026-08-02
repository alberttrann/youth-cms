const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const STRAPI_TOKEN = process.env.STRAPI_TOKEN || '';

// Map member/org names tới focusSdgs values
const focusSdgsMap = {
  'CSE Global': ['4', '8', '17'],
  'Education Hub Ghana': ['9', '16', '17'],
};

async function updateFocusSdgs() {
  try {
    for (const [orgName, sdgs] of Object.entries(focusSdgsMap)) {
      console.log(`📊 Updating ${orgName} focusSdgs to [${sdgs.join(', ')}]...`);

      // Get member by name
      const getRes = await fetch(
        `${STRAPI_URL}/api/members?filters[name][$eq]=${encodeURIComponent(orgName)}`,
        {
          headers: STRAPI_TOKEN ? { Authorization: `Bearer ${STRAPI_TOKEN}` } : {},
        }
      );

      if (!getRes.ok) throw new Error(`Failed to fetch ${orgName}: ${getRes.status}`);

      const getData = await getRes.json();
      if (!getData.data || getData.data.length === 0) {
        console.warn(`⚠️ ${orgName} not found, skipping`);
        continue;
      }

      const member = getData.data[0];
      const memberId = member.documentId || member.id;

      // Update with focusSdgs
      const updateRes = await fetch(`${STRAPI_URL}/api/members/${memberId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(STRAPI_TOKEN && { Authorization: `Bearer ${STRAPI_TOKEN}` }),
        },
        body: JSON.stringify({ data: { focusSdgs: sdgs } }),
      });

      if (!updateRes.ok) {
        throw new Error(`Failed to update ${orgName}: ${updateRes.status}`);
      }

      console.log(`✅ Updated: ${orgName}`);
    }

    console.log('\n✨ All members updated!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

updateFocusSdgs();
