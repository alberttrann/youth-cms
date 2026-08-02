const { leadershipData } = require('./seed-leadership');

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const STRAPI_TOKEN = process.env.STRAPI_TOKEN || '';

async function importLeadership() {
  const allMembers = [...leadershipData.executives, ...leadershipData.directors];
  
  console.log(`\n📊 Importing ${allMembers.length} leadership members to ${STRAPI_URL}\n`);
  
  for (const member of allMembers) {
    try {
      const response = await fetch(`${STRAPI_URL}/api/team-members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(STRAPI_TOKEN && { 'Authorization': `Bearer ${STRAPI_TOKEN}` }),
        },
        body: JSON.stringify({ data: member }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error(`❌ Failed to import ${member.name}: ${response.status}`);
        console.error(error);
        continue;
      }

      const result = await response.json();
      console.log(`✅ Imported: ${member.name} (${member.leadershipType})`);
    } catch (err) {
      console.error(`❌ Error importing ${member.name}:`, err.message);
    }
  }

  console.log(`\n✨ Import complete!\n`);
}

importLeadership().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
