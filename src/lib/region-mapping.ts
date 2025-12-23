import { WorldRegion } from '@/components/landing/WorldRegionMap';

/**
 * Maps countries to world regions for location filtering
 */
export function getCountryRegion(country: string): WorldRegion {
  const normalized = country.toLowerCase().trim();
  
  // North America
  if ([
    'canada', 'united states', 'usa', 'mexico', 'greenland', 'bermuda',
    'belize', 'costa rica', 'el salvador', 'guatemala', 'honduras', 
    'nicaragua', 'panama', 'cuba', 'dominican republic', 'haiti', 
    'jamaica', 'puerto rico', 'trinidad and tobago', 'aruba', 'curacao'
  ].includes(normalized)) {
    return 'north-america';
  }
  
  // South America
  if ([
    'argentina', 'bolivia', 'brazil', 'chile', 'colombia', 'ecuador',
    'guyana', 'paraguay', 'peru', 'suriname', 'uruguay', 'venezuela'
  ].includes(normalized)) {
    return 'south-america';
  }
  
  // Europe
  if ([
    'albania', 'andorra', 'austria', 'belarus', 'belgium', 
    'bosnia and herzegovina', 'bulgaria', 'croatia', 'cyprus', 
    'czech republic', 'czechia', 'denmark', 'estonia', 'finland', 
    'france', 'germany', 'greece', 'hungary', 'iceland', 'ireland', 
    'italy', 'latvia', 'lithuania', 'luxembourg', 'malta', 'moldova', 
    'monaco', 'montenegro', 'netherlands', 'north macedonia', 'norway', 
    'poland', 'portugal', 'romania', 'russia', 'san marino', 'serbia', 
    'slovakia', 'slovenia', 'spain', 'sweden', 'switzerland', 'ukraine', 
    'united kingdom', 'uk', 'vatican city'
  ].includes(normalized)) {
    return 'europe';
  }
  
  // Africa
  if ([
    'algeria', 'angola', 'benin', 'botswana', 'burkina faso', 'burundi', 
    'cabo verde', 'cape verde', 'cameroon', 'central african republic', 
    'chad', 'comoros', 'congo', 'republic of the congo', 
    'democratic republic of the congo', 'dr congo', 'drc',
    "cote d'ivoire", "côte d'ivoire", 'ivory coast', 'djibouti', 'egypt', 
    'equatorial guinea', 'eritrea', 'eswatini', 'ethiopia', 'gabon', 
    'gambia', 'ghana', 'guinea', 'guinea-bissau', 'kenya', 'lesotho', 
    'liberia', 'libya', 'madagascar', 'malawi', 'mali', 'mauritania', 
    'mauritius', 'morocco', 'mozambique', 'namibia', 'niger', 'nigeria', 
    'rwanda', 'sao tome and principe', 'são tomé and príncipe', 'senegal', 
    'seychelles', 'sierra leone', 'somalia', 'south africa', 'south sudan', 
    'sudan', 'tanzania', 'togo', 'tunisia', 'uganda', 'zambia', 'zimbabwe'
  ].includes(normalized)) {
    return 'africa';
  }
  
  // Middle East
  if ([
    'bahrain', 'iran', 'iraq', 'israel', 'jordan', 'kuwait', 'lebanon', 
    'oman', 'palestine', 'qatar', 'saudi arabia', 'syria', 'turkey', 
    'türkiye', 'turkiye', 'uae', 'united arab emirates', 'yemen'
  ].includes(normalized)) {
    return 'middle-east';
  }
  
  // Asia (excluding Middle East)
  if ([
    'afghanistan', 'armenia', 'azerbaijan', 'bangladesh', 'bhutan', 
    'brunei', 'cambodia', 'china', 'georgia', 'hong kong', 'india', 
    'indonesia', 'japan', 'kazakhstan', 'kyrgyzstan', 'laos', 'macau', 
    'malaysia', 'maldives', 'mongolia', 'myanmar', 'nepal', 'north korea', 
    'dprk', 'pakistan', 'philippines', 'singapore', 'south korea', 
    'republic of korea', 'sri lanka', 'taiwan', 'tajikistan', 'thailand', 
    'timor-leste', 'turkmenistan', 'uzbekistan', 'vietnam'
  ].includes(normalized)) {
    return 'asia';
  }
  
  // Oceania
  if ([
    'australia', 'fiji', 'kiribati', 'marshall islands', 'micronesia', 
    'nauru', 'new zealand', 'palau', 'papua new guinea', 'samoa', 
    'solomon islands', 'tonga', 'tuvalu', 'vanuatu'
  ].includes(normalized)) {
    return 'oceania';
  }
  
  // Default to null if unknown
  return null;
}

export function getRegionLabel(region: WorldRegion): string {
  if (!region) return 'All Regions';
  const labels: Record<Exclude<WorldRegion, null>, string> = {
    'north-america': 'North America',
    'south-america': 'South America',
    'europe': 'Europe',
    'africa': 'Africa',
    'middle-east': 'Middle East',
    'asia': 'Asia',
    'oceania': 'Oceania',
  };
  return labels[region];
}
