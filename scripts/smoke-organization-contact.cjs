// Uses a disposable SQLite database and local server; never loads production .env.
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const crypto = require('node:crypto');
const repo = path.resolve(__dirname, '..');
const database = `.tmp/contact-smoke-${crypto.randomUUID()}.db`;
fs.mkdirSync(path.join(repo, '.tmp'), { recursive: true });
Object.assign(process.env, {
  ENV_PATH: path.join(repo, '.tmp', 'contact-smoke-no-env'),
  NODE_ENV: 'production', HOST: '127.0.0.1', PORT: '0',
  DATABASE_CLIENT: 'sqlite', DATABASE_FILENAME: database, DATABASE_URL: '', SMTP_HOST: '',
  APP_KEYS: 'contact-test-1,contact-test-2,contact-test-3,contact-test-4',
  API_TOKEN_SALT: 'contact-test-token-salt', ADMIN_JWT_SECRET: 'contact-test-admin-secret',
  JWT_SECRET: 'contact-test-jwt-secret', TRANSFER_TOKEN_SALT: 'contact-test-transfer-salt',
  ENCRYPTION_KEY: 'contact-test-encryption-key',
  STRAPI_TELEMETRY_DISABLED: 'true',
});

async function main() {
  const { createStrapi } = require('@strapi/strapi');
  const app = createStrapi({ appDir: repo, distDir: path.join(repo, 'dist') });
  // Background telemetry/licensing jobs are unrelated to this persistence test
  // and can outlive Strapi shutdown. Do not schedule them in this test server.
  app.cron.start = () => app.cron;
  try {
    await app.start();
    const port = app.server.httpServer.address().port;
    // Register local media metadata to test relations without calling Cloudinary.
    const mediaIds = [];
    for (const name of ['cover.jpg', 'activity.jpg', 'profile.jpg', 'cv.pdf', 'org.pdf', 'proof.pdf', 'extra.pdf']) {
      const media = await app.db.query('plugin::upload.file').create({ data: {
        name, hash: name.replace('.', '_'), ext: path.extname(name),
        mime: name.endsWith('.jpg') ? 'image/jpeg' : 'application/pdf', size: 1,
        url: `/uploads/${name}`, provider: 'local',
      } });
      mediaIds.push(media.id);
    }
    const base = {
      organizationName: 'Contact Smoke Test', organizationDescription: 'Test organization',
      representativeFullName: 'Organization Head', representativeEmail: 'head@example.com',
      representativePhone: '2025550101', representativePhoneCode: '+1',
      yearOfEstablishment: 2021, country: 'Vietnam', address: 'Test address', email: 'org@example.com',
      focusArea: 'Education', focusSdgs: ['4'], projectName: 'Test Project',
      projectOrganizationName: 'Contact Smoke Test', projectDescription: 'Test project',
      projectLedBy: 'Test Lead', socialImpactMetrics: '100 participants', region: 'Southeast Asia',
      countriesCovered: 'Vietnam', projectFocusSdgs: ['4'], projectStatus: 'ongoing',
      projectSocialProfile: 'https://example.com/project',
      facebookUrl: 'https://facebook.com/test', instagramUrl: 'https://instagram.com/test',
      linkedinUrl: 'https://linkedin.com/company/test',
      organizationImage: [mediaIds[0]], organizationActivityPhotos: [mediaIds[1]],
    };
    for (const contact of [
      { isPrimaryContact: 'no', contactPersonFullName: 'Separate Contact',
        contactPersonEmail: 'contact@example.com', contactPersonPhone: '901234567', contactPersonPhoneCode: '+84' },
      { isPrimaryContact: 'yes', contactPersonFullName: base.representativeFullName,
        contactPersonEmail: base.representativeEmail, contactPersonPhone: base.representativePhone,
        contactPersonPhoneCode: base.representativePhoneCode },
      {}, // Cached old frontends can still submit without the new contact fields.
    ]) {
      const response = await fetch(`http://127.0.0.1:${port}/api/organization-applications`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: { ...base, ...contact } }),
      });
      const body = await response.json();
      assert.equal(response.status, 201, JSON.stringify(body));
      const saved = await app.documents('api::organization-application.organization-application')
        .findOne({ documentId: body.data.documentId, populate: ['organizationImage', 'organizationActivityPhotos'] });
      for (const [field, value] of Object.entries(contact)) assert.equal(saved[field], value);
      assert.equal(saved.representativeFullName, base.representativeFullName);
      assert.equal(saved.facebookUrl, base.facebookUrl);
      assert.equal(saved.instagramUrl, base.instagramUrl);
      assert.equal(saved.linkedinUrl, base.linkedinUrl);
      assert.equal(saved.organizationImage[0].id, mediaIds[0]);
      assert.equal(saved.organizationActivityPhotos[0].id, mediaIds[1]);
    }
    const model = app.contentTypes['api::organization-application.organization-application'];
    const configuration = await app.plugin('content-manager').service('content-types').findConfiguration(model);
    assert.equal(configuration.metadatas.representativeFullName.edit.label, "Head of Organization's Full Name");
    assert.equal(configuration.metadatas.contactPersonEmail.edit.label, "Contact Person's Email");
    assert(configuration.layouts.edit.flat().some(field => field.name === 'contactPersonFullName'));
    for (const field of ['facebookUrl', 'instagramUrl', 'linkedinUrl', 'organizationActivityPhotos']) {
      assert(configuration.layouts.edit.flat().some(item => item.name === field));
    }
    const assessment = { orgName: 'Test Org', majorAchievements: 'Achievement', motivation: 'Motivation',
      contributionToYou: 'Vision', commitHours: true, declarationAgreed: true, declarationSignature: 'Applicant' };
    const candidate = {
      position: 'Continental Director', fullName: 'Applicant', sex: 'male', dateOfBirth: '2000-01-01',
      nationality: 'Vietnam', countryOfResidence: 'Vietnam', cityTown: 'Hanoi', email: 'test@example.com',
      whatsappNumber: '+84901234567', continent: 'Asia', region: 'Southeast Asia',
      assessment: { ...assessment, appliedPosition: 'Continental Director' },
      profilePhoto: mediaIds[2], resumeCv: [mediaIds[3]], orgProfileDoc: [mediaIds[4]],
      leadershipProofDoc: [mediaIds[5]], additionalDocs: [mediaIds[6]],
    };
    const response = await fetch(`http://127.0.0.1:${port}/api/leadership-applications`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ data: candidate }),
    });
    const body = await response.json();
    assert.equal(response.status, 201, JSON.stringify(body));
    const saved = await app.documents('api::leadership-application.leadership-application').findOne({
      documentId: body.data.documentId, populate: ['resumeCv', 'orgProfileDoc', 'leadershipProofDoc', 'additionalDocs'],
    });
    assert.equal(saved.position, candidate.position);
    assert.deepEqual(saved.assessment, candidate.assessment);
    for (const field of ['resumeCv', 'orgProfileDoc', 'leadershipProofDoc', 'additionalDocs']) {
      assert.deepEqual(saved[field].map(file => file.id), candidate[field]);
    }
    const leadershipConfig = await app.plugin('content-manager').service('content-types')
      .findConfiguration(app.contentTypes['api::leadership-application.leadership-application']);
    assert.equal(leadershipConfig.metadatas.resumeCv.edit.label, 'CV / Portfolio');
    for (const field of ['position', 'orgProfileDoc', 'leadershipProofDoc', 'additionalDocs']) {
      assert(leadershipConfig.layouts.edit.flat().some(item => item.name === field));
    }
    console.log('PASS: Org social profiles/activity photos and Individual Position/assessment/documents');
    console.log('PASS: separate contact, head contact, legacy submission, saved records and admin labels');
  } finally {
    await app.destroy();
    for (const suffix of ['', '-wal', '-shm']) fs.rmSync(path.join(repo, database + suffix), { force: true });
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
