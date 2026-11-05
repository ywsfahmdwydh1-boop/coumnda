import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const PUBLIC_DIR = path.resolve(process.cwd(), 'public');
if (!fs.existsSync(PUBLIC_DIR)) {
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
}

const svgContent = `
<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" rx="128" fill="#090d1a"/>
  <rect x="16" y="16" width="480" height="480" rx="112" stroke="url(#paint0_linear)" stroke-width="8" stroke-opacity="0.4"/>
  <circle cx="256" cy="256" r="160" fill="url(#paint1_radial)" fill-opacity="0.25"/>
  <!-- KOUMND Brand Layers Icon -->
  <path d="M256 128L128 200L256 272L384 200L256 128Z" fill="url(#paint2_linear)"/>
  <path d="M128 256L256 328L384 256" stroke="url(#paint3_linear)" stroke-width="24" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M128 312L256 384L384 312" stroke="url(#paint4_linear)" stroke-width="24" stroke-linecap="round" stroke-linejoin="round"/>
  <defs>
    <linearGradient id="paint0_linear" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
      <stop stop-color="#6366f1"/>
      <stop offset="1" stop-color="#06b6d4"/>
    </linearGradient>
    <radialGradient id="paint1_radial" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(256 256) rotate(90) scale(160)">
      <stop stop-color="#6366f1"/>
      <stop offset="1" stop-color="#090d1a" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="paint2_linear" x1="128" y1="128" x2="384" y2="272" gradientUnits="userSpaceOnUse">
      <stop stop-color="#818cf8"/>
      <stop offset="1" stop-color="#06b6d4"/>
    </linearGradient>
    <linearGradient id="paint3_linear" x1="128" y1="256" x2="384" y2="328" gradientUnits="userSpaceOnUse">
      <stop stop-color="#6366f1"/>
      <stop offset="1" stop-color="#22d3ee"/>
    </linearGradient>
    <linearGradient id="paint4_linear" x1="128" y1="312" x2="384" y2="384" gradientUnits="userSpaceOnUse">
      <stop stop-color="#4f46e5"/>
      <stop offset="1" stop-color="#0ea5e9"/>
    </linearGradient>
  </defs>
</svg>
`.trim();

fs.writeFileSync(path.join(PUBLIC_DIR, 'icon.svg'), svgContent, 'utf8');

async function generate() {
  const svgBuffer = Buffer.from(svgContent);

  await sharp(svgBuffer).resize(192, 192).png().toFile(path.join(PUBLIC_DIR, 'icon-192.png'));
  await sharp(svgBuffer).resize(512, 512).png().toFile(path.join(PUBLIC_DIR, 'icon-512.png'));
  await sharp(svgBuffer).resize(512, 512).png().toFile(path.join(PUBLIC_DIR, 'icon-maskable-512.png'));
  await sharp(svgBuffer).resize(180, 180).png().toFile(path.join(PUBLIC_DIR, 'apple-touch-icon.png'));

  console.log('PWA icons successfully generated in /public');
}

generate().catch(console.error);
