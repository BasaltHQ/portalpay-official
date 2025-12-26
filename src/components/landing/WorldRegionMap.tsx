'use client';

import { useState } from 'react';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import { getRegionColor } from '@/lib/region-colors';
import { getFlagColors } from '@/lib/flags';
import { useBrand } from "@/contexts/BrandContext";
import { resolveBrandSymbol, getDefaultBrandName } from "@/lib/branding";

export type WorldRegion = 'north-america' | 'south-america' | 'europe' | 'africa' | 'middle-east' | 'asia' | 'oceania' | null;

interface WorldRegionMapProps {
  selectedRegion: WorldRegion;
  onRegionSelect: (region: WorldRegion) => void;
  onCountrySelect?: (countryName: string | null) => void;
  selectedCountry?: string | null;
  className?: string;
  disabledCountries?: string[]; // country names to disable (no enabled location pages)
}

// Mapping of country ISO 3166-1 numeric codes to regions and country names
const countryData: Record<string, { region: WorldRegion; name: string }> = {
  // North America
  '840': { region: 'north-america', name: 'United States' },
  '124': { region: 'north-america', name: 'Canada' },
  '484': { region: 'north-america', name: 'Mexico' },
  '304': { region: 'north-america', name: 'Greenland' },
  '084': { region: 'north-america', name: 'Belize' },
  '188': { region: 'north-america', name: 'Costa Rica' },
  '222': { region: 'north-america', name: 'El Salvador' },
  '320': { region: 'north-america', name: 'Guatemala' },
  '340': { region: 'north-america', name: 'Honduras' },
  '558': { region: 'north-america', name: 'Nicaragua' },
  '591': { region: 'north-america', name: 'Panama' },
  '192': { region: 'north-america', name: 'Cuba' },
  '214': { region: 'north-america', name: 'Dominican Republic' },
  '332': { region: 'north-america', name: 'Haiti' },
  '388': { region: 'north-america', name: 'Jamaica' },
  '660': { region: 'north-america', name: 'Anguilla' },
  '028': { region: 'north-america', name: 'Antigua and Barbuda' },
  '533': { region: 'north-america', name: 'Aruba' },
  '044': { region: 'north-america', name: 'Bahamas' },
  '052': { region: 'north-america', name: 'Barbados' },
  '060': { region: 'north-america', name: 'Bermuda' },
  '535': { region: 'north-america', name: 'Caribbean Netherlands' },
  '136': { region: 'north-america', name: 'Cayman Islands' },
  '531': { region: 'north-america', name: 'Curaçao' },
  '212': { region: 'north-america', name: 'Dominica' },
  '308': { region: 'north-america', name: 'Grenada' },
  '312': { region: 'north-america', name: 'Guadeloupe' },
  '474': { region: 'north-america', name: 'Martinique' },
  '500': { region: 'north-america', name: 'Montserrat' },
  '630': { region: 'north-america', name: 'Puerto Rico' },
  '652': { region: 'north-america', name: 'Saint Barthélemy' },
  '659': { region: 'north-america', name: 'Saint Kitts and Nevis' },
  '662': { region: 'north-america', name: 'Saint Lucia' },
  '663': { region: 'north-america', name: 'Saint Martin' },
  '670': { region: 'north-america', name: 'Saint Vincent and the Grenadines' },
  '534': { region: 'north-america', name: 'Sint Maarten' },
  '780': { region: 'north-america', name: 'Trinidad and Tobago' },
  '092': { region: 'north-america', name: 'British Virgin Islands' },
  '850': { region: 'north-america', name: 'U.S. Virgin Islands' },

  // South America
  '032': { region: 'south-america', name: 'Argentina' },
  '068': { region: 'south-america', name: 'Bolivia' },
  '076': { region: 'south-america', name: 'Brazil' },
  '152': { region: 'south-america', name: 'Chile' },
  '170': { region: 'south-america', name: 'Colombia' },
  '218': { region: 'south-america', name: 'Ecuador' },
  '254': { region: 'south-america', name: 'French Guiana' },
  '328': { region: 'south-america', name: 'Guyana' },
  '600': { region: 'south-america', name: 'Paraguay' },
  '604': { region: 'south-america', name: 'Peru' },
  '740': { region: 'south-america', name: 'Suriname' },
  '858': { region: 'south-america', name: 'Uruguay' },
  '862': { region: 'south-america', name: 'Venezuela' },

  // Europe
  '248': { region: 'europe', name: 'Åland Islands' },
  '008': { region: 'europe', name: 'Albania' },
  '020': { region: 'europe', name: 'Andorra' },
  '040': { region: 'europe', name: 'Austria' },
  '112': { region: 'europe', name: 'Belarus' },
  '056': { region: 'europe', name: 'Belgium' },
  '070': { region: 'europe', name: 'Bosnia and Herzegovina' },
  '100': { region: 'europe', name: 'Bulgaria' },
  '191': { region: 'europe', name: 'Croatia' },
  '196': { region: 'europe', name: 'Cyprus' },
  '203': { region: 'europe', name: 'Czech Republic' },
  '208': { region: 'europe', name: 'Denmark' },
  '233': { region: 'europe', name: 'Estonia' },
  '234': { region: 'europe', name: 'Faroe Islands' },
  '246': { region: 'europe', name: 'Finland' },
  '250': { region: 'europe', name: 'France' },
  '276': { region: 'europe', name: 'Germany' },
  '292': { region: 'europe', name: 'Gibraltar' },
  '300': { region: 'europe', name: 'Greece' },
  '831': { region: 'europe', name: 'Guernsey' },
  '348': { region: 'europe', name: 'Hungary' },
  '352': { region: 'europe', name: 'Iceland' },
  '372': { region: 'europe', name: 'Ireland' },
  '833': { region: 'europe', name: 'Isle of Man' },
  '380': { region: 'europe', name: 'Italy' },
  '832': { region: 'europe', name: 'Jersey' },
  '383': { region: 'europe', name: 'Kosovo' },
  '428': { region: 'europe', name: 'Latvia' },
  '438': { region: 'europe', name: 'Liechtenstein' },
  '440': { region: 'europe', name: 'Lithuania' },
  '442': { region: 'europe', name: 'Luxembourg' },
  '470': { region: 'europe', name: 'Malta' },
  '498': { region: 'europe', name: 'Moldova' },
  '492': { region: 'europe', name: 'Monaco' },
  '499': { region: 'europe', name: 'Montenegro' },
  '528': { region: 'europe', name: 'Netherlands' },
  '807': { region: 'europe', name: 'North Macedonia' },
  '578': { region: 'europe', name: 'Norway' },
  '616': { region: 'europe', name: 'Poland' },
  '620': { region: 'europe', name: 'Portugal' },
  '642': { region: 'europe', name: 'Romania' },
  '643': { region: 'europe', name: 'Russia' },
  '674': { region: 'europe', name: 'San Marino' },
  '688': { region: 'europe', name: 'Serbia' },
  '703': { region: 'europe', name: 'Slovakia' },
  '705': { region: 'europe', name: 'Slovenia' },
  '724': { region: 'europe', name: 'Spain' },
  '744': { region: 'europe', name: 'Svalbard and Jan Mayen' },
  '752': { region: 'europe', name: 'Sweden' },
  '756': { region: 'europe', name: 'Switzerland' },
  '804': { region: 'europe', name: 'Ukraine' },
  '826': { region: 'europe', name: 'United Kingdom' },
  '336': { region: 'europe', name: 'Vatican City' },

  // Africa
  '012': { region: 'africa', name: 'Algeria' },
  '024': { region: 'africa', name: 'Angola' },
  '204': { region: 'africa', name: 'Benin' },
  '072': { region: 'africa', name: 'Botswana' },
  '854': { region: 'africa', name: 'Burkina Faso' },
  '108': { region: 'africa', name: 'Burundi' },
  '132': { region: 'africa', name: 'Cabo Verde' },
  '120': { region: 'africa', name: 'Cameroon' },
  '140': { region: 'africa', name: 'Central African Republic' },
  '148': { region: 'africa', name: 'Chad' },
  '174': { region: 'africa', name: 'Comoros' },
  '180': { region: 'africa', name: 'Democratic Republic of the Congo' },
  '178': { region: 'africa', name: 'Congo' },
  '384': { region: 'africa', name: 'Côte d\'Ivoire' },
  '262': { region: 'africa', name: 'Djibouti' },
  '818': { region: 'africa', name: 'Egypt' },
  '226': { region: 'africa', name: 'Equatorial Guinea' },
  '232': { region: 'africa', name: 'Eritrea' },
  '748': { region: 'africa', name: 'Eswatini' },
  '231': { region: 'africa', name: 'Ethiopia' },
  '266': { region: 'africa', name: 'Gabon' },
  '270': { region: 'africa', name: 'Gambia' },
  '288': { region: 'africa', name: 'Ghana' },
  '324': { region: 'africa', name: 'Guinea' },
  '624': { region: 'africa', name: 'Guinea-Bissau' },
  '404': { region: 'africa', name: 'Kenya' },
  '426': { region: 'africa', name: 'Lesotho' },
  '430': { region: 'africa', name: 'Liberia' },
  '434': { region: 'africa', name: 'Libya' },
  '450': { region: 'africa', name: 'Madagascar' },
  '454': { region: 'africa', name: 'Malawi' },
  '466': { region: 'africa', name: 'Mali' },
  '478': { region: 'africa', name: 'Mauritania' },
  '480': { region: 'africa', name: 'Mauritius' },
  '175': { region: 'africa', name: 'Mayotte' },
  '504': { region: 'africa', name: 'Morocco' },
  '508': { region: 'africa', name: 'Mozambique' },
  '516': { region: 'africa', name: 'Namibia' },
  '562': { region: 'africa', name: 'Niger' },
  '566': { region: 'africa', name: 'Nigeria' },
  '638': { region: 'africa', name: 'Réunion' },
  '646': { region: 'africa', name: 'Rwanda' },
  '654': { region: 'africa', name: 'Saint Helena' },
  '678': { region: 'africa', name: 'Sao Tome and Principe' },
  '686': { region: 'africa', name: 'Senegal' },
  '690': { region: 'africa', name: 'Seychelles' },
  '694': { region: 'africa', name: 'Sierra Leone' },
  '706': { region: 'africa', name: 'Somalia' },
  '710': { region: 'africa', name: 'South Africa' },
  '728': { region: 'africa', name: 'South Sudan' },
  '729': { region: 'africa', name: 'Sudan' },
  '834': { region: 'africa', name: 'Tanzania' },
  '768': { region: 'africa', name: 'Togo' },
  '788': { region: 'africa', name: 'Tunisia' },
  '800': { region: 'africa', name: 'Uganda' },
  '732': { region: 'africa', name: 'Western Sahara' },
  '894': { region: 'africa', name: 'Zambia' },
  '716': { region: 'africa', name: 'Zimbabwe' },

  // Middle East
  '048': { region: 'middle-east', name: 'Bahrain' },
  '364': { region: 'middle-east', name: 'Iran' },
  '368': { region: 'middle-east', name: 'Iraq' },
  '376': { region: 'middle-east', name: 'Israel' },
  '400': { region: 'middle-east', name: 'Jordan' },
  '414': { region: 'middle-east', name: 'Kuwait' },
  '422': { region: 'middle-east', name: 'Lebanon' },
  '512': { region: 'middle-east', name: 'Oman' },
  '275': { region: 'middle-east', name: 'Palestine' },
  '634': { region: 'middle-east', name: 'Qatar' },
  '682': { region: 'middle-east', name: 'Saudi Arabia' },
  '760': { region: 'middle-east', name: 'Syria' },
  '792': { region: 'middle-east', name: 'Turkey' },
  '784': { region: 'middle-east', name: 'United Arab Emirates' },
  '887': { region: 'middle-east', name: 'Yemen' },

  // Asia
  '004': { region: 'asia', name: 'Afghanistan' },
  '051': { region: 'asia', name: 'Armenia' },
  '031': { region: 'asia', name: 'Azerbaijan' },
  '050': { region: 'asia', name: 'Bangladesh' },
  '064': { region: 'asia', name: 'Bhutan' },
  '096': { region: 'asia', name: 'Brunei' },
  '116': { region: 'asia', name: 'Cambodia' },
  '156': { region: 'asia', name: 'China' },
  '268': { region: 'asia', name: 'Georgia' },
  '344': { region: 'asia', name: 'Hong Kong' },
  '356': { region: 'asia', name: 'India' },
  '360': { region: 'asia', name: 'Indonesia' },
  '392': { region: 'asia', name: 'Japan' },
  '398': { region: 'asia', name: 'Kazakhstan' },
  '417': { region: 'asia', name: 'Kyrgyzstan' },
  '418': { region: 'asia', name: 'Laos' },
  '446': { region: 'asia', name: 'Macau' },
  '458': { region: 'asia', name: 'Malaysia' },
  '462': { region: 'asia', name: 'Maldives' },
  '496': { region: 'asia', name: 'Mongolia' },
  '104': { region: 'asia', name: 'Myanmar' },
  '524': { region: 'asia', name: 'Nepal' },
  '408': { region: 'asia', name: 'North Korea' },
  '586': { region: 'asia', name: 'Pakistan' },
  '608': { region: 'asia', name: 'Philippines' },
  '702': { region: 'asia', name: 'Singapore' },
  '410': { region: 'asia', name: 'South Korea' },
  '144': { region: 'asia', name: 'Sri Lanka' },
  '158': { region: 'asia', name: 'Taiwan' },
  '762': { region: 'asia', name: 'Tajikistan' },
  '764': { region: 'asia', name: 'Thailand' },
  '626': { region: 'asia', name: 'Timor-Leste' },
  '795': { region: 'asia', name: 'Turkmenistan' },
  '860': { region: 'asia', name: 'Uzbekistan' },
  '704': { region: 'asia', name: 'Vietnam' },

  // Oceania
  '016': { region: 'oceania', name: 'American Samoa' },
  '036': { region: 'oceania', name: 'Australia' },
  '184': { region: 'oceania', name: 'Cook Islands' },
  '242': { region: 'oceania', name: 'Fiji' },
  '258': { region: 'oceania', name: 'French Polynesia' },
  '316': { region: 'oceania', name: 'Guam' },
  '296': { region: 'oceania', name: 'Kiribati' },
  '584': { region: 'oceania', name: 'Marshall Islands' },
  '583': { region: 'oceania', name: 'Micronesia' },
  '520': { region: 'oceania', name: 'Nauru' },
  '540': { region: 'oceania', name: 'New Caledonia' },
  '554': { region: 'oceania', name: 'New Zealand' },
  '570': { region: 'oceania', name: 'Niue' },
  '574': { region: 'oceania', name: 'Norfolk Island' },
  '580': { region: 'oceania', name: 'Northern Mariana Islands' },
  '585': { region: 'oceania', name: 'Palau' },
  '598': { region: 'oceania', name: 'Papua New Guinea' },
  '612': { region: 'oceania', name: 'Pitcairn Islands' },
  '882': { region: 'oceania', name: 'Samoa' },
  '090': { region: 'oceania', name: 'Solomon Islands' },
  '772': { region: 'oceania', name: 'Tokelau' },
  '776': { region: 'oceania', name: 'Tonga' },
  '798': { region: 'oceania', name: 'Tuvalu' },
  '548': { region: 'oceania', name: 'Vanuatu' },
  '876': { region: 'oceania', name: 'Wallis and Futuna' },
};

