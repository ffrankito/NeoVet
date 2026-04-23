import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const landingRoot = path.resolve(__dirname, '..');

const inputPath = path.join(
  landingRoot,
  'src/assets/images/hero/Gemini_Generated_Image_wprdq4wprdq4wprd.png',
);
const outputPath = path.join(
  landingRoot,
  'src/assets/images/hero/hero-bulldog-source.png',
);

const metadata = await sharp(inputPath).metadata();
console.log(`Source: ${metadata.width}x${metadata.height}`);

const cropRightPct = 0.06;
const cropBottomPct = 0.08;

const newWidth = Math.floor(metadata.width * (1 - cropRightPct));
const newHeight = Math.floor(metadata.height * (1 - cropBottomPct));

await sharp(inputPath)
  .extract({ left: 0, top: 0, width: newWidth, height: newHeight })
  .png()
  .toFile(outputPath);

const out = await sharp(outputPath).metadata();
console.log(`Output: ${out.width}x${out.height}`);
console.log(`Saved to: ${outputPath}`);
