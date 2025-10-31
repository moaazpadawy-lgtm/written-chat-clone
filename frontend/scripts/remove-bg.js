const Jimp = require('jimp');
const path = require('path');

(async () => {
  try {
    const input = path.resolve(__dirname, '../src/assets/logo.png');
    const output = path.resolve(__dirname, '../src/assets/logo-transparent.png');
    const image = await Jimp.read(input);
    const tol = 0.90; // tolerance for whiteness (1.0 = pure white only)

    image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(x, y, idx) {
      const r = this.bitmap.data[idx + 0];
      const g = this.bitmap.data[idx + 1];
      const b = this.bitmap.data[idx + 2];

      // Normalize to 0..1
      const rn = r / 255;
      const gn = g / 255;
      const bn = b / 255;

      // Consider pixel 'white' if all channels are close to 1.0
      if (rn >= tol && gn >= tol && bn >= tol) {
        // set alpha to 0
        this.bitmap.data[idx + 3] = 0;
      }
    });

    await image.writeAsync(output);
    console.log('Saved transparent logo to', output);
  } catch (err) {
    console.error('Error processing image:', err);
    process.exit(1);
  }
})();