export const ALL_MAP_COUNTRY_NAMES = Object.values(countryData).map((v) => v.name);

export default function WorldRegionMap({ selectedRegion, onRegionSelect, onCountrySelect, selectedCountry, className = '', disabledCountries = [] }: WorldRegionMapProps) {
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const [logoPosition, setLogoPosition] = useState<{ x: number; y: number } | null>(null);
  const brand = useBrand();

  const hexToRgba = (hex: string, opacity: number): string => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  // Helpers to derive subtle region shades from a base color
  const clamp = (n: number) => Math.max(0, Math.min(255, n));
  const hexToRgb = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return { r, g, b };
  };
  const rgbToHex = (r: number, g: number, b: number) =>
    `#${clamp(r).toString(16).padStart(2, '0')}${clamp(g).toString(16).padStart(2, '0')}${clamp(b).toString(16).padStart(2, '0')}`;

  const lightenHex = (hex: string, amount: number): string => {
    const { r, g, b } = hexToRgb(hex);
    const nr = r + (255 - r) * amount;
    const ng = g + (255 - g) * amount;
    const nb = b + (255 - b) * amount;
    return rgbToHex(nr, ng, nb);
  };

  const darkenHex = (hex: string, amount: number): string => {
    const { r, g, b } = hexToRgb(hex);
    const nr = r * (1 - amount);
    const ng = g * (1 - amount);
    const nb = b * (1 - amount);
    return rgbToHex(nr, ng, nb);
  };

  const makeRegionShades = (base: string) => {
    return [darkenHex(base, 0.35), base, lightenHex(base, 0.35)];
  };

  // Lookup helpers
  const findIsoByName = (name: string | null): string | null => {
    if (!name) return null;
    const entry = Object.entries(countryData).find(([, v]) => v.name === name);
    return entry ? entry[0] : null;
  };

  const handleGeographyClick = (geo: any) => {
    const isoCode = geo.id;
    const data = countryData[isoCode];
    if (data) {
      const isDisabled = disabledCountries.includes(data.name);
      if (isDisabled) return;
      if (onCountrySelect) {
        onCountrySelect(data.name);
      } else if (data.region) {
        onRegionSelect(selectedRegion === data.region ? null : data.region);
      }
    }
  };

  const handleMouseEnter = (geo: any, evt: any) => {
    setHoveredCountry(geo.id);
    // Get the mouse position relative to the map for logo placement
    if (evt && evt.target) {
      const rect = evt.target.ownerSVGElement?.getBoundingClientRect();
      if (rect) {
        setLogoPosition({
          x: evt.clientX - rect.left,
          y: evt.clientY - rect.top
        });
      }
    }
  };

  return (
    <div className={`w-full ${className}`}>
      <div className="relative rounded-lg overflow-hidden border bg-gradient-to-br from-blue-50/50 to-blue-100/30 dark:from-slate-900/50 dark:to-slate-800/30">
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{
            scale: 140,
            center: [10, 20]
          }}
          style={{ width: '100%', height: 'auto' }}
        >
          <defs>
            {(() => {
              // Region gradient patterns (static + animated) for all regions
              const regions: Exclude<WorldRegion, null>[] = [
                'north-america',
                'south-america',
                'europe',
                'africa',
                'middle-east',
                'asia',
                'oceania'
              ];
              const regionDefs = regions.map((regionKey) => {
                const base = getRegionColor(regionKey);
                const shades = makeRegionShades(base);
                const positions = [
                  { cx: '25%', cy: '30%' },
                  { cx: '70%', cy: '30%' },
                  { cx: '30%', cy: '70%' }
                ];

                // Build a helper to create gradient+pattern pair
                const buildRegionPattern = (variant: 'static' | 'animated') => {
                  const patternId = `region-gradient-${regionKey}-${variant}`;
                  return (
                    <>
                      {shades.map((color, i) => (
                        <radialGradient
                          key={`${patternId}-spot-${i}`}
                          id={`${patternId}-spot-${i}`}
                          cx={positions[i % positions.length].cx}
                          cy={positions[i % positions.length].cy}
                          r="65%"
                        >
                          <stop offset="0%" stopColor={color} stopOpacity="0.85">
                            {variant === 'animated' && (
                              <animate
                                attributeName="stop-opacity"
                                values="0.85;0.55;0.85"
                                dur="5s"
                                repeatCount="indefinite"
                                begin={`${i * 0.4}s`}
                              />
                            )}
                          </stop>
                          <stop offset="60%" stopColor={color} stopOpacity="0.35">
                            {variant === 'animated' && (
                              <animate
                                attributeName="stop-opacity"
                                values="0.35;0.15;0.35"
                                dur="5s"
                                repeatCount="indefinite"
                                begin={`${i * 0.4}s`}
                              />
                            )}
                          </stop>
                          <stop offset="100%" stopColor={color} stopOpacity="0.1" />
                        </radialGradient>
                      ))}
                      <pattern
                        id={patternId}
                        x="0"
                        y="0"
                        width="1"
                        height="1"
                        patternContentUnits="objectBoundingBox"
                      >
                        <rect width="1" height="1" fill={hexToRgba(base, 0.15)} />
                        {shades.map((_, i) => (
                          <rect
                            key={`${patternId}-rect-${i}`}
                            x="0"
                            y="0"
                            width="1"
                            height="1"
                            fill={`url(#${patternId}-spot-${i})`}
                          />
                        ))}
                      </pattern>
                    </>
                  );
                };

                return (
                  <g key={`region-${regionKey}`}>
                    {buildRegionPattern('static')}
                    {buildRegionPattern('animated')}
                  </g>
                );
              });

              // Country flag gradients: create for hovered and selected country (deduplicated and validated)
              const selectedIso = findIsoByName(selectedCountry || null);
              const isoTargets = [...new Set([hoveredCountry, selectedIso].filter(Boolean))] as string[];

              // Filter out any ISO codes that aren't in our countryData mapping
              const validIsoTargets = isoTargets.filter(iso => countryData[iso]);

              const countryDefs = validIsoTargets.map((iso) => {
                const flagColors = getFlagColors(countryData[iso].name);
                const positions = [
                  { cx: '20%', cy: '20%' },
                  { cx: '80%', cy: '20%' },
                  { cx: '20%', cy: '80%' },
                  { cx: '80%', cy: '80%' },
                  { cx: '50%', cy: '50%' }
                ];

                const buildFlagPattern = (variant: 'static' | 'animated') => {
                  const patternId = `flag-gradient-${iso}-${variant}`;
                  return (
                    <>
                      {flagColors.map((color, i) => (
                        <radialGradient
                          key={`${patternId}-spot-${i}`}
                          id={`${patternId}-spot-${i}`}
                          cx={positions[i % positions.length].cx}
                          cy={positions[i % positions.length].cy}
                          r="65%"
                        >
                          <stop offset="0%" stopColor={color} stopOpacity="1">
                            {variant === 'animated' && (
                              <animate
                                attributeName="stop-opacity"
                                values="1;0.6;1"
                                dur="3s"
                                repeatCount="indefinite"
                                begin={`${i * 0.3}s`}
                              />
                            )}
                          </stop>
                          <stop offset="50%" stopColor={color} stopOpacity="0.6">
                            {variant === 'animated' && (
                              <animate
                                attributeName="stop-opacity"
                                values="0.6;0.3;0.6"
                                dur="3s"
                                repeatCount="indefinite"
                                begin={`${i * 0.3}s`}
                              />
                            )}
                          </stop>
                          <stop offset="100%" stopColor={color} stopOpacity="0.2" />
                        </radialGradient>
                      ))}
                      <pattern
                        id={patternId}
                        x="0"
                        y="0"
                        width="1"
                        height="1"
                        patternContentUnits="objectBoundingBox"
                      >
                        <rect width="1" height="1" fill={flagColors[0]} opacity="0.12" />
                        {flagColors.map((_, i) => (
                          <rect
                            key={`${patternId}-rect-${i}`}
                            x="0"
                            y="0"
                            width="1"
                            height="1"
                            fill={`url(#${patternId}-spot-${i})`}
                          />
                        ))}
                      </pattern>
                    </>
                  );
                };

                return (
                  <g key={`flag-${iso}`}>
                    {buildFlagPattern('static')}
                    {buildFlagPattern('animated')}
                  </g>
                );
              });

              // Clip path for hovered country (used for logo, retained)
              const clip = hoveredCountry ? (
                <clipPath id={`clip-${hoveredCountry}`}>
                  <use href={`#geo-${hoveredCountry}`} />
                </clipPath>
              ) : null;

              return (
                <>
                  {regionDefs}
                  {countryDefs}
                  {clip}
                </>
              );
            })()}
          </defs>

          <Geographies geography="https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json">
            {({ geographies }: { geographies: any[] }) => (
              <>
                {geographies.map((geo: any) => {
                  const isoCode = geo.id;
                  const data = countryData[isoCode];
                  const geoRegion = data?.region;

                  // Default to dark gray for unmapped territories (blend with background)
                  let defaultFill = '#3b3b3b';
                  let hoverFill = '#4a4a4a';

                  if (data && geoRegion) {
                    const regionBaseColor = getRegionColor(geoRegion);
                    const isInSelectedRegion = selectedRegion === geoRegion;
                    const isSelectedCountryName = selectedCountry === data.name;
                    const isDisabled = disabledCountries.includes(data.name);

                    if (isDisabled) {
                      // Disabled countries are dimmed and non-interactive
                      defaultFill = '#e5e7eb';
                      hoverFill = '#e5e7eb';
                    } else if (!selectedRegion && !selectedCountry) {
                      // No selection: solid region colors; hover shows region color
                      defaultFill = hexToRgba(regionBaseColor, 0.7);
                      hoverFill = hexToRgba(regionBaseColor, 0.85);
                    } else if (isInSelectedRegion && !selectedCountry) {
                      // Region selected: brighter solid color; hover shows animated country flag gradient
                      defaultFill = hexToRgba(regionBaseColor, 0.85);
                      hoverFill = `url(#flag-gradient-${isoCode}-animated)`;
                    } else if (selectedCountry && isSelectedCountryName) {
                      // Country selected: show animated flag gradient
                      defaultFill = `url(#flag-gradient-${isoCode}-animated)`;
                      hoverFill = `url(#flag-gradient-${isoCode}-animated)`;
                    } else {
                      // Unselected regions: fade to gray
                      defaultFill = '#d1d5db';
                      hoverFill = '#c5c7cb';
                    }
                  }

                  const isSelectedCountry = selectedCountry === data?.name;
                  const isHovered = hoveredCountry === isoCode;
                  const isDisabled = data ? disabledCountries.includes(data.name) : false;

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      id={`geo-${isoCode}`}
                      onClick={() => handleGeographyClick(geo)}
                      onMouseEnter={(evt) => handleMouseEnter(geo, evt)}
                      onMouseLeave={() => {
                        setHoveredCountry(null);
                        setLogoPosition(null);
                      }}
                      style={{
                        default: {
                          fill: defaultFill,
                          stroke: '#ffffff',
                          strokeWidth: isSelectedCountry ? 1.2 : 0.5,
                          outline: 'none',
                        },
                        hover: {
                          fill: hoverFill,
                          stroke: '#ffffff',
                          strokeWidth: isSelectedCountry ? 1.4 : 0.8,
                          outline: 'none',
                          cursor: isDisabled ? 'not-allowed' : 'pointer',
                        },
                        pressed: {
                          fill: hoverFill,
                          stroke: '#ffffff',
                          strokeWidth: isSelectedCountry ? 1.4 : 0.8,
                          outline: 'none',
                        },
                      }}
                    />
                  );
                })}
              </>
            )}
          </Geographies>


        </ComposableMap>

        {/* Tooltip with PortalPay logo */}
        {hoveredCountry && countryData[hoveredCountry] && (
          <div className="absolute top-4 right-4 bg-black/90 backdrop-blur-sm rounded-lg p-3 shadow-xl border border-white/20 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-2">
              <img
                src={resolveBrandSymbol(brand?.logos?.favicon || brand?.logos?.app, (brand as any)?.key)}
                alt={brand?.name || getDefaultBrandName((brand as any)?.key)}
                className="w-10 h-10"
              />
              <div className="text-[11px] font-mono leading-tight">
                <div className="text-white font-semibold">
                  {countryData[hoveredCountry].name}
                </div>
                <div className="text-white/60 uppercase text-[9px] tracking-wider">
                  {countryData[hoveredCountry].region?.replace(/-/g, ' ')}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-3 text-sm justify-center">
        <button
          onClick={() => onRegionSelect(null)}
          className={`px-3 py-1.5 rounded-md transition-colors font-medium ${selectedRegion === null
            ? 'bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm'
            : 'bg-accent hover:bg-accent/80'
            }`}
        >
          All Regions
        </button>
        {[
          { id: 'north-america' as const, label: 'North America' },
          { id: 'south-america' as const, label: 'South America' },
          { id: 'europe' as const, label: 'Europe' },
          { id: 'africa' as const, label: 'Africa' },
          { id: 'middle-east' as const, label: 'Middle East' },
          { id: 'asia' as const, label: 'Asia' },
          { id: 'oceania' as const, label: 'Oceania' },
        ].map((region) => (
          <button
            key={region.id}
            onClick={() => onRegionSelect(selectedRegion === region.id ? null : region.id)}
            className={`px-3 py-1.5 rounded-md transition-colors font-medium ${selectedRegion === region.id
              ? 'bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm'
              : 'bg-accent hover:bg-accent/80'
              }`}
            style={{
              backgroundColor: selectedRegion === region.id ? undefined : `${getRegionColor(region.id as Exclude<WorldRegion, null>)}22`,
              borderColor: selectedRegion === region.id ? undefined : `${getRegionColor(region.id as Exclude<WorldRegion, null>)}44`,
              borderWidth: '1px'
            }}
          >
            {region.label}
          </button>
        ))}
      </div>
    </div>
  );
}
