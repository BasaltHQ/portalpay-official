/**
 * BasaltSurge Node Region Registry
 * 
 * Comprehensive, granular list of regions across all continents.
 * Each region supports up to 25 concurrent node operators.
 */

import type { NodeRegion } from '@/types/node';

// ─── Region Definitions ──────────────────────────────────────────────────────

export const NODE_REGIONS: NodeRegion[] = [

  // ════════════════════════════════════════════════════════════════════════════
  // NORTH AMERICA
  // ════════════════════════════════════════════════════════════════════════════

  // United States
  { regionId: 'us-east-va',        name: 'US East (Virginia)',          continent: 'North America', maxNodes: 25, lat: 37.43,  lng: -79.44 },
  { regionId: 'us-east-ny',        name: 'US East (New York)',          continent: 'North America', maxNodes: 25, lat: 40.71,  lng: -74.01 },
  { regionId: 'us-east-fl',        name: 'US Southeast (Florida)',      continent: 'North America', maxNodes: 25, lat: 25.76,  lng: -80.19 },
  { regionId: 'us-east-ga',        name: 'US Southeast (Georgia)',      continent: 'North America', maxNodes: 25, lat: 33.75,  lng: -84.39 },
  { regionId: 'us-east-ma',        name: 'US Northeast (Massachusetts)',continent: 'North America', maxNodes: 25, lat: 42.36,  lng: -71.06 },
  { regionId: 'us-east-pa',        name: 'US Mid-Atlantic (Pennsylvania)', continent: 'North America', maxNodes: 25, lat: 39.95, lng: -75.17 },
  { regionId: 'us-central-tx',     name: 'US Central (Texas)',          continent: 'North America', maxNodes: 25, lat: 32.78,  lng: -96.80 },
  { regionId: 'us-central-il',     name: 'US Central (Illinois)',       continent: 'North America', maxNodes: 25, lat: 41.88,  lng: -87.63 },
  { regionId: 'us-central-oh',     name: 'US Central (Ohio)',           continent: 'North America', maxNodes: 25, lat: 39.96,  lng: -82.99 },
  { regionId: 'us-central-co',     name: 'US Mountain (Colorado)',      continent: 'North America', maxNodes: 25, lat: 39.74,  lng: -104.99 },
  { regionId: 'us-central-mn',     name: 'US Upper Midwest (Minnesota)',continent: 'North America', maxNodes: 25, lat: 44.98,  lng: -93.27 },
  { regionId: 'us-central-mo',     name: 'US Midwest (Missouri)',       continent: 'North America', maxNodes: 25, lat: 38.63,  lng: -90.20 },
  { regionId: 'us-west-or',        name: 'US West (Oregon)',            continent: 'North America', maxNodes: 25, lat: 45.52,  lng: -122.68 },
  { regionId: 'us-west-ca-n',      name: 'US West (Northern California)', continent: 'North America', maxNodes: 25, lat: 37.77, lng: -122.42 },
  { regionId: 'us-west-ca-s',      name: 'US West (Southern California)', continent: 'North America', maxNodes: 25, lat: 34.05, lng: -118.24 },
  { regionId: 'us-west-wa',        name: 'US Northwest (Washington)',   continent: 'North America', maxNodes: 25, lat: 47.61,  lng: -122.33 },
  { regionId: 'us-west-az',        name: 'US Southwest (Arizona)',      continent: 'North America', maxNodes: 25, lat: 33.45,  lng: -112.07 },
  { regionId: 'us-west-nv',        name: 'US West (Nevada)',            continent: 'North America', maxNodes: 25, lat: 36.17,  lng: -115.14 },
  { regionId: 'us-west-ut',        name: 'US Mountain (Utah)',          continent: 'North America', maxNodes: 25, lat: 40.76,  lng: -111.89 },
  { regionId: 'us-south-nc',       name: 'US South (North Carolina)',   continent: 'North America', maxNodes: 25, lat: 35.78,  lng: -78.64 },
  { regionId: 'us-south-tn',       name: 'US South (Tennessee)',        continent: 'North America', maxNodes: 25, lat: 36.16,  lng: -86.78 },
  { regionId: 'us-south-la',       name: 'US South (Louisiana)',        continent: 'North America', maxNodes: 25, lat: 29.95,  lng: -90.07 },
  { regionId: 'us-hawaii',         name: 'US Pacific (Hawaii)',         continent: 'North America', maxNodes: 25, lat: 21.31,  lng: -157.86 },
  { regionId: 'us-alaska',         name: 'US Arctic (Alaska)',          continent: 'North America', maxNodes: 25, lat: 61.22,  lng: -149.90 },

  // Canada
  { regionId: 'ca-east',           name: 'Canada East (Montreal)',      continent: 'North America', maxNodes: 25, lat: 45.50,  lng: -73.57 },
  { regionId: 'ca-east-on',        name: 'Canada Central (Toronto)',    continent: 'North America', maxNodes: 25, lat: 43.65,  lng: -79.38 },
  { regionId: 'ca-central',        name: 'Canada Central (Ottawa)',     continent: 'North America', maxNodes: 25, lat: 45.42,  lng: -75.70 },
  { regionId: 'ca-west-ab',        name: 'Canada West (Calgary)',       continent: 'North America', maxNodes: 25, lat: 51.05,  lng: -114.07 },
  { regionId: 'ca-west-bc',        name: 'Canada West (Vancouver)',     continent: 'North America', maxNodes: 25, lat: 49.28,  lng: -123.12 },
  { regionId: 'ca-prairies',       name: 'Canada Prairies (Winnipeg)',  continent: 'North America', maxNodes: 25, lat: 49.90,  lng: -97.14 },

  // Mexico & Central America
  { regionId: 'mx-central',        name: 'Mexico Central (Mexico City)',  continent: 'North America', maxNodes: 25, lat: 19.43, lng: -99.13 },
  { regionId: 'mx-north',          name: 'Mexico North (Monterrey)',      continent: 'North America', maxNodes: 25, lat: 25.67, lng: -100.31 },
  { regionId: 'mx-west',           name: 'Mexico West (Guadalajara)',     continent: 'North America', maxNodes: 25, lat: 20.67, lng: -103.35 },
  { regionId: 'mx-south',          name: 'Mexico South (Cancún)',         continent: 'North America', maxNodes: 25, lat: 21.16, lng: -86.85 },
  { regionId: 'gt-central',        name: 'Guatemala (Guatemala City)',    continent: 'North America', maxNodes: 25, lat: 14.63, lng: -90.51 },
  { regionId: 'cr-central',        name: 'Costa Rica (San José)',         continent: 'North America', maxNodes: 25, lat: 9.93,  lng: -84.08 },
  { regionId: 'pa-central',        name: 'Panama (Panama City)',          continent: 'North America', maxNodes: 25, lat: 8.98,  lng: -79.52 },

  // Caribbean
  { regionId: 'cb-pr',             name: 'Caribbean (Puerto Rico)',       continent: 'North America', maxNodes: 25, lat: 18.47, lng: -66.11 },
  { regionId: 'cb-jm',             name: 'Caribbean (Jamaica)',           continent: 'North America', maxNodes: 25, lat: 18.11, lng: -77.30 },
  { regionId: 'cb-do',             name: 'Caribbean (Dominican Republic)',continent: 'North America', maxNodes: 25, lat: 18.49, lng: -69.90 },
  { regionId: 'cb-tt',             name: 'Caribbean (Trinidad & Tobago)', continent: 'North America', maxNodes: 25, lat: 10.65, lng: -61.50 },

  // ════════════════════════════════════════════════════════════════════════════
  // SOUTH AMERICA
  // ════════════════════════════════════════════════════════════════════════════

  { regionId: 'br-southeast',      name: 'Brazil Southeast (São Paulo)',    continent: 'South America', maxNodes: 25, lat: -23.55, lng: -46.63 },
  { regionId: 'br-southeast-rj',   name: 'Brazil Southeast (Rio de Janeiro)', continent: 'South America', maxNodes: 25, lat: -22.91, lng: -43.17 },
  { regionId: 'br-south',          name: 'Brazil South (Porto Alegre)',      continent: 'South America', maxNodes: 25, lat: -30.03, lng: -51.23 },
  { regionId: 'br-northeast',      name: 'Brazil Northeast (Recife)',       continent: 'South America', maxNodes: 25, lat: -8.05,  lng: -34.87 },
  { regionId: 'br-north',          name: 'Brazil North (Manaus)',           continent: 'South America', maxNodes: 25, lat: -3.12,  lng: -60.02 },
  { regionId: 'br-central',        name: 'Brazil Central (Brasília)',       continent: 'South America', maxNodes: 25, lat: -15.79, lng: -47.88 },
  { regionId: 'ar-central',        name: 'Argentina (Buenos Aires)',        continent: 'South America', maxNodes: 25, lat: -34.60, lng: -58.38 },
  { regionId: 'ar-south',          name: 'Argentina South (Patagonia)',     continent: 'South America', maxNodes: 25, lat: -41.13, lng: -71.30 },
  { regionId: 'co-central',        name: 'Colombia (Bogotá)',              continent: 'South America', maxNodes: 25, lat: 4.71,   lng: -74.07 },
  { regionId: 'co-north',          name: 'Colombia North (Medellín)',      continent: 'South America', maxNodes: 25, lat: 6.25,   lng: -75.56 },
  { regionId: 'cl-central',        name: 'Chile (Santiago)',                continent: 'South America', maxNodes: 25, lat: -33.45, lng: -70.67 },
  { regionId: 'pe-central',        name: 'Peru (Lima)',                     continent: 'South America', maxNodes: 25, lat: -12.05, lng: -77.04 },
  { regionId: 'ec-central',        name: 'Ecuador (Quito)',                continent: 'South America', maxNodes: 25, lat: -0.18,  lng: -78.47 },
  { regionId: 've-central',        name: 'Venezuela (Caracas)',             continent: 'South America', maxNodes: 25, lat: 10.50,  lng: -66.90 },
  { regionId: 'uy-central',        name: 'Uruguay (Montevideo)',            continent: 'South America', maxNodes: 25, lat: -34.90, lng: -56.19 },
  { regionId: 'py-central',        name: 'Paraguay (Asunción)',             continent: 'South America', maxNodes: 25, lat: -25.26, lng: -57.58 },
  { regionId: 'bo-central',        name: 'Bolivia (La Paz)',                continent: 'South America', maxNodes: 25, lat: -16.50, lng: -68.15 },

  // ════════════════════════════════════════════════════════════════════════════
  // EUROPE
  // ════════════════════════════════════════════════════════════════════════════

  // Western Europe
  { regionId: 'uk-london',         name: 'United Kingdom (London)',      continent: 'Europe', maxNodes: 25, lat: 51.51,  lng: -0.13 },
  { regionId: 'uk-manchester',     name: 'United Kingdom (Manchester)',  continent: 'Europe', maxNodes: 25, lat: 53.48,  lng: -2.24 },
  { regionId: 'uk-edinburgh',      name: 'United Kingdom (Edinburgh)',   continent: 'Europe', maxNodes: 25, lat: 55.95,  lng: -3.19 },
  { regionId: 'ie-dublin',         name: 'Ireland (Dublin)',             continent: 'Europe', maxNodes: 25, lat: 53.35,  lng: -6.26 },
  { regionId: 'fr-paris',          name: 'France (Paris)',               continent: 'Europe', maxNodes: 25, lat: 48.86,  lng: 2.35 },
  { regionId: 'fr-marseille',      name: 'France (Marseille)',           continent: 'Europe', maxNodes: 25, lat: 43.30,  lng: 5.37 },
  { regionId: 'nl-amsterdam',      name: 'Netherlands (Amsterdam)',      continent: 'Europe', maxNodes: 25, lat: 52.37,  lng: 4.90 },
  { regionId: 'be-brussels',       name: 'Belgium (Brussels)',           continent: 'Europe', maxNodes: 25, lat: 50.85,  lng: 4.35 },
  { regionId: 'lu-luxembourg',     name: 'Luxembourg (Luxembourg)',      continent: 'Europe', maxNodes: 25, lat: 49.61,  lng: 6.13 },

  // Central Europe
  { regionId: 'de-frankfurt',      name: 'Germany (Frankfurt)',          continent: 'Europe', maxNodes: 25, lat: 50.11,  lng: 8.68 },
  { regionId: 'de-berlin',         name: 'Germany (Berlin)',             continent: 'Europe', maxNodes: 25, lat: 52.52,  lng: 13.41 },
  { regionId: 'de-munich',         name: 'Germany (Munich)',             continent: 'Europe', maxNodes: 25, lat: 48.14,  lng: 11.58 },
  { regionId: 'ch-zurich',         name: 'Switzerland (Zürich)',         continent: 'Europe', maxNodes: 25, lat: 47.38,  lng: 8.54 },
  { regionId: 'ch-geneva',         name: 'Switzerland (Geneva)',         continent: 'Europe', maxNodes: 25, lat: 46.20,  lng: 6.14 },
  { regionId: 'at-vienna',         name: 'Austria (Vienna)',             continent: 'Europe', maxNodes: 25, lat: 48.21,  lng: 16.37 },
  { regionId: 'cz-prague',         name: 'Czech Republic (Prague)',      continent: 'Europe', maxNodes: 25, lat: 50.08,  lng: 14.44 },
  { regionId: 'pl-warsaw',         name: 'Poland (Warsaw)',              continent: 'Europe', maxNodes: 25, lat: 52.23,  lng: 21.01 },
  { regionId: 'pl-krakow',         name: 'Poland (Kraków)',              continent: 'Europe', maxNodes: 25, lat: 50.06,  lng: 19.94 },
  { regionId: 'hu-budapest',       name: 'Hungary (Budapest)',           continent: 'Europe', maxNodes: 25, lat: 47.50,  lng: 19.04 },
  { regionId: 'sk-bratislava',     name: 'Slovakia (Bratislava)',        continent: 'Europe', maxNodes: 25, lat: 48.15,  lng: 17.11 },

  // Northern Europe
  { regionId: 'se-stockholm',      name: 'Sweden (Stockholm)',           continent: 'Europe', maxNodes: 25, lat: 59.33,  lng: 18.07 },
  { regionId: 'no-oslo',           name: 'Norway (Oslo)',                continent: 'Europe', maxNodes: 25, lat: 59.91,  lng: 10.75 },
  { regionId: 'dk-copenhagen',     name: 'Denmark (Copenhagen)',         continent: 'Europe', maxNodes: 25, lat: 55.68,  lng: 12.57 },
  { regionId: 'fi-helsinki',       name: 'Finland (Helsinki)',            continent: 'Europe', maxNodes: 25, lat: 60.17,  lng: 24.94 },
  { regionId: 'is-reykjavik',     name: 'Iceland (Reykjavik)',           continent: 'Europe', maxNodes: 25, lat: 64.15,  lng: -21.94 },
  { regionId: 'ee-tallinn',       name: 'Estonia (Tallinn)',             continent: 'Europe', maxNodes: 25, lat: 59.44,  lng: 24.75 },
  { regionId: 'lv-riga',          name: 'Latvia (Riga)',                 continent: 'Europe', maxNodes: 25, lat: 56.95,  lng: 24.11 },
  { regionId: 'lt-vilnius',       name: 'Lithuania (Vilnius)',            continent: 'Europe', maxNodes: 25, lat: 54.69,  lng: 25.28 },

  // Southern Europe
  { regionId: 'es-madrid',         name: 'Spain (Madrid)',               continent: 'Europe', maxNodes: 25, lat: 40.42,  lng: -3.70 },
  { regionId: 'es-barcelona',      name: 'Spain (Barcelona)',            continent: 'Europe', maxNodes: 25, lat: 41.39,  lng: 2.17 },
  { regionId: 'pt-lisbon',         name: 'Portugal (Lisbon)',            continent: 'Europe', maxNodes: 25, lat: 38.72,  lng: -9.14 },
  { regionId: 'it-milan',          name: 'Italy (Milan)',                continent: 'Europe', maxNodes: 25, lat: 45.46,  lng: 9.19 },
  { regionId: 'it-rome',           name: 'Italy (Rome)',                 continent: 'Europe', maxNodes: 25, lat: 41.90,  lng: 12.50 },
  { regionId: 'gr-athens',         name: 'Greece (Athens)',              continent: 'Europe', maxNodes: 25, lat: 37.98,  lng: 23.73 },
  { regionId: 'hr-zagreb',         name: 'Croatia (Zagreb)',             continent: 'Europe', maxNodes: 25, lat: 45.81,  lng: 15.98 },
  { regionId: 'rs-belgrade',       name: 'Serbia (Belgrade)',            continent: 'Europe', maxNodes: 25, lat: 44.79,  lng: 20.47 },
  { regionId: 'ro-bucharest',      name: 'Romania (Bucharest)',          continent: 'Europe', maxNodes: 25, lat: 44.43,  lng: 26.10 },
  { regionId: 'bg-sofia',          name: 'Bulgaria (Sofia)',             continent: 'Europe', maxNodes: 25, lat: 42.70,  lng: 23.32 },
  { regionId: 'si-ljubljana',      name: 'Slovenia (Ljubljana)',         continent: 'Europe', maxNodes: 25, lat: 46.06,  lng: 14.51 },
  { regionId: 'mt-valletta',       name: 'Malta (Valletta)',             continent: 'Europe', maxNodes: 25, lat: 35.90,  lng: 14.51 },
  { regionId: 'cy-nicosia',        name: 'Cyprus (Nicosia)',             continent: 'Europe', maxNodes: 25, lat: 35.17,  lng: 33.36 },

  // Eastern Europe / CIS
  { regionId: 'ua-kyiv',           name: 'Ukraine (Kyiv)',               continent: 'Europe', maxNodes: 25, lat: 50.45,  lng: 30.52 },
  { regionId: 'md-chisinau',       name: 'Moldova (Chișinău)',           continent: 'Europe', maxNodes: 25, lat: 47.01,  lng: 28.86 },
  { regionId: 'ge-tbilisi',        name: 'Georgia (Tbilisi)',            continent: 'Europe', maxNodes: 25, lat: 41.72,  lng: 44.78 },
  { regionId: 'am-yerevan',        name: 'Armenia (Yerevan)',            continent: 'Europe', maxNodes: 25, lat: 40.18,  lng: 44.51 },

  // ════════════════════════════════════════════════════════════════════════════
  // AFRICA
  // ════════════════════════════════════════════════════════════════════════════

  // North Africa
  { regionId: 'eg-cairo',          name: 'Egypt (Cairo)',                continent: 'Africa', maxNodes: 25, lat: 30.04,  lng: 31.24 },
  { regionId: 'ma-casablanca',     name: 'Morocco (Casablanca)',         continent: 'Africa', maxNodes: 25, lat: 33.59,  lng: -7.59 },
  { regionId: 'tn-tunis',          name: 'Tunisia (Tunis)',              continent: 'Africa', maxNodes: 25, lat: 36.81,  lng: 10.17 },

  // West Africa
  { regionId: 'ng-lagos',          name: 'Nigeria (Lagos)',              continent: 'Africa', maxNodes: 25, lat: 6.52,   lng: 3.38 },
  { regionId: 'ng-abuja',          name: 'Nigeria (Abuja)',              continent: 'Africa', maxNodes: 25, lat: 9.06,   lng: 7.49 },
  { regionId: 'gh-accra',          name: 'Ghana (Accra)',                continent: 'Africa', maxNodes: 25, lat: 5.60,   lng: -0.19 },
  { regionId: 'sn-dakar',          name: 'Senegal (Dakar)',              continent: 'Africa', maxNodes: 25, lat: 14.72,  lng: -17.47 },
  { regionId: 'ci-abidjan',        name: "Côte d'Ivoire (Abidjan)",     continent: 'Africa', maxNodes: 25, lat: 5.36,   lng: -4.01 },

  // East Africa
  { regionId: 'ke-nairobi',        name: 'Kenya (Nairobi)',              continent: 'Africa', maxNodes: 25, lat: -1.29,  lng: 36.82 },
  { regionId: 'tz-dar',            name: 'Tanzania (Dar es Salaam)',     continent: 'Africa', maxNodes: 25, lat: -6.79,  lng: 39.28 },
  { regionId: 'et-addis',          name: 'Ethiopia (Addis Ababa)',       continent: 'Africa', maxNodes: 25, lat: 9.02,   lng: 38.75 },
  { regionId: 'rw-kigali',         name: 'Rwanda (Kigali)',              continent: 'Africa', maxNodes: 25, lat: -1.94,  lng: 29.87 },
  { regionId: 'ug-kampala',        name: 'Uganda (Kampala)',             continent: 'Africa', maxNodes: 25, lat: 0.35,   lng: 32.58 },

  // Southern Africa
  { regionId: 'za-johannesburg',   name: 'South Africa (Johannesburg)', continent: 'Africa', maxNodes: 25, lat: -26.20, lng: 28.05 },
  { regionId: 'za-cape-town',      name: 'South Africa (Cape Town)',    continent: 'Africa', maxNodes: 25, lat: -33.93, lng: 18.42 },
  { regionId: 'mz-maputo',         name: 'Mozambique (Maputo)',          continent: 'Africa', maxNodes: 25, lat: -25.97, lng: 32.57 },
  { regionId: 'mu-port-louis',     name: 'Mauritius (Port Louis)',       continent: 'Africa', maxNodes: 25, lat: -20.16, lng: 57.50 },

  // Central Africa
  { regionId: 'cm-douala',         name: 'Cameroon (Douala)',            continent: 'Africa', maxNodes: 25, lat: 4.05,   lng: 9.77 },
  { regionId: 'cd-kinshasa',       name: 'DR Congo (Kinshasa)',          continent: 'Africa', maxNodes: 25, lat: -4.44,  lng: 15.27 },

  // ════════════════════════════════════════════════════════════════════════════
  // MIDDLE EAST
  // ════════════════════════════════════════════════════════════════════════════

  { regionId: 'ae-dubai',          name: 'UAE (Dubai)',                  continent: 'Middle East', maxNodes: 25, lat: 25.20,  lng: 55.27 },
  { regionId: 'ae-abu-dhabi',      name: 'UAE (Abu Dhabi)',              continent: 'Middle East', maxNodes: 25, lat: 24.45,  lng: 54.65 },
  { regionId: 'sa-riyadh',         name: 'Saudi Arabia (Riyadh)',        continent: 'Middle East', maxNodes: 25, lat: 24.69,  lng: 46.72 },
  { regionId: 'sa-jeddah',         name: 'Saudi Arabia (Jeddah)',        continent: 'Middle East', maxNodes: 25, lat: 21.49,  lng: 39.19 },
  { regionId: 'qa-doha',           name: 'Qatar (Doha)',                 continent: 'Middle East', maxNodes: 25, lat: 25.29,  lng: 51.53 },
  { regionId: 'bh-manama',         name: 'Bahrain (Manama)',             continent: 'Middle East', maxNodes: 25, lat: 26.23,  lng: 50.59 },
  { regionId: 'kw-kuwait',         name: 'Kuwait (Kuwait City)',         continent: 'Middle East', maxNodes: 25, lat: 29.38,  lng: 47.98 },
  { regionId: 'om-muscat',         name: 'Oman (Muscat)',                continent: 'Middle East', maxNodes: 25, lat: 23.59,  lng: 58.38 },
  { regionId: 'jo-amman',          name: 'Jordan (Amman)',               continent: 'Middle East', maxNodes: 25, lat: 31.95,  lng: 35.93 },
  { regionId: 'lb-beirut',         name: 'Lebanon (Beirut)',             continent: 'Middle East', maxNodes: 25, lat: 33.89,  lng: 35.50 },
  { regionId: 'il-tel-aviv',       name: 'Israel (Tel Aviv)',            continent: 'Middle East', maxNodes: 25, lat: 32.09,  lng: 34.78 },
  { regionId: 'tr-istanbul',       name: 'Turkey (Istanbul)',            continent: 'Middle East', maxNodes: 25, lat: 41.01,  lng: 28.98 },
  { regionId: 'tr-ankara',         name: 'Turkey (Ankara)',              continent: 'Middle East', maxNodes: 25, lat: 39.93,  lng: 32.86 },
  { regionId: 'iq-baghdad',        name: 'Iraq (Baghdad)',               continent: 'Middle East', maxNodes: 25, lat: 33.31,  lng: 44.37 },

  // ════════════════════════════════════════════════════════════════════════════
  // ASIA
  // ════════════════════════════════════════════════════════════════════════════

  // East Asia
  { regionId: 'jp-tokyo',          name: 'Japan (Tokyo)',                continent: 'Asia', maxNodes: 25, lat: 35.68,  lng: 139.69 },
  { regionId: 'jp-osaka',          name: 'Japan (Osaka)',                continent: 'Asia', maxNodes: 25, lat: 34.69,  lng: 135.50 },
  { regionId: 'kr-seoul',          name: 'South Korea (Seoul)',          continent: 'Asia', maxNodes: 25, lat: 37.57,  lng: 126.98 },
  { regionId: 'kr-busan',          name: 'South Korea (Busan)',          continent: 'Asia', maxNodes: 25, lat: 35.18,  lng: 129.08 },
  { regionId: 'tw-taipei',         name: 'Taiwan (Taipei)',              continent: 'Asia', maxNodes: 25, lat: 25.03,  lng: 121.57 },
  { regionId: 'cn-hong-kong',      name: 'Hong Kong',                   continent: 'Asia', maxNodes: 25, lat: 22.32,  lng: 114.17 },
  { regionId: 'cn-shanghai',       name: 'China (Shanghai)',             continent: 'Asia', maxNodes: 25, lat: 31.23,  lng: 121.47 },
  { regionId: 'cn-beijing',        name: 'China (Beijing)',              continent: 'Asia', maxNodes: 25, lat: 39.90,  lng: 116.40 },
  { regionId: 'cn-shenzhen',       name: 'China (Shenzhen)',             continent: 'Asia', maxNodes: 25, lat: 22.54,  lng: 114.06 },
  { regionId: 'mn-ulaanbaatar',    name: 'Mongolia (Ulaanbaatar)',      continent: 'Asia', maxNodes: 25, lat: 47.91,  lng: 106.91 },

  // South Asia
  { regionId: 'in-mumbai',         name: 'India (Mumbai)',               continent: 'Asia', maxNodes: 25, lat: 19.08,  lng: 72.88 },
  { regionId: 'in-delhi',          name: 'India (New Delhi)',             continent: 'Asia', maxNodes: 25, lat: 28.61,  lng: 77.21 },
  { regionId: 'in-bangalore',      name: 'India (Bangalore)',            continent: 'Asia', maxNodes: 25, lat: 12.97,  lng: 77.59 },
  { regionId: 'in-hyderabad',      name: 'India (Hyderabad)',            continent: 'Asia', maxNodes: 25, lat: 17.39,  lng: 78.49 },
  { regionId: 'in-chennai',        name: 'India (Chennai)',              continent: 'Asia', maxNodes: 25, lat: 13.08,  lng: 80.27 },
  { regionId: 'in-kolkata',        name: 'India (Kolkata)',              continent: 'Asia', maxNodes: 25, lat: 22.57,  lng: 88.36 },
  { regionId: 'pk-karachi',        name: 'Pakistan (Karachi)',           continent: 'Asia', maxNodes: 25, lat: 24.86,  lng: 67.01 },
  { regionId: 'pk-lahore',         name: 'Pakistan (Lahore)',            continent: 'Asia', maxNodes: 25, lat: 31.55,  lng: 74.35 },
  { regionId: 'bd-dhaka',          name: 'Bangladesh (Dhaka)',           continent: 'Asia', maxNodes: 25, lat: 23.81,  lng: 90.41 },
  { regionId: 'lk-colombo',        name: 'Sri Lanka (Colombo)',          continent: 'Asia', maxNodes: 25, lat: 6.93,   lng: 79.84 },
  { regionId: 'np-kathmandu',      name: 'Nepal (Kathmandu)',            continent: 'Asia', maxNodes: 25, lat: 27.72,  lng: 85.32 },

  // Southeast Asia
  { regionId: 'sg-singapore',      name: 'Singapore',                    continent: 'Asia', maxNodes: 25, lat: 1.35,   lng: 103.82 },
  { regionId: 'my-kuala-lumpur',   name: 'Malaysia (Kuala Lumpur)',       continent: 'Asia', maxNodes: 25, lat: 3.14,   lng: 101.69 },
  { regionId: 'th-bangkok',        name: 'Thailand (Bangkok)',            continent: 'Asia', maxNodes: 25, lat: 13.76,  lng: 100.50 },
  { regionId: 'th-chiang-mai',     name: 'Thailand (Chiang Mai)',         continent: 'Asia', maxNodes: 25, lat: 18.79,  lng: 98.98 },
  { regionId: 'vn-ho-chi-minh',   name: 'Vietnam (Ho Chi Minh City)',    continent: 'Asia', maxNodes: 25, lat: 10.82,  lng: 106.63 },
  { regionId: 'vn-hanoi',          name: 'Vietnam (Hanoi)',               continent: 'Asia', maxNodes: 25, lat: 21.03,  lng: 105.85 },
  { regionId: 'id-jakarta',        name: 'Indonesia (Jakarta)',           continent: 'Asia', maxNodes: 25, lat: -6.21,  lng: 106.85 },
  { regionId: 'id-bali',           name: 'Indonesia (Bali)',              continent: 'Asia', maxNodes: 25, lat: -8.41,  lng: 115.19 },
  { regionId: 'ph-manila',         name: 'Philippines (Manila)',          continent: 'Asia', maxNodes: 25, lat: 14.60,  lng: 120.98 },
  { regionId: 'ph-cebu',           name: 'Philippines (Cebu)',            continent: 'Asia', maxNodes: 25, lat: 10.31,  lng: 123.89 },
  { regionId: 'mm-yangon',         name: 'Myanmar (Yangon)',              continent: 'Asia', maxNodes: 25, lat: 16.87,  lng: 96.20 },
  { regionId: 'kh-phnom-penh',    name: 'Cambodia (Phnom Penh)',          continent: 'Asia', maxNodes: 25, lat: 11.56,  lng: 104.92 },
  { regionId: 'la-vientiane',     name: 'Laos (Vientiane)',               continent: 'Asia', maxNodes: 25, lat: 17.97,  lng: 102.63 },

  // Central Asia
  { regionId: 'kz-almaty',         name: 'Kazakhstan (Almaty)',          continent: 'Asia', maxNodes: 25, lat: 43.24,  lng: 76.95 },
  { regionId: 'uz-tashkent',       name: 'Uzbekistan (Tashkent)',        continent: 'Asia', maxNodes: 25, lat: 41.30,  lng: 69.28 },

  // ════════════════════════════════════════════════════════════════════════════
  // OCEANIA
  // ════════════════════════════════════════════════════════════════════════════

  { regionId: 'au-sydney',         name: 'Australia (Sydney)',            continent: 'Oceania', maxNodes: 25, lat: -33.87, lng: 151.21 },
  { regionId: 'au-melbourne',      name: 'Australia (Melbourne)',         continent: 'Oceania', maxNodes: 25, lat: -37.81, lng: 144.96 },
  { regionId: 'au-brisbane',       name: 'Australia (Brisbane)',          continent: 'Oceania', maxNodes: 25, lat: -27.47, lng: 153.03 },
  { regionId: 'au-perth',          name: 'Australia (Perth)',             continent: 'Oceania', maxNodes: 25, lat: -31.95, lng: 115.86 },
  { regionId: 'au-adelaide',       name: 'Australia (Adelaide)',          continent: 'Oceania', maxNodes: 25, lat: -34.93, lng: 138.60 },
  { regionId: 'nz-auckland',       name: 'New Zealand (Auckland)',        continent: 'Oceania', maxNodes: 25, lat: -36.85, lng: 174.76 },
  { regionId: 'nz-wellington',     name: 'New Zealand (Wellington)',      continent: 'Oceania', maxNodes: 25, lat: -41.29, lng: 174.78 },
  { regionId: 'fj-suva',           name: 'Fiji (Suva)',                   continent: 'Oceania', maxNodes: 25, lat: -18.14, lng: 178.44 },
  { regionId: 'pg-port-moresby',   name: 'Papua New Guinea (Port Moresby)', continent: 'Oceania', maxNodes: 25, lat: -9.48, lng: 147.15 },
];

