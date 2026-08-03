const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const https = require('https');

const DOCS_URL = 'https://docs.google.com/document/d/1L0fEXTpM9JKIU2h-OavCBLy6KTKbnAefLNwbz8PkFvc/edit?tab=t.kabvsc14kvhu';
const IMAGES_DIR = path.join(__dirname, '../public/leadership-images');

// Ensure images directory exists
if (!fs.existsSync(IMAGES_DIR)) {
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

async function downloadImage(url, filename) {
  return new Promise((resolve, reject) => {
    const filepath = path.join(IMAGES_DIR, filename);
    const file = fs.createWriteStream(filepath);

    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`✅ Downloaded: ${filename}`);
        resolve(filepath);
      });
    }).on('error', (err) => {
      fs.unlink(filepath, () => {}); // Delete on error
      console.error(`❌ Failed to download ${filename}:`, err.message);
      reject(err);
    });
  });
}

async function scrapeImages() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    console.log(`\n📸 Scraping images from Google Docs...\n`);
    await page.goto(DOCS_URL, { waitUntil: 'networkidle' });

    // Get all images
    const images = await page.evaluate(() => {
      const imgElements = document.querySelectorAll('img');
      return Array.from(imgElements)
        .map(img => ({
          src: img.src,
          alt: img.alt || 'leadership-image',
        }))
        .filter(img => img.src && (img.src.includes('lh3.googleusercontent.com') || img.src.includes('docs.google.com')));
    });

    console.log(`Found ${images.length} images\n`);

    // Download images
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      const filename = `leadership-${i + 1}.jpg`;
      
      try {
        await downloadImage(img.src, filename);
      } catch (err) {
        console.error(`Skipping ${filename}`);
      }
    }

    console.log(`\n✨ Download complete! Images saved to ${IMAGES_DIR}\n`);
  } finally {
    await browser.close();
  }
}

scrapeImages().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
