const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const STRAPI_TOKEN = process.env.STRAPI_TOKEN || '';
const IMAGES_DIR = '/home/phong/page_YOU/images-projects';

async function uploadAndAttachImages() {
  try {
    // 1. Get project by name
    console.log('📊 Fetching Global Diplomacy project...');
    const projectRes = await fetch(
      `${STRAPI_URL}/api/projects?filters[name][$eq]=Global Diplomacy Leadership Certification`,
      {
        headers: STRAPI_TOKEN ? { Authorization: `Bearer ${STRAPI_TOKEN}` } : {},
      }
    );

    if (!projectRes.ok) throw new Error(`Failed to fetch project: ${projectRes.status}`);

    const projectData = await projectRes.json();
    if (!projectData.data || projectData.data.length === 0) {
      throw new Error('Project not found');
    }

    const project = projectData.data[0];
    const projectId = project.documentId || project.id;
    console.log(`✅ Found project: ${project.attributes.name}`);

    // 2. Get all images
    const files = fs.readdirSync(IMAGES_DIR)
      .filter(f => /\.(jpg|jpeg|png|gif)$/i.test(f))
      .map(f => path.join(IMAGES_DIR, f));

    console.log(`📸 Found ${files.length} images to upload`);

    const uploadedIds = [];

    // 3. Upload each image
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const filename = path.basename(file);

      console.log(`📤 [${i + 1}/${files.length}] Uploading ${filename}...`);

      const form = new FormData();
      form.append('files', fs.createReadStream(file));
      form.append('ref', 'api::project.project');
      form.append('refId', projectId);
      form.append('field', i === 0 ? 'outstandingImage' : 'gallery');

      const uploadRes = await fetch(`${STRAPI_URL}/api/upload`, {
        method: 'POST',
        headers: STRAPI_TOKEN ? { Authorization: `Bearer ${STRAPI_TOKEN}` } : {},
        body: form,
      });

      if (!uploadRes.ok) {
        console.error(`❌ Failed to upload ${filename}: ${uploadRes.status}`);
        continue;
      }

      const uploadData = await uploadRes.json();
      const mediaId = uploadData[0]?.id || uploadData[0]?.documentId;
      uploadedIds.push(mediaId);
      console.log(`✅ Uploaded: ${filename} (ID: ${mediaId})`);
    }

    console.log(`\n✨ Upload complete! ${uploadedIds.length}/${files.length} images uploaded`);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

uploadAndAttachImages();
