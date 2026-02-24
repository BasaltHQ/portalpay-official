
import { generateBasaltOG } from '@/lib/og-template';
import { getLocationData } from '@/lib/landing-pages/locations';
import { createFlagMeshGradient } from '@/lib/og-image-utils';
import { loadTwemojiPng, loadBasaltDefaults } from '@/lib/og-asset-loader';
import sharp from 'sharp';

export const runtime = 'nodejs';
export const alt = 'Crypto Payment Locations';
export const size = { width: 2400, height: 1260 };
export const contentType = 'image/png';

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const location = getLocationData(slug);

  if (!location) {
    return new Response('Not found', { status: 404 });
  }

  const { name, country } = location;

  // 1. Get Flag Colors from Source of Truth
  const { getFlagColors } = await import('@/lib/flags');
  const primaryColors = getFlagColors(country);

  // 2. Generate Flag Gradient Background
  const bgSvg = createFlagMeshGradient(primaryColors, 2400, 1260); // Use generated flag colors for the mesh
  const bgBuffer = await sharp(Buffer.from(bgSvg)).png().toBuffer();
  const bgDataUri = `data:image/png;base64,${bgBuffer.toString('base64')}`;

  // 3. Medallion - Load Twemoji for the actual flag
  // Map full country names to ISO codes for flag emoji generation
  // Comprehensive country name → ISO 3166-1 alpha-2 mapping
  const countryToIso: Record<string, string> = {
    // Africa
    'Algeria': 'DZ', 'Angola': 'AO', 'Benin': 'BJ', 'Botswana': 'BW', 'Burkina Faso': 'BF',
    'Burundi': 'BI', 'Cameroon': 'CM', 'Central African Republic': 'CF', 'Chad': 'TD',
    'Comoros': 'KM', 'Congo': 'CG', 'DR Congo': 'CD', 'Djibouti': 'DJ', 'Egypt': 'EG',
    'Equatorial Guinea': 'GQ', 'Eritrea': 'ER', 'Ethiopia': 'ET', 'Gabon': 'GA',
    'Gambia': 'GM', 'Ghana': 'GH', 'Guinea': 'GN', 'Guinea-Bissau': 'GW',
    'Ivory Coast': 'CI', 'Kenya': 'KE', 'Lesotho': 'LS', 'Liberia': 'LR', 'Libya': 'LY',
    'Madagascar': 'MG', 'Malawi': 'MW', 'Mali': 'ML', 'Mauritius': 'MU', 'Morocco': 'MA',
    'Mozambique': 'MZ', 'Namibia': 'NA', 'Niger': 'NE', 'Nigeria': 'NG', 'Rwanda': 'RW',
    'Sao Tome and Principe': 'ST', 'Senegal': 'SN', 'Seychelles': 'SC', 'Sierra Leone': 'SL',
    'Somalia': 'SO', 'South Africa': 'ZA', 'South Sudan': 'SS', 'Sudan': 'SD',
    'Swaziland': 'SZ', 'Tanzania': 'TZ', 'Togo': 'TG', 'Tunisia': 'TN', 'Uganda': 'UG',
    'Zambia': 'ZM', 'Zimbabwe': 'ZW',
    // Americas
    'Antigua and Barbuda': 'AG', 'Argentina': 'AR', 'Bahamas': 'BS', 'Barbados': 'BB',
    'Belize': 'BZ', 'Bolivia': 'BO', 'Brazil': 'BR', 'Canada': 'CA', 'Chile': 'CL',
    'Colombia': 'CO', 'Costa Rica': 'CR', 'Cuba': 'CU', 'Dominica': 'DM',
    'Dominican Republic': 'DO', 'Ecuador': 'EC', 'El Salvador': 'SV', 'Grenada': 'GD',
    'Guatemala': 'GT', 'Guyana': 'GY', 'Haiti': 'HT', 'Honduras': 'HN', 'Jamaica': 'JM',
    'Mexico': 'MX', 'Nicaragua': 'NI', 'Panama': 'PA', 'Paraguay': 'PY', 'Peru': 'PE',
    'Puerto Rico': 'PR', 'Saint Kitts and Nevis': 'KN', 'Saint Lucia': 'LC',
    'Saint Vincent and the Grenadines': 'VC', 'Suriname': 'SR',
    'Trinidad and Tobago': 'TT', 'United States': 'US', 'USA': 'US', 'Uruguay': 'UY',
    'Venezuela': 'VE',
    // Asia
    'Afghanistan': 'AF', 'Bangladesh': 'BD', 'Bhutan': 'BT', 'Brunei': 'BN',
    'Cambodia': 'KH', 'China': 'CN', 'Hong Kong': 'HK', 'India': 'IN', 'Indonesia': 'ID',
    'Iran': 'IR', 'Iraq': 'IQ', 'Israel': 'IL', 'Japan': 'JP', 'Jordan': 'JO',
    'Kazakhstan': 'KZ', 'Kuwait': 'KW', 'Laos': 'LA', 'Lebanon': 'LB', 'Malaysia': 'MY',
    'Maldives': 'MV', 'Mongolia': 'MN', 'Myanmar': 'MM', 'Nepal': 'NP',
    'North Korea': 'KP', 'Oman': 'OM', 'Pakistan': 'PK', 'Palestine': 'PS',
    'Philippines': 'PH', 'Qatar': 'QA', 'Saudi Arabia': 'SA', 'Singapore': 'SG',
    'South Korea': 'KR', 'Sri Lanka': 'LK', 'Syria': 'SY', 'Taiwan': 'TW',
    'Thailand': 'TH', 'Timor-Leste': 'TL', 'Turkey': 'TR',
    'United Arab Emirates': 'AE', 'UAE': 'AE', 'Uzbekistan': 'UZ', 'Vietnam': 'VN',
    'Yemen': 'YE',
    // Europe
    'Albania': 'AL', 'Andorra': 'AD', 'Armenia': 'AM', 'Austria': 'AT', 'Azerbaijan': 'AZ',
    'Belarus': 'BY', 'Belgium': 'BE', 'Bosnia and Herzegovina': 'BA', 'Bulgaria': 'BG',
    'Croatia': 'HR', 'Czech Republic': 'CZ', 'Czechia': 'CZ', 'Denmark': 'DK',
    'Estonia': 'EE', 'Finland': 'FI', 'France': 'FR', 'Georgia': 'GE', 'Germany': 'DE',
    'Greece': 'GR', 'Hungary': 'HU', 'Iceland': 'IS', 'Ireland': 'IE', 'Italy': 'IT',
    'Kosovo': 'XK', 'Latvia': 'LV', 'Liechtenstein': 'LI', 'Lithuania': 'LT',
    'Luxembourg': 'LU', 'Malta': 'MT', 'Moldova': 'MD', 'Monaco': 'MC',
    'Montenegro': 'ME', 'Netherlands': 'NL', 'North Macedonia': 'MK', 'Norway': 'NO',
    'Poland': 'PL', 'Portugal': 'PT', 'Romania': 'RO', 'Russia': 'RU',
    'San Marino': 'SM', 'Serbia': 'RS', 'Slovakia': 'SK', 'Slovenia': 'SI', 'Spain': 'ES',
    'Sweden': 'SE', 'Switzerland': 'CH', 'Ukraine': 'UA',
    'United Kingdom': 'GB', 'UK': 'GB', 'Vatican City': 'VA', 'Vatican': 'VA',
    // Oceania
    'Australia': 'AU', 'Fiji': 'FJ', 'Kiribati': 'KI', 'Marshall Islands': 'MH',
    'Micronesia': 'FM', 'Nauru': 'NR', 'New Zealand': 'NZ', 'Palau': 'PW',
    'Papua New Guinea': 'PG', 'Samoa': 'WS', 'Tonga': 'TO', 'Tuvalu': 'TV', 'Vanuatu': 'VU',
  };

  const getFlagEmoji = (nameOrCode: string) => {
    if (!nameOrCode) return '🇺🇳';
    const code = countryToIso[nameOrCode] || (nameOrCode.length === 2 ? nameOrCode : null);
    if (!code) return '🇺🇳';

    const codePoints = code
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  };

  const flagEmoji = country ? getFlagEmoji(country) : '🇺🇳';

  // Load raw Twemoji SVG and resize to 700x700 square with fit:cover
  // (loadTwemojiPng uses fit:contain which adds transparent padding — flags won't fill the circle)
  const toCodepoints = (str: string): string => {
    const out: string[] = [];
    for (let i = 0; i < str.length;) {
      const cp = str.codePointAt(i)!;
      out.push(cp.toString(16));
      i += cp > 0xffff ? 2 : 1;
    }
    return out.join('-');
  };
  const rawCp = toCodepoints(flagEmoji);
  const noFe0f = rawCp.split('-').filter(p => p !== 'fe0f').join('-');
  const svgUrls = [rawCp, noFe0f].flatMap(cp => [
    `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/${cp}.svg`,
    `https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/${cp}.svg`,
  ]);

  let squareFlagBuffer: Buffer | null = null;
  for (const url of svgUrls) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const svgBuf = Buffer.from(await res.arrayBuffer());
      squareFlagBuffer = await sharp(svgBuf)
        .resize(700, 700, { fit: 'cover', position: 'centre' })
        .png()
        .toBuffer();
      break;
    } catch { /* try next */ }
  }

  // 4. Format Industries
  const industries = location.popularIndustries || [];
  const formatIndustry = (ind: string) => ind.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  const medallionDataUri = squareFlagBuffer
    ? `data:image/png;base64,${squareFlagBuffer.toString('base64')}`
    : bgDataUri;

  // Load defaults for shield/bg
  const defaults = await loadBasaltDefaults();

  return await generateBasaltOG({
    bgImage: bgDataUri,
    blurredBgImage: bgDataUri, // Use same for blurred or defaults.bg if preferred
    medallionImage: medallionDataUri,
    poweredByImage: defaults.logoBase64,
    primaryColor: primaryColors[0],
    leftWing: (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center', height: '100%', gap: 0 }}>
        <div style={{ display: 'flex', fontSize: 32, color: 'rgba(255,255,255,0.7)', fontWeight: 600, letterSpacing: '0.1em', marginBottom: 8 }}>PAYMENTS IN</div>
        <div style={{ display: 'flex', fontSize: 80, color: 'white', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 0.9, textTransform: 'uppercase', textAlign: 'right', textShadow: `0 4px 20px rgba(0,0,0,0.8), 0 0 60px ${primaryColors[0]}80` }}>
          {name}
        </div>
        <div style={{ display: 'flex', fontSize: 24, color: 'rgba(255,255,255,0.9)', fontWeight: 500, letterSpacing: '0.05em', marginTop: 16, textAlign: 'right', maxWidth: 400 }}>
          {(() => {
            const ctx = location.localContext || 'Instant settlement and offline support.';
            // Take the first sentence or truncate at 120 chars
            const firstSentence = ctx.match(/^[^.!?]+[.!?]/)?.[0];
            if (firstSentence && firstSentence.length <= 120) return firstSentence;
            if (ctx.length <= 120) return ctx;
            return ctx.slice(0, 117).replace(/\s+\S*$/, '') + '…';
          })()}
        </div>
      </div>
    ),
    rightWing: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%', justifyContent: 'center', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', fontSize: 20, color: 'rgba(255,255,255,0.5)', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
          MAJOR INDUSTRIES IN {name}:
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, maxWidth: 480, justifyContent: 'flex-start' }}>
          {industries.slice(0, 6).map((ind, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 12, // Slightly less rounded for a "tech tag" feel
              padding: '8px 20px',
              color: 'white',
              fontSize: 20, // Slightly smaller
              fontWeight: 600,
              whiteSpace: 'nowrap'
            }}>
              {formatIndustry(ind)}
            </div>
          ))}
        </div>
      </div>
    ),
    cornerShieldImage: defaults.shieldBase64
  });
}
