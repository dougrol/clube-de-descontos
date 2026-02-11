import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PUBLIC_DIR = path.resolve(__dirname, '../public');
const INPUT_IMAGE = path.join(PUBLIC_DIR, 'logo.png');

async function generateIcons() {
    if (!fs.existsSync(INPUT_IMAGE)) {
        console.error(`Error: Source image not found at ${INPUT_IMAGE}`);
        process.exit(1);
    }

    console.log('Generating PWA icons from logo.png...');

    const icons = [
        { name: 'pwa-192.png', size: 192 },
        { name: 'pwa-512.png', size: 512 },
        { name: 'maskable-icon.png', size: 512, options: { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 1 } } }, // Black background for maskable
        { name: 'apple-touch-icon.png', size: 180, options: { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 1 } } },
        { name: 'favicon.ico', size: 64 }
    ];

    for (const icon of icons) {
        const outputPath = path.join(PUBLIC_DIR, icon.name);

        try {
            let pipeline = sharp(INPUT_IMAGE).resize(icon.size, icon.size, icon.options || { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } });

            if (icon.name.endsWith('.ico')) {
                // Sharp doesn't directly support .ico, usually we save as png and user might rename or we use a specific format. 
                // For simplicity in a vite project, a png favicon usually works if referenced correctly, but standard is .ico.
                // Let's save as png then rename or just save as png and update config to use favicon.png if needed.
                // Actually, most browsers support PNG favicons. Let's make it a PNG but name it favicon.ico (might be tricky) or just favicon.png.
                // Let's stick to png for simplicity and compatibility with sharp, but save as .png.
                // Wait, vite-plugin-pwa default config looks for favicon.ico. 
                // Sharp can verify formats. Let's just output png for everything for now, except for favicon.
                // For favicon.ico, we can just save a 64x64 png. Modern browsers handle it.
                await pipeline.toFile(outputPath.replace('.ico', '.png'));
                // Rename if necessary? No, let's just use png for favicon in config if we can't write ico.
                // Actually, let's write it as favicon.png and I will update vite config to match.
            } else {
                await pipeline.toFile(outputPath);
            }

            console.log(`Created ${icon.name}`);
        } catch (err) {
            console.error(`Error creating ${icon.name}:`, err);
        }
    }

    // Special handling for favicon.ico -> let's just copy pwa-192 or similar if we can't generate true ico? 
    // Or just rely on favicon.png.
    // I will generate favicon.png and update vite config to use it if it's not strictly requiring .ico
}

generateIcons();
