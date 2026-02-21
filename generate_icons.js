import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const bg = { r: 5, g: 5, b: 5, alpha: 1 }; // #050505
const inputPath = 'public/images/logo_shield_v2_transparent.png';

async function createIcon(size, isMaskable) {
  // Safe zone is inner 80%. Making it 75% per user request.
  const logoRatio = 0.75;
  const logoSize = Math.floor(size * logoRatio);

  const logoBuffer = await sharp(inputPath)
    .trim()
    .resize({ width: logoSize, height: logoSize, fit: 'contain', background: { r: 0, g: 0, b:0, alpha: 0 } })
    .toBuffer();

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: bg
    }
  })
  .composite([
    { input: logoBuffer, gravity: 'center' }
  ])
  .png()
  .toFile(`public/icons/${isMaskable ? 'maskable-' : 'icon-'}${size}.png`);
  
  console.log(`Created ${isMaskable ? 'maskable-' : 'icon-'}${size}.png`);
}

async function createAppleTouch() {
  const size = 180;
  const logoSize = Math.floor(size * 0.75);

  const logoBuffer = await sharp(inputPath)
    .trim()
    .resize({ width: logoSize, height: logoSize, fit: 'contain', background: { r: 0, g: 0, b:0, alpha: 0 } })
    .toBuffer();

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: bg
    }
  })
  .composite([
    { input: logoBuffer, gravity: 'center' }
  ])
  .png()
  .toFile(`public/apple-touch-icon.png`);
  
  console.log(`Created apple-touch-icon.png`);
}

async function main() {
  await createIcon(192, false);
  await createIcon(512, false);
  await createIcon(192, true);
  await createIcon(512, true);
  await createAppleTouch();
}

main().catch(console.error);
