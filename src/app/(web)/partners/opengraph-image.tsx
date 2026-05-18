import { generateBasaltOG } from '@/lib/og-template';
import { loadBasaltDefaults } from '@/lib/og-asset-loader';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const alt = 'BasaltSurge Partner Program';
export const size = { width: 2400, height: 1260 };
export const contentType = 'image/png';

export default async function Image() {
    let explicitBrandConfig = null;
    try {
        const { headers } = require('next/headers');
        const headersList = await headers();
        const host = headersList.get('x-forwarded-host') || headersList.get('host') || '';

        let brandKey = '';
        const hostLower = host.toLowerCase().split(':')[0];
        if (!hostLower.includes('localhost') && !hostLower.includes('127.0.0.1')) {
            const parts = hostLower.split('.');
            if (parts.length >= 2) {
                const candidate = parts[0];
                if (candidate && !['www', 'api', 'admin'].includes(candidate)) {
                    const isAzure = hostLower.endsWith('.azurewebsites.net') || hostLower.endsWith('.azurecontainerapps.io');
                    const isPayportal = hostLower.endsWith('.payportal.co') || hostLower.endsWith('.portalpay.app');
                    if (isAzure || isPayportal) {
                        brandKey = candidate;
                    }
                }
                if (hostLower === 'www.xoinpay.com' || hostLower === 'xoinpay.com') brandKey = 'xoinpay';
            }
        }

        if (brandKey) {
            const { getBrandConfigFromCosmos } = require('@/lib/brand-config');
            const { brand } = await getBrandConfigFromCosmos(brandKey);
            if (brand) explicitBrandConfig = brand;
        }
    } catch (e) {
        console.error('OG Image brand detection failed:', e);
    }

    const {
        bgBase64,
        blurredBgBase64,
        medallionBase64,
        shieldBase64,
        logoBase64,
        brand
    } = await loadBasaltDefaults(explicitBrandConfig);

    const primaryColor = brand.colors.primary || '#35ff7c';

    return await generateBasaltOG({
        bgImage: bgBase64,
        blurredBgImage: blurredBgBase64,
        medallionImage: medallionBase64,
        cornerShieldImage: shieldBase64,
        primaryColor: primaryColor,
        poweredByImage: logoBase64,

        leftWing: (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center', gap: 0 }}>
                <div style={{ display: 'flex', fontSize: 32, color: 'rgba(255,255,255,0.9)', fontWeight: 600, letterSpacing: '0.1em', marginBottom: 4 }}>PARTNER</div>
                <div style={{ display: 'flex', fontSize: 60, color: primaryColor, fontWeight: 800, letterSpacing: '0.05em', lineHeight: 1.1, textTransform: 'uppercase' }}>PROGRAM</div>
                <div style={{ display: 'flex', fontSize: 32, color: 'rgba(255,255,255,0.9)', fontWeight: 600, letterSpacing: '0.1em', marginTop: 4 }}>BASALTSURGE</div>
            </div>
        ),
        rightWing: (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', gap: 12 }}>
                <div style={{ display: 'flex', fontSize: 42, color: 'white', fontWeight: 700, lineHeight: 1.2 }}>
                    Launch your brand
                </div>
                <div style={{ display: 'flex', fontSize: 42, color: 'white', fontWeight: 700, lineHeight: 1.2 }}>
                    on BasaltSurge.
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 20 }}>
                    <div style={{ display: 'flex', width: 4, height: 40, background: primaryColor }} />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', fontSize: 20, color: primaryColor, fontWeight: 700, letterSpacing: '0.15em' }}>WHITELABEL CONTAINERS</div>
                        <div style={{ display: 'flex', fontSize: 20, color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>surge.basalthq.com/partners</div>
                    </div>
                </div>
            </div>
        )
    });
}
