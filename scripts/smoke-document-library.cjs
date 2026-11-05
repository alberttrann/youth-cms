// Disposable local SQLite only. No production env, media provider or user data.
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const crypto = require('node:crypto');
const repo = path.resolve(__dirname, '..');
const database = `.tmp/documents-smoke-${crypto.randomUUID()}.db`;
fs.mkdirSync(path.join(repo, '.tmp'), { recursive: true });
Object.assign(process.env, {
  ENV_PATH: path.join(repo, '.tmp', 'documents-no-env'),
  NODE_ENV: 'production',
  HOST: '127.0.0.1',
  PORT: '0',
  DATABASE_CLIENT: 'sqlite',
  DATABASE_FILENAME: database,
  DATABASE_URL: '',
  SMTP_HOST: '',
  APP_KEYS: 'docs-1,docs-2,docs-3,docs-4',
  API_TOKEN_SALT: 'docs-test-salt',
  ADMIN_JWT_SECRET: 'docs-test-admin',
  JWT_SECRET: 'docs-test-jwt',
  TRANSFER_TOKEN_SALT: 'docs-test-transfer',
  ENCRYPTION_KEY: 'docs-test-encryption',
  STRAPI_TELEMETRY_DISABLED: 'true',
});

async function main() {
  const { createStrapi } = require('@strapi/strapi');
  const app = createStrapi({ appDir: repo, distDir: path.join(repo, 'dist') });
  app.cron.start = () => app.cron;
  try {
    await app.start();
    const base = `http://127.0.0.1:${app.server.httpServer.address().port}/api/policy-documents`;
    const token = app.config.get('portal.masterKey');
    assert(token, 'Local portal API token configured');
    const request = async (query = '', options = {}, staff = false) => {
      const response = await fetch(base + query, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(staff ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const json = await response.json();
      return { response, json };
    };
    const api = app.documents('api::policy-document.policy-document');
    const seeded = await api.findMany({
      status: 'draft',
      limit: 100,
      populate: ['archives'],
    });
    assert.equal(
      seeded.filter((item) => item.section === 'careers' && item.continent)
        .length,
      5,
    );
    const legalSeed = require('../src/data/legal-documents.json');
    for (const item of legalSeed) {
      const saved = seeded.find((doc) => doc.slug === item.data.slug);
      assert(saved);
      assert.deepEqual(saved.content, item.data.content);
      assert(saved.content.length > 50, 'Complete PDF body, not a summary');
    }
    const publicList = await request('?status=draft&pagination[pageSize]=100');
    assert.equal(publicList.response.status, 200);
    assert.equal(
      publicList.json.data.length,
      3,
      'Public draft query only returns 2 legal pages and existing JD',
    );
    const staffList = await request(
      '?status=draft&pagination[pageSize]=100',
      {},
      true,
    );
    assert.equal(
      staffList.response.status,
      200,
      JSON.stringify(staffList.json),
    );
    assert.equal(
      staffList.json.data.length,
      seeded.length,
      'Portal can edit all drafts',
    );
    const body = (data) => JSON.stringify({ data });
    const create = await request(
      '?status=draft',
      {
        method: 'POST',
        body: body({
          title: 'Smoke Charter',
          slug: 'smoke-charter',
          section: 'charter',
          revision: '1.0',
          effectiveDate: '2026-09-09',
          externalUrl: 'https://docs.google.com/document/d/test/preview',
          archives: [
            {
              revision: '0.0',
              effectiveDate: '2026-01-01',
              url: 'https://example.com/old.pdf',
            },
          ],
        }),
      },
      true,
    );
    assert.equal(create.response.status, 201, JSON.stringify(create.json));
    const id = create.json.data.documentId;
    assert.equal(create.json.data.category, 'governance');
    const filter = `?filters[slug][$eq]=smoke-charter&populate=archives`;
    assert.equal((await request(filter)).json.data.length, 0);
    let published = await request(
      `/${id}?status=published`,
      { method: 'PUT', body: body({}) },
      true,
    );
    assert.equal(
      published.response.status,
      200,
      JSON.stringify(published.json),
    );
    let visible = (await request(filter)).json.data[0];
    assert.equal(visible.archives[0].url, 'https://example.com/old.pdf');
    await request(
      `/${id}?status=draft`,
      { method: 'PUT', body: body({ title: 'Unpublished draft title' }) },
      true,
    );
    assert.equal((await request(filter)).json.data[0].title, 'Smoke Charter');
    const update = await request(
      `/${id}?status=published`,
      { method: 'PUT', body: body({ title: 'Published title' }) },
      true,
    );
    assert.equal(update.response.status, 200, JSON.stringify(update.json));
    visible = (await request(filter)).json.data[0];
    assert.equal(visible.title, 'Published title');
    assert.equal(visible.archives.length, 1, 'Metadata edit retains archives');
    const invalid = await request(
      `/${id}?status=draft`,
      { method: 'PUT', body: body({ externalUrl: 'javascript:alert(1)' }) },
      true,
    );
    assert.equal(invalid.response.status, 400, JSON.stringify(invalid.json));
    const protocol = await api.create({
      data: {
        title: 'Protocol',
        section: 'protocol',
        category: 'membership',
        displayMode: 'archive',
      },
    });
    assert.equal(protocol.category, 'governance');
    assert.equal(protocol.displayMode, 'slides');
    const terms = seeded.find((item) => item.slug === 'terms-of-service');
    const oldTerms = (await request('?filters[slug][$eq]=terms-of-service'))
      .json.data[0];
    const changed = await request(
      `/${terms.documentId}?status=published`,
      {
        method: 'PUT',
        body: body({
          slug: 'accidental-rename',
          content: [
            {
              type: 'paragraph',
              children: [{ type: 'text', text: 'New test legal content' }],
            },
          ],
        }),
      },
      true,
    );
    assert.equal(changed.response.status, 200, JSON.stringify(changed.json));
    const newTerms = (await request('?filters[slug][$eq]=terms-of-service'))
      .json.data[0];
    assert.equal(newTerms.slug, 'terms-of-service');
    assert.notEqual(
      newTerms.updatedAt,
      oldTerms.updatedAt,
      'Last Updated follows actual persisted change',
    );
    assert.equal(
      newTerms.content[0].children[0].text,
      'New test legal content',
    );
    const image = await app.db
      .query('plugin::upload.file')
      .create({
        data: {
          name: 'report.jpg',
          hash: 'docs_report',
          ext: '.jpg',
          mime: 'image/jpeg',
          size: 1,
          url: '/uploads/report.jpg',
          provider: 'local',
        },
      });
    const report = await api.create({
      data: {
        title: 'Annual Report 2026',
        section: 'annual-report',
        coverImage: image.id,
        effectiveDate: '2026-09-09',
      },
      status: 'published',
    });
    const result = await request(
      `?filters[documentId][$eq]=${report.documentId}&populate=coverImage`,
    );
    assert.equal(result.json.data[0].coverImage.id, image.id);
    assert.equal(result.json.data[0].category, 'annual-reports');
    await api.unpublish({ documentId: id });
    assert.equal((await request(filter)).json.data.length, 0);
    const {
      initializeDocumentLibrary,
    } = require('../dist/src/utils/document-library');
    await initializeDocumentLibrary(app);
    assert.equal(
      (await api.findOne({ documentId: terms.documentId, status: 'published' }))
        .content[0].children[0].text,
      'New test legal content',
      'Bootstrap does not overwrite edits',
    );
    // Simulate upgrading a library with a published legacy document and a
    // different unpublished body. Classification must preserve both variants.
    const placeholder = seeded.find(
      (item) => item.section === 'code-of-conduct',
    );
    await api.delete({ documentId: placeholder.documentId });
    const legacy = await api.create({
      data: {
        title: 'Code of Conduct',
        category: 'governance',
        content: [
          {
            type: 'paragraph',
            children: [{ type: 'text', text: 'Old published body' }],
          },
        ],
      },
      status: 'published',
    });
    await api.update({
      documentId: legacy.documentId,
      data: {
        content: [
          {
            type: 'paragraph',
            children: [{ type: 'text', text: 'Unpublished edits' }],
          },
        ],
      },
    });
    await app
      .store({ type: 'core', name: 'document-library' })
      .set({ key: 'v1', value: false });
    await initializeDocumentLibrary(app);
    const classifiedDraft = await api.findOne({
      documentId: legacy.documentId,
      status: 'draft',
    });
    const classifiedPublic = await api.findOne({
      documentId: legacy.documentId,
      status: 'published',
    });
    assert.equal(classifiedDraft.section, 'code-of-conduct');
    assert.equal(classifiedPublic.section, 'code-of-conduct');
    assert.equal(
      classifiedDraft.content[0].children[0].text,
      'Unpublished edits',
    );
    assert.equal(
      classifiedPublic.content[0].children[0].text,
      'Old published body',
    );
    assert.equal(
      (
        await api.findMany({
          filters: { title: 'Code of Conduct' },
          status: 'draft',
        })
      ).length,
      1,
      'Legacy matching avoids duplicate templates',
    );
    const config = await app
      .plugin('content-manager')
      .service('content-types')
      .findConfiguration(
        app.contentTypes['api::policy-document.policy-document'],
      );
    for (const name of [
      'content',
      'archives',
      'coverImage',
      'section',
      'continent',
      'externalUrl',
    ])
      assert(config.layouts.edit.flat().some((item) => item.name === name));
    console.log(
      'PASS: full PDF seed, five Careers groups, portal drafts/public published isolation, REST Save/Publish, archives, legal permalink/updatedAt, image cards, unpublish and idempotent bootstrap',
    );
  } finally {
    await app.destroy();
    for (const suffix of ['', '-wal', '-shm'])
      fs.rmSync(path.join(repo, database + suffix), { force: true });
  }
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
