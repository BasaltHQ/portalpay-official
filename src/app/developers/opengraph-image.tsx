
import { generateBasaltOG } from '@/lib/og-template';
import { loadBasaltDefaults } from '@/lib/og-asset-loader';

export const runtime = 'nodejs';
export const alt = 'Developer Documentation';
export const size = { width: 2400, height: 1260 };
export const contentType = 'image/png';

export default async function Image() {
  const defaults = await loadBasaltDefaults();

  const { brand } = defaults;
  const brandName = (brand?.name || 'BASALT SURGE').toUpperCase();
  const brandParts = brandName.split(' ');
  const line1 = brandParts[0]; // e.g. BASALT
  const line2 = brandParts.slice(1).join(' ') || 'SURGE'; // e.g. SURGE (or empty if single word)
  // Ensure we don't access properties of undefined brand
  const appUrl = brand?.appUrl || 'surge.basalthq.com';

  return await generateBasaltOG({
    bgImage: defaults.bgBase64,
    blurredBgImage: defaults.blurredBgBase64 || defaults.bgBase64,
    primaryColor: '#8b5cf6', // Violet for devs
    cornerShieldImage: defaults.shieldBase64,
    poweredByImage: defaults.logoBase64,
    leftWing: (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center' }}>
        <div style={{ display: 'flex', fontSize: 32, color: 'rgba(255,255,255,0.9)', fontWeight: 600, letterSpacing: '0.1em', marginBottom: 4 }}>{line1}</div>
        <div style={{ display: 'flex', fontSize: 60, color: '#35ff7c', fontWeight: 800, letterSpacing: '0.05em', lineHeight: 1.1, textTransform: 'uppercase' }}>{line2 || 'DEVELOPERS'}</div>
        <div style={{ display: 'flex', fontSize: 32, color: 'rgba(255,255,255,0.9)', fontWeight: 600, letterSpacing: '0.1em', marginTop: 4 }}>{line2 ? 'DEVELOPERS' : null}</div>
      </div>
    ),
    rightWing: (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center' }}>
        <div style={{ display: 'flex', fontSize: 42, color: 'white', fontWeight: 700, lineHeight: 1.2 }}>Build the Future of</div>
        <div style={{ display: 'flex', fontSize: 42, color: 'white', fontWeight: 700, lineHeight: 1.2 }}>Agentic Commerce</div>
        <div style={{ display: 'flex', flexDirection: 'column', marginTop: 4 }}>
          <div style={{ display: 'flex', fontSize: 24, color: 'rgba(255,255,255,0.8)', fontWeight: 600, marginBottom: 4 }}>• API Reference</div>
          <div style={{ display: 'flex', fontSize: 24, color: 'rgba(255,255,255,0.8)', fontWeight: 600, marginBottom: 4 }}>• SDKs & Libraries</div>
          <div style={{ display: 'flex', fontSize: 24, color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>• Neuromimetic OS</div>
        </div>
        <div style={{ display: 'flex', marginTop: 16, fontSize: 20, color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>{`${appUrl.replace(/^https?:\/\//, '')}/docs`}</div>
      </div>
    )
  });
}
