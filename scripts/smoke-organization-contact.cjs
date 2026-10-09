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
        .findOne({ documentId: body.data.documentId });
      for (const [field, value] of Object.entries(contact)) assert.equal(saved[field], value);
      assert.equal(saved.representativeFullName, base.representativeFullName);
    }
    const model = app.contentTypes['api::organization-application.organization-application'];
    const configuration = await app.plugin('content-manager').service('content-types').findConfiguration(model);
    assert.equal(configuration.metadatas.representativeFullName.edit.label, "Head of Organization's Full Name");
    assert.equal(configuration.metadatas.contactPersonEmail.edit.label, "Contact Person's Email");
    assert(configuration.layouts.edit.flat().some(field => field.name === 'contactPersonFullName'));
    console.log('PASS: separate contact, head contact, legacy submission, saved records and admin labels');
  } finally {
    await app.destroy();
    for (const suffix of ['', '-wal', '-shm']) fs.rmSync(path.join(repo, database + suffix), { force: true });
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
