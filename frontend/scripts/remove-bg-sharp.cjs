// === remove-bg-sharp.cjs ===
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

(async () => {
  try {
    // Paths
    const input = path.resolve(__dirname, '../src/assets/logo.png');
    const output = path.resolve(__dirname, '../src/assets/logo-transparent.png');

    // تأكد إن الصورة الأصلية موجودة
    if (!fs.existsSync(input)) {
      console.error(`❌ File not found: ${input}`);
      process.exit(1);
    }

    console.log('🔄 Processing image...');

    // حمل الصورة واضف قناة ألفا (للشفافية)
    const img = sharp(input).ensureAlpha();
    const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });

    // أي بكسل لونه قريب من الأبيض بيخليه شفاف
    const tol = 250; // درجة اللون الأبيض (0-255)
    for (let i = 0; i < data.length; i += info.channels) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      // لو قريب من الأبيض → شفّاف
      if (r >= tol && g >= tol && b >= tol) {
        data[i + 3] = 0; // ألفا = 0 (شفاف)
      }
    }

    // أنشئ الصورة الجديدة وحفظها
    await sharp(Buffer.from(data), {
      raw: {
        width: info.width,
        height: info.height,
        channels: info.channels,
      },
    })
      .png()
      .toFile(output);

    console.log(`✅ Saved transparent logo to: ${output}`);
  } catch (err) {
    console.error('❌ Error processing image with sharp:', err);
    process.exit(1);
  }
})();
