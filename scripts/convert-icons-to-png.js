/**
 * Convert SVG icons to PNG using sharp
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ICONS_DIR = path.join(__dirname, '..', 'public', 'icons');
const ICON_SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

async function convertIcon(size) {
  const svgPath = path.join(ICONS_DIR, `icon-${size}x${size}.svg`);
  const pngPath = path.join(ICONS_DIR, `icon-${size}x${size}.png`);

  try {
    await sharp(svgPath)
      .resize(size, size)
      .png()
      .toFile(pngPath);

    console.log(`✓ Converted icon-${size}x${size}.png`);
  } catch (error) {
    console.error(`✗ Failed to convert icon-${size}x${size}:`, error.message);
  }
}

async function convertAllIcons() {
  console.log('Converting SVG icons to PNG...\n');

  for (const size of ICON_SIZES) {
    await convertIcon(size);
  }

  // Also convert favicon
  try {
    const faviconSvg = path.join(ICONS_DIR, 'favicon.svg');
    const faviconPng = path.join(__dirname, '..', 'public', 'favicon.png');

    await sharp(faviconSvg)
      .resize(32, 32)
      .png()
      .toFile(faviconPng);

    console.log('✓ Converted favicon.png');
  } catch (error) {
    console.error('✗ Failed to convert favicon:', error.message);
  }

  console.log('\n✅ All icons converted successfully!');
}

convertAllIcons();
