const qrcode = require('qrcode-generator');
try {
  const qr = qrcode(0, 'M');
  qr.addData('https://basalthq.com');
  qr.make();
  const svg = qr.createSvgTag(6, 12);
  console.log("Success! SVG generated length:", svg.length);
} catch (e) {
  console.error("Error:", e);
}
