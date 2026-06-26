import { chromium } from 'playwright';
import { writeFileSync } from 'fs';

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Render two Apple-style icon previews using canvas
  const result = await page.evaluate(() => {
    const SIZE = 512;

    // Helper: draw Apple squircle path
    function drawSquirclePath(ctx, size, cornerR) {
      const s = size, r = Math.min(cornerR, s / 2), c = r * 0.92;
      ctx.beginPath();
      ctx.moveTo(r, 0);
      ctx.lineTo(s - r, 0);
      ctx.bezierCurveTo(s - r + c, 0, s, r - c, s, r);
      ctx.lineTo(s, s - r);
      ctx.bezierCurveTo(s, s - r + c, s - r + c, s, s - r, s);
      ctx.lineTo(r, s);
      ctx.bezierCurveTo(r - c, s, 0, s - r + c, 0, s - r);
      ctx.lineTo(0, r);
      ctx.bezierCurveTo(0, r - c, r - c, 0, r, 0);
      ctx.closePath();
    }

    // Create a sample icon content (gradient with a symbol)
    function drawSampleIcon(ctx, size) {
      // Gradient background
      const grad = ctx.createLinearGradient(0, 0, size, size);
      grad.addColorStop(0, '#667eea');
      grad.addColorStop(1, '#764ba2');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, size, size);

      // Draw a simple star/symbol in center
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${size * 0.5}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('★', size / 2, size / 2);
    }

    // Render style 1: Apple Icon (squircle, no padding)
    function renderAppleIcon() {
      const canvas = document.createElement('canvas');
      canvas.width = SIZE;
      canvas.height = SIZE;
      const ctx = canvas.getContext('2d');

      // Squircle clip
      const rPx = (22 / 100) * (SIZE / 2);
      ctx.save();
      drawSquirclePath(ctx, SIZE, rPx);
      ctx.clip();

      // Draw icon content
      drawSampleIcon(ctx, SIZE);
      ctx.restore();

      return canvas.toDataURL('image/png');
    }

    // Render style 2: macOS Notification (squircle + 20% transparent padding)
    function renderMacOSNotification() {
      const canvas = document.createElement('canvas');
      canvas.width = SIZE;
      canvas.height = SIZE;
      const ctx = canvas.getContext('2d');

      const paddingPct = 20;
      const pad = (paddingPct / 100) * SIZE;
      const innerSize = SIZE - pad * 2;
      const rPx = (22 / 100) * (innerSize / 2);

      ctx.save();
      ctx.translate(pad, pad);

      // Squircle clip in inner area
      drawSquirclePath(ctx, innerSize, rPx);
      ctx.clip();

      // Draw icon content scaled to inner area
      const grad = ctx.createLinearGradient(0, 0, innerSize, innerSize);
      grad.addColorStop(0, '#667eea');
      grad.addColorStop(1, '#764ba2');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, innerSize, innerSize);

      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${innerSize * 0.5}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('★', innerSize / 2, innerSize / 2);

      ctx.restore();

      return canvas.toDataURL('image/png');
    }

    return {
      apple: renderAppleIcon(),
      macos: renderMacOSNotification(),
    };
  });

  // Decode and save
  for (const [name, dataUrl] of [['apple-icon', result.apple], ['macos-notification', result.macos]]) {
    const base64 = dataUrl.split(',')[1];
    const buf = Buffer.from(base64, 'base64');
    const outPath = `d:\\ShenProject\\TauriTool\\preview-${name}.png`;
    writeFileSync(outPath, buf);
    console.log(`Saved: ${outPath}`);
  }

  await browser.close();
}

main().catch(console.error);
