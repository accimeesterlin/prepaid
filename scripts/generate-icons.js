/**
 * Icon Generator for PWA
 * This script generates placeholder PWA icons in various sizes
 * Replace this with actual logo icons for production
 */

const fs = require('fs');
const path = require('path');

// Icon sizes required for PWA
const ICON_SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

// Output directory
const ICONS_DIR = path.join(__dirname, '..', 'public', 'icons');

// Ensure icons directory exists
if (!fs.existsSync(ICONS_DIR)) {
  fs.mkdirSync(ICONS_DIR, { recursive: true });
}

// Generate SVG for each size
function generateIconSVG(size) {
  const iconSVG = `
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1d4ed8;stop-opacity:1" />
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="${size}" height="${size}" fill="url(#gradient)" rx="${size * 0.15}"/>

  <!-- Phone icon -->
  <g transform="translate(${size * 0.3}, ${size * 0.25})">
    <rect x="0" y="0" width="${size * 0.4}" height="${size * 0.5}"
          fill="white" rx="${size * 0.03}" stroke="white" stroke-width="${size * 0.01}"/>
    <rect x="${size * 0.05}" y="${size * 0.05}" width="${size * 0.3}" height="${size * 0.35}"
          fill="#3b82f6" rx="${size * 0.015}"/>
    <circle cx="${size * 0.2}" cy="${size * 0.45}" r="${size * 0.025}" fill="white"/>
  </g>

  <!-- Signal waves -->
  <g transform="translate(${size * 0.65}, ${size * 0.35})">
    <path d="M 0,${size * 0.1} Q ${size * 0.05},${size * 0.05} ${size * 0.1},${size * 0.1}"
          stroke="white" stroke-width="${size * 0.015}" fill="none" opacity="0.8"/>
    <path d="M 0,${size * 0.15} Q ${size * 0.075},${size * 0.075} ${size * 0.15},${size * 0.15}"
          stroke="white" stroke-width="${size * 0.015}" fill="none" opacity="0.6"/>
  </g>
</svg>`;

  return iconSVG.trim();
}

// Generate icons
ICON_SIZES.forEach(size => {
  const svgContent = generateIconSVG(size);
  const filename = `icon-${size}x${size}.png`;
  const svgFilename = `icon-${size}x${size}.svg`;
  const outputPath = path.join(ICONS_DIR, svgFilename);

  // Write SVG file (can be converted to PNG using external tools)
  fs.writeFileSync(outputPath, svgContent);
  console.log(`✓ Generated ${svgFilename}`);
});

// Generate favicon.ico placeholder
const faviconSVG = generateIconSVG(32);
fs.writeFileSync(path.join(ICONS_DIR, 'favicon.svg'), faviconSVG);
console.log(`✓ Generated favicon.svg`);

// Create a simple README for icon replacement
const readme = `# PWA Icons

These are placeholder icons generated automatically.

## Replacing with Custom Icons

To use your own logo:

1. Prepare a high-resolution logo (at least 512x512px, preferably square)
2. Use a tool like [PWA Asset Generator](https://github.com/onderceylan/pwa-asset-generator) or [RealFaviconGenerator](https://realfavicongenerator.net/)
3. Replace the PNG files in this directory

## Required Sizes

- 72x72 - iOS Safari
- 96x96 - Android Chrome
- 128x128 - Android Chrome
- 144x144 - Windows
- 152x152 - iOS Safari
- 192x192 - Android Chrome (standard)
- 384x384 - Android Chrome
- 512x512 - Android Chrome (high-res)

## Icon Design Tips

- Use simple, recognizable designs that work at small sizes
- Ensure good contrast for visibility
- Consider "maskable" icons for Android adaptive icons
- Test on both light and dark backgrounds
`;

fs.writeFileSync(path.join(ICONS_DIR, 'README.md'), readme);
console.log(`✓ Generated README.md`);

console.log(`\n✅ All icons generated successfully in ${ICONS_DIR}`);
console.log('\n⚠️  Note: SVG files were generated. For production, convert them to PNG using:');
console.log('   - Online tools like CloudConvert');
console.log('   - CLI tools like ImageMagick or sharp');
console.log('   - Or use a proper icon from your designer\n');