// ─── Lookup Utilities ────────────────────────────────────────────────────────

/**
 * Find a region by its ID.
 */
export function getRegionById(regionId: string): NodeRegion | undefined {
  return NODE_REGIONS.find((r) => r.regionId === regionId);
}

/**
 * Get all regions for a specific continent.
 */
export function getRegionsByContinent(continent: string): NodeRegion[] {
  const normalized = continent.toLowerCase().trim();
  return NODE_REGIONS.filter((r) => r.continent.toLowerCase() === normalized);
}

/**
 * Check if a region has reached its maximum node capacity.
 */
export function isRegionAtCapacity(regionId: string, activeNodeCount: number): boolean {
  const region = getRegionById(regionId);
  if (!region) return true; // Unknown region = always full
  return activeNodeCount >= region.maxNodes;
}

/**
 * Get all unique continent names.
 */
export function getContinents(): string[] {
  return [...new Set(NODE_REGIONS.map((r) => r.continent))];
}

/**
 * Get a display summary of all regions with optional active node counts.
 */
export function getRegionSummary(activeCountByRegion?: Record<string, number>): Array<NodeRegion & { activeNodes: number; available: number }> {
  return NODE_REGIONS.map((r) => {
    const active = activeCountByRegion?.[r.regionId] || 0;
    return {
      ...r,
      activeNodes: active,
      available: Math.max(0, r.maxNodes - active),
    };
  });
}

/**
 * Get count of regions per continent.
 */
export function getRegionCountByContinent(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const r of NODE_REGIONS) {
    counts[r.continent] = (counts[r.continent] || 0) + 1;
  }
  return counts;
}

/**
 * Search regions by name or ID (case insensitive).
 */
export function searchRegions(query: string): NodeRegion[] {
  const q = query.toLowerCase().trim();
  if (!q) return NODE_REGIONS;
  return NODE_REGIONS.filter(
    (r) => r.regionId.toLowerCase().includes(q) || r.name.toLowerCase().includes(q) || r.continent.toLowerCase().includes(q)
  );
}

/**
 * Total capacity across all regions.
 */
export const TOTAL_GLOBAL_CAPACITY = NODE_REGIONS.reduce((sum, r) => sum + r.maxNodes, 0);
