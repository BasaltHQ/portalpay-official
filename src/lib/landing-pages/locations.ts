/**
 * Location Landing Page Data
 * Programmatic SEO: city-focused pages highlighting local context and popular industries
 */

import { LocationData } from './types';

export const LOCATION_DATA: Record<string, LocationData> = {
  'nairobi-kenya': {
    slug: 'nairobi-kenya',
    name: 'Nairobi',
    city: 'Nairobi',
    country: 'Kenya',

    // SEO
    title: 'Crypto Payments in Nairobi, Kenya | PortalPay',
    metaDescription:
      'Adopt ultra-low fee crypto payments in Nairobi. Ideal for internet cafés, repair kiosks, and community groups. Instant settlement, offline support, and split payouts.',

    // Content
    localContext:
      'Nairobi’s vibrant markets and mobile-first economy make QR payments, split revenue, and offline operations valuable for internet cafés, repair shops, and savings groups.',
    popularIndustries: [
      'internet-cafes',
      'mobile-phone-repair',
      'community-radio-stations',
      'village-savings-groups',
      'artisan-potters',
    ],

    // Stats
    population: 4751000,
    businessCount: 320000,
  },

  'lagos-nigeria': {
    slug: 'lagos-nigeria',
    name: 'Lagos',
    city: 'Lagos',
    country: 'Nigeria',

    title: 'Crypto Payments in Lagos, Nigeria | PortalPay',
    metaDescription:
      'Lower fees for Lagos SMEs. Accept QR payments across markets, ferries, and repair services. Instant settlement, split payouts, and offline-first modes.',
    localContext:
      'From island ferries to mainland markets, Lagos businesses benefit from transparent ticketing, split payouts, and offline QR receipts across cafés, repair hubs, and radio stations.',
    popularIndustries: [
      'small-ferry-operators',
      'mobile-phone-repair',
      'internet-cafes',
      'community-radio-stations',
      'village-savings-groups',
    ],
    population: 15200000,
    businessCount: 500000,
  },

  'manila-philippines': {
    slug: 'manila-philippines',
    name: 'Manila',
    city: 'Manila',
    country: 'Philippines',

    title: 'Crypto Payments in Manila, Philippines | PortalPay',
    metaDescription:
      'Adopt QR payments for neighborhood stores, repair kiosks, and craft markets. Save on fees with instant settlement and offline support.',
    localContext:
      'Neighborhood shops and urban transport operators gain with QR tabs, ticketing, and split payouts. Repair kiosks and internet cafés benefit from offline-first and instant settlement.',
    popularIndustries: [
      'internet-cafes',
      'mobile-phone-repair',
      'artisan-potters',
      'community-radio-stations',
      'village-savings-groups',
    ],
    population: 13800000,
    businessCount: 450000,
  },

  'medellin-colombia': {
    slug: 'medellin-colombia',
    name: 'Medellín',
    city: 'Medellín',
    country: 'Colombia',

    title: 'Crypto Payments in Medellín, Colombia | PortalPay',
    metaDescription:
      'Save on fees for cafés, artisan shops, and local co-ops. QR receipts, split payouts, and transparent offline operations.',
    localContext:
      'A strong artisan and café scene coupled with co-op supply chains makes split payouts and QR receipts valuable for internet cafés, craft vendors, and savings groups.',
    popularIndustries: [
      'artisan-potters',
      'internet-cafes',
      'community-radio-stations',
      'village-savings-groups',
      'mobile-phone-repair',
    ],
    population: 2550000,
    businessCount: 180000,
  },

  'dhaka-bangladesh': {
    slug: 'dhaka-bangladesh',
    name: 'Dhaka',
    city: 'Dhaka',
    country: 'Bangladesh',

    title: 'Crypto Payments in Dhaka, Bangladesh | PortalPay',
    metaDescription:
      'Implement QR deposits, split payouts, and offline-first sales for tailors, markets, and repair kiosks. Ideal for dense urban operations.',
    localContext:
      'Tailoring, electronics repair, and local cafés benefit from QR deposits, warranty-like tracking via receipts, and split payouts for attendants and owners.',
    popularIndustries: [
      'mobile-phone-repair',
      'internet-cafes',
      'community-radio-stations',
      'artisan-potters',
      'village-savings-groups',
    ],
    population: 10300000,
    businessCount: 420000,
  },

  'kathmandu-nepal': {
    slug: 'kathmandu-nepal',
    name: 'Kathmandu',
    city: 'Kathmandu',
    country: 'Nepal',

    title: 'Crypto Payments in Kathmandu, Nepal | PortalPay',
    metaDescription:
      'Tourism, crafts, and transport operators adopt QR ticketing, split payouts, and offline-first operations with instant settlement.',
    localContext:
      'Tour operators, craft markets, and cafés benefit from QR ticketing, split payouts, and offline manifests; artisan and cryptid-themed tours can settle instantly.',
    popularIndustries: [
      'cryptid-tour-operators',
      'artisan-potters',
      'internet-cafes',
      'community-radio-stations',
      'village-savings-groups',
    ],
    population: 1300000,
    businessCount: 95000,
  },

  'accra-ghana': {
    slug: 'accra-ghana',
    name: 'Accra',
    city: 'Accra',
    country: 'Ghana',

    title: 'Crypto Payments in Accra, Ghana | PortalPay',
    metaDescription:
      'Lower payment costs for cafés, internet labs, and transport. QR vouchers, session tracking, and split payouts with offline-first.',
    localContext:
      'Training labs and cafés can use QR vouchers and attendant splits; coastal routes and community radio benefit from instant settlement and transparent receipts.',
    popularIndustries: [
      'internet-cafes',
      'small-ferry-operators',
      'community-radio-stations',
      'mobile-phone-repair',
      'village-savings-groups',
    ],
    population: 2300000,
    businessCount: 160000,
  },

  // Africa
  'cairo-egypt': {
    slug: 'cairo-egypt',
    name: 'Cairo',
    city: 'Cairo',
    country: 'Egypt',
    title: 'Crypto Payments in Cairo, Egypt | PortalPay',
    metaDescription:
      'Bring instant, low-fee crypto payments to Cairo’s repair hubs, cafés, and Nile transport with offline-first operations.',
    localContext:
      'Cairo’s dense retail clusters, radio networks, and river transit benefit from QR ticketing, split payouts for attendants, and instant settlement at the end of the shift.',
    popularIndustries: [
      'mobile-phone-repair',
      'internet-cafes',
      'small-ferry-operators',
      'community-radio-stations',
      'village-savings-groups',
    ],
    population: 10000000,
    businessCount: 400000,
  },

  'addis-ababa-ethiopia': {
    slug: 'addis-ababa-ethiopia',
    name: 'Addis Ababa',
    city: 'Addis Ababa',
    country: 'Ethiopia',
    title: 'Crypto Payments in Addis Ababa, Ethiopia | PortalPay',
    metaDescription:
      'QR payments and split payouts for cafés, repair shops, and co-op savings groups with offline support.',
    localContext:
      'Addis Ababa’s growing tech and artisan scenes pair well with instant QR receipts, attendant splits, and community radio campaigns.',
    popularIndustries: [
      'internet-cafes',
      'mobile-phone-repair',
      'community-radio-stations',
      'artisan-potters',
      'village-savings-groups',
    ],
    population: 5100000,
    businessCount: 210000,
  },

  'kampala-uganda': {
    slug: 'kampala-uganda',
    name: 'Kampala',
    city: 'Kampala',
    country: 'Uganda',
    title: 'Crypto Payments in Kampala, Uganda | PortalPay',
    metaDescription:
      'Adopt QR payments and instant settlement for repair kiosks, cafés, ferries, and savings groups.',
    localContext:
      'Kampala’s commuter corridors and craft vendors can use QR ticketing, inventory tagging, and split payouts for staff and owners.',
    popularIndustries: [
      'mobile-phone-repair',
      'internet-cafes',
      'small-ferry-operators',
      'village-savings-groups',
      'community-radio-stations',
    ],
    population: 1700000,
    businessCount: 120000,
  },

  'dar-es-salaam-tanzania': {
    slug: 'dar-es-salaam-tanzania',
    name: 'Dar es Salaam',
    city: 'Dar es Salaam',
    country: 'Tanzania',
    title: 'Crypto Payments in Dar es Salaam, Tanzania | PortalPay',
    metaDescription:
      'Instant settlement and offline-first QR payments for coastal ferries, cafés, and repair hubs.',
    localContext:
      'Coastal ferries, radio stations, and repair markets benefit from transparent QR tickets, receipts, and split payouts.',
    popularIndustries: [
      'small-ferry-operators',
      'internet-cafes',
      'mobile-phone-repair',
      'community-radio-stations',
      'village-savings-groups',
    ],
    population: 7000000,
    businessCount: 250000,
  },

  'abidjan-cote-divoire': {
    slug: 'abidjan-cote-divoire',
    name: 'Abidjan',
    city: 'Abidjan',
    country: 'Côte d’Ivoire',
    title: 'Crypto Payments in Abidjan, Côte d’Ivoire | PortalPay',
    metaDescription:
      'Low-fee QR payments and split payouts for cafés, repair kiosks, and artisan vendors.',
    localContext:
      'Abidjan’s craft markets and tech-savvy youth culture align with instant settlement, QR receipts, and community radio engagement.',
    popularIndustries: [
      'artisan-potters',
      'mobile-phone-repair',
      'internet-cafes',
      'community-radio-stations',
      'village-savings-groups',
    ],
    population: 5600000,
    businessCount: 220000,
  },

  'dakar-senegal': {
    slug: 'dakar-senegal',
    name: 'Dakar',
    city: 'Dakar',
    country: 'Senegal',
    title: 'Crypto Payments in Dakar, Senegal | PortalPay',
    metaDescription:
      'QR payments and instant settlement for coastal transport, artisan vendors, and internet cafés.',
    localContext:
      'Dakar’s coastline services and craft scenes benefit from split payouts, QR ticketing, and offline operations in patchy connectivity.',
    popularIndustries: [
      'small-ferry-operators',
      'artisan-potters',
      'internet-cafes',
      'community-radio-stations',
      'mobile-phone-repair',
    ],
    population: 1200000,
    businessCount: 90000,
  },

  'kigali-rwanda': {
    slug: 'kigali-rwanda',
    name: 'Kigali',
    city: 'Kigali',
    country: 'Rwanda',
    title: 'Crypto Payments in Kigali, Rwanda | PortalPay',
    metaDescription:
      'Transparent QR receipts, inventory tagging, and split payouts for cafés, repair hubs, and savings groups.',
    localContext:
      'Kigali’s organized SME environment suits instant settlement, QR receipts, and community radio outreach for education.',
    popularIndustries: [
      'internet-cafes',
      'mobile-phone-repair',
      'village-savings-groups',
      'community-radio-stations',
      'artisan-potters',
    ],
    population: 1200000,
    businessCount: 95000,
  },

  'lusaka-zambia': {
    slug: 'lusaka-zambia',
    name: 'Lusaka',
    city: 'Lusaka',
    country: 'Zambia',
    title: 'Crypto Payments in Lusaka, Zambia | PortalPay',
    metaDescription:
      'Adopt offline-first QR payments and instant settlement for cafés, repair hubs, and savings groups.',
    localContext:
      'Lusaka’s retail and transport services use QR receipts for transparency and split payouts for staff and drivers.',
    popularIndustries: [
      'internet-cafes',
      'mobile-phone-repair',
      'village-savings-groups',
      'community-radio-stations',
      'small-ferry-operators',
    ],
    population: 2800000,
    businessCount: 110000,
  },

  'harare-zimbabwe': {
    slug: 'harare-zimbabwe',
    name: 'Harare',
    city: 'Harare',
    country: 'Zimbabwe',
    title: 'Crypto Payments in Harare, Zimbabwe | PortalPay',
    metaDescription:
      'QR receipts, instant settlement, and split payouts for artisan vendors, cafés, and repair shops.',
    localContext:
      'Harare’s SMEs can improve cash flow with instant settlement, QR receipts, and transparency for co-ops and savings groups.',
    popularIndustries: [
      'artisan-potters',
      'mobile-phone-repair',
      'internet-cafes',
      'village-savings-groups',
      'community-radio-stations',
    ],
    population: 1600000,
    businessCount: 100000,
  },

  'maputo-mozambique': {
    slug: 'maputo-mozambique',
    name: 'Maputo',
    city: 'Maputo',
    country: 'Mozambique',
    title: 'Crypto Payments in Maputo, Mozambique | PortalPay',
    metaDescription:
      'Instant settlement for coastal ferries, cafés, and repair hubs with offline-first QR payments.',
    localContext:
      'Coastal services and craft markets benefit from QR ticketing, split payouts, and inventory tagging.',
    popularIndustries: [
      'small-ferry-operators',
      'internet-cafes',
      'mobile-phone-repair',
      'artisan-potters',
      'community-radio-stations',
    ],
    population: 1200000,
    businessCount: 85000,
  },

  // South Asia
  'mumbai-india': {
    slug: 'mumbai-india',
    name: 'Mumbai',
    city: 'Mumbai',
    country: 'India',
    title: 'Crypto Payments in Mumbai, India | PortalPay',
    metaDescription:
      'Scale QR payments for cafés, repair kiosks, and savings groups with instant settlement and offline support.',
    localContext:
      'Mumbai’s dense retail corridors and commuter flows suit QR receipts, split payouts, and instant settlement at day’s end.',
    popularIndustries: [
      'internet-cafes',
      'mobile-phone-repair',
      'village-savings-groups',
      'community-radio-stations',
      'artisan-potters',
    ],
    population: 20400000,
    businessCount: 600000,
  },

  'delhi-india': {
    slug: 'delhi-india',
    name: 'Delhi',
    city: 'Delhi',
    country: 'India',
    title: 'Crypto Payments in Delhi, India | PortalPay',
    metaDescription:
      'Low-fee QR payments and transparent receipts for repair hubs, cafés, and artisan markets.',
    localContext:
      'Delhi’s bazaars and tech hubs benefit from split payouts, QR receipts, and instant settlement across micro-merchants.',
    popularIndustries: [
      'mobile-phone-repair',
      'internet-cafes',
      'artisan-potters',
      'community-radio-stations',
      'village-savings-groups',
    ],
    population: 18000000,
    businessCount: 550000,
  },

  'karachi-pakistan': {
    slug: 'karachi-pakistan',
    name: 'Karachi',
    city: 'Karachi',
    country: 'Pakistan',
    title: 'Crypto Payments in Karachi, Pakistan | PortalPay',
    metaDescription:
      'Bring instant settlement to coastal ferries, repair kiosks, and cafés with offline-first QR payments.',
    localContext:
      'Karachi’s port economy and urban markets use QR ticketing, split payouts, and inventory tagging for transparent operations.',
    popularIndustries: [
      'small-ferry-operators',
      'mobile-phone-repair',
      'internet-cafes',
      'community-radio-stations',
      'village-savings-groups',
    ],
    population: 20000000,
    businessCount: 500000,
  },

  'lahore-pakistan': {
    slug: 'lahore-pakistan',
    name: 'Lahore',
    city: 'Lahore',
    country: 'Pakistan',
    title: 'Crypto Payments in Lahore, Pakistan | PortalPay',
    metaDescription:
      'QR receipts and split payouts for artisan vendors, cafés, and repair hubs.',
    localContext:
      'Artisan markets and repair districts benefit from instant settlement, QR receipts, and co-op savings workflows.',
    popularIndustries: [
      'artisan-potters',
      'mobile-phone-repair',
      'internet-cafes',
      'village-savings-groups',
      'community-radio-stations',
    ],
    population: 12000000,
    businessCount: 350000,
  },

  'colombo-sri-lanka': {
    slug: 'colombo-sri-lanka',
    name: 'Colombo',
    city: 'Colombo',
    country: 'Sri Lanka',
    title: 'Crypto Payments in Colombo, Sri Lanka | PortalPay',
    metaDescription:
      'Instant settlement and QR ticketing for coastal ferries, cafés, and repair kiosks.',
    localContext:
      'Coastal transit, craft vendors, and cafés use QR receipts, split payouts, and offline-first operations.',
    popularIndustries: [
      'small-ferry-operators',
      'internet-cafes',
      'mobile-phone-repair',
      'artisan-potters',
      'community-radio-stations',
    ],
    population: 650000,
    businessCount: 80000,
  },

  // Southeast Asia
  'jakarta-indonesia': {
    slug: 'jakarta-indonesia',
    name: 'Jakarta',
    city: 'Jakarta',
    country: 'Indonesia',
    title: 'Crypto Payments in Jakarta, Indonesia | PortalPay',
    metaDescription:
      'Bring QR payments and instant settlement to cafés, repair hubs, and coastal services.',
    localContext:
      'Jakarta’s commuter networks and coastal routes benefit from split payouts, QR ticketing, and offline-first support.',
    popularIndustries: [
      'internet-cafes',
      'mobile-phone-repair',
      'small-ferry-operators',
      'village-savings-groups',
      'community-radio-stations',
    ],
    population: 10000000,
    businessCount: 450000,
  },

  'surabaya-indonesia': {
    slug: 'surabaya-indonesia',
    name: 'Surabaya',
    city: 'Surabaya',
    country: 'Indonesia',
    title: 'Crypto Payments in Surabaya, Indonesia | PortalPay',
    metaDescription:
      'Instant settlement and QR receipts for ports, cafés, and repair districts.',
    localContext:
      'Port-adjacent services and repair vendors leverage QR tickets, split payouts, and inventory tagging.',
    popularIndustries: [
      'small-ferry-operators',
      'mobile-phone-repair',
      'internet-cafes',
      'community-radio-stations',
      'village-savings-groups',
    ],
    population: 2900000,
    businessCount: 160000,
  },

  'hanoi-vietnam': {
    slug: 'hanoi-vietnam',
    name: 'Hanoi',
    city: 'Hanoi',
    country: 'Vietnam',
    title: 'Crypto Payments in Hanoi, Vietnam | PortalPay',
    metaDescription:
      'QR payments and instant settlement for artisan districts, cafés, and repair kiosks.',
    localContext:
      'Hanoi’s craft neighborhoods and student cafés use QR receipts, split payouts, and offline support.',
    popularIndustries: [
      'artisan-potters',
      'internet-cafes',
      'mobile-phone-repair',
      'community-radio-stations',
      'village-savings-groups',
    ],
    population: 4800000,
    businessCount: 220000,
  },

  'ho-chi-minh-city-vietnam': {
    slug: 'ho-chi-minh-city-vietnam',
    name: 'Ho Chi Minh City',
    city: 'Ho Chi Minh City',
    country: 'Vietnam',
    title: 'Crypto Payments in Ho Chi Minh City, Vietnam | PortalPay',
    metaDescription:
      'Instant settlement and offline-first QR payments for cafés, repair hubs, and artisan vendors.',
    localContext:
      'HCMC’s bustling SME corridors benefit from split payouts, QR receipts, and co-op settlement across venues.',
    popularIndustries: [
      'internet-cafes',
      'mobile-phone-repair',
      'artisan-potters',
      'community-radio-stations',
      'village-savings-groups',
    ],
    population: 9000000,
    businessCount: 500000,
  },

  'phnom-penh-cambodia': {
    slug: 'phnom-penh-cambodia',
    name: 'Phnom Penh',
    city: 'Phnom Penh',
    country: 'Cambodia',
    title: 'Crypto Payments in Phnom Penh, Cambodia | PortalPay',
    metaDescription:
      'QR ticketing for ferries and instant settlement for cafés and repair shops. Offline-first by default.',
    localContext:
      'Phnom Penh’s riverside services and urban cafés use QR receipts, split payouts, and transparent inventory tagging.',
    popularIndustries: [
      'small-ferry-operators',
      'internet-cafes',
      'mobile-phone-repair',
      'community-radio-stations',
      'village-savings-groups',
    ],
    population: 2300000,
    businessCount: 120000,
  },

  'vientiane-laos': {
    slug: 'vientiane-laos',
    name: 'Vientiane',
    city: 'Vientiane',
    country: 'Laos',
    title: 'Crypto Payments in Vientiane, Laos | PortalPay',
    metaDescription:
      'Low-fee QR payments with instant settlement for cafés, repair hubs, and savings groups.',
    localContext:
      'Vientiane’s compact SME ecosystem benefits from QR receipts, split payouts, and offline operations.',
    popularIndustries: [
      'internet-cafes',
      'mobile-phone-repair',
      'village-savings-groups',
      'community-radio-stations',
      'artisan-potters',
    ],
    population: 900000,
    businessCount: 60000,
  },

  'yangon-myanmar': {
    slug: 'yangon-myanmar',
    name: 'Yangon',
    city: 'Yangon',
    country: 'Myanmar',
    title: 'Crypto Payments in Yangon, Myanmar | PortalPay',
    metaDescription:
      'Instant settlement and QR receipts for repair hubs, cafés, and coastal ferry services.',
    localContext:
      'Yangon’s urban SMEs can run split payouts for shifts, QR ticketing for transport, and offline-first operations.',
    popularIndustries: [
      'mobile-phone-repair',
      'internet-cafes',
      'small-ferry-operators',
      'community-radio-stations',
      'village-savings-groups',
    ],
    population: 5200000,
    businessCount: 200000,
  },

  // Latin America
  'sao-paulo-brazil': {
    slug: 'sao-paulo-brazil',
    name: 'São Paulo',
    city: 'São Paulo',
    country: 'Brazil',
    title: 'Crypto Payments in São Paulo, Brazil | PortalPay',
    metaDescription:
      'Scale low-fee QR payments for cafés, repair hubs, and artisan vendors with instant settlement.',
    localContext:
      'São Paulo’s massive SME base benefits from QR receipts, split payouts, and offline-first workflows for co-ops.',
    popularIndustries: [
      'internet-cafes',
      'mobile-phone-repair',
      'artisan-potters',
      'community-radio-stations',
      'village-savings-groups',
    ],
    population: 12300000,
    businessCount: 700000,
  },

  'rio-de-janeiro-brazil': {
    slug: 'rio-de-janeiro-brazil',
    name: 'Rio de Janeiro',
    city: 'Rio de Janeiro',
    country: 'Brazil',
    title: 'Crypto Payments in Rio de Janeiro, Brazil | PortalPay',
    metaDescription:
      'Instant settlement and QR receipts for coastal transport, cafés, and repair districts.',
    localContext:
      'Rio’s coastal services and artisan markets use QR ticketing, split payouts, and offline-first operations.',
    popularIndustries: [
      'small-ferry-operators',
      'internet-cafes',
      'mobile-phone-repair',
      'artisan-potters',
      'community-radio-stations',
    ],
    population: 6700000,
    businessCount: 300000,
  },

  'lima-peru': {
    slug: 'lima-peru',
    name: 'Lima',
    city: 'Lima',
    country: 'Peru',
    title: 'Crypto Payments in Lima, Peru | PortalPay',
    metaDescription:
      'Adopt QR payments and instant settlement for artisan vendors, cafés, and repair shops.',
    localContext:
      'Lima’s coastal and urban SME corridors benefit from QR receipts, inventory tagging, and co-op savings flows.',
    popularIndustries: [
      'artisan-potters',
      'internet-cafes',
      'mobile-phone-repair',
      'community-radio-stations',
      'village-savings-groups',
    ],
    population: 9800000,
    businessCount: 400000,
  },

  'bogota-colombia': {
    slug: 'bogota-colombia',
    name: 'Bogotá',
    city: 'Bogotá',
    country: 'Colombia',
    title: 'Crypto Payments in Bogotá, Colombia | PortalPay',
    metaDescription:
      'Bring instant settlement to cafés, repair hubs, and artisan vendors with QR receipts.',
    localContext:
      'Bogotá’s craft communities and student cafés leverage split payouts, QR receipts, and offline support.',
    popularIndustries: [
      'internet-cafes',
      'mobile-phone-repair',
      'artisan-potters',
      'community-radio-stations',
      'village-savings-groups',
    ],
    population: 7700000,
    businessCount: 380000,
  },

  'cali-colombia': {
    slug: 'cali-colombia',
    name: 'Cali',
    city: 'Cali',
    country: 'Colombia',
    title: 'Crypto Payments in Cali, Colombia | PortalPay',
    metaDescription:
      'Low-fee QR payments and instant settlement for artisan markets and cafés.',
    localContext:
      'Cali’s craft vendors and cafés benefit from transparent QR receipts, inventory tags, and split payouts.',
    popularIndustries: [
      'artisan-potters',
      'internet-cafes',
      'mobile-phone-repair',
      'village-savings-groups',
      'community-radio-stations',
    ],
    population: 2500000,
    businessCount: 160000,
  },

  'quito-ecuador': {
    slug: 'quito-ecuador',
    name: 'Quito',
    city: 'Quito',
    country: 'Ecuador',
    title: 'Crypto Payments in Quito, Ecuador | PortalPay',
    metaDescription:
      'Instant settlement and QR receipts for artisan vendors, cafés, and repair kiosks.',
    localContext:
      'Quito’s historic districts and craft markets align with QR receipts, split payouts, and offline-first support.',
    popularIndustries: [
      'artisan-potters',
      'internet-cafes',
      'mobile-phone-repair',
      'village-savings-groups',
      'community-radio-stations',
    ],
    population: 1600000,
    businessCount: 120000,
  },

  'guayaquil-ecuador': {
    slug: 'guayaquil-ecuador',
    name: 'Guayaquil',
    city: 'Guayaquil',
    country: 'Ecuador',
    title: 'Crypto Payments in Guayaquil, Ecuador | PortalPay',
    metaDescription:
      'QR ticketing and instant settlement for coastal services, cafés, and repair hubs.',
    localContext:
      'Guayaquil’s port economy uses QR tickets, split payouts for crews, and offline-first operations.',
    popularIndustries: [
      'small-ferry-operators',
      'mobile-phone-repair',
      'internet-cafes',
      'community-radio-stations',
      'village-savings-groups',
    ],
    population: 2700000,
    businessCount: 180000,
  },

  'la-paz-bolivia': {
    slug: 'la-paz-bolivia',
    name: 'La Paz',
    city: 'La Paz',
    country: 'Bolivia',
    title: 'Crypto Payments in La Paz, Bolivia | PortalPay',
    metaDescription:
      'Offline-first QR payments for high-altitude artisan vendors, cafés, and repair kiosks.',
    localContext:
      'La Paz’s craft corridors and cafés benefit from instant settlement, QR receipts, and co-op flows.',
    popularIndustries: [
      'artisan-potters',
      'internet-cafes',
      'mobile-phone-repair',
      'village-savings-groups',
      'community-radio-stations',
    ],
    population: 800000,
    businessCount: 70000,
  },

  'santa-cruz-bolivia': {
    slug: 'santa-cruz-bolivia',
    name: 'Santa Cruz',
    city: 'Santa Cruz',
    country: 'Bolivia',
    title: 'Crypto Payments in Santa Cruz, Bolivia | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for cafés, repair hubs, and artisan vendors.',
    localContext:
      'Santa Cruz’s growth corridor suits QR receipts, split payouts, and offline support for SMEs.',
    popularIndustries: [
      'internet-cafes',
      'mobile-phone-repair',
      'artisan-potters',
      'village-savings-groups',
      'community-radio-stations',
    ],
    population: 1900000,
    businessCount: 130000,
  },

  'santiago-chile': {
    slug: 'santiago-chile',
    name: 'Santiago',
    city: 'Santiago',
    country: 'Chile',
    title: 'Crypto Payments in Santiago, Chile | PortalPay',
    metaDescription:
      'Instant settlement and QR receipts for cafés, repair hubs, and artisan markets.',
    localContext:
      'Santiago’s SME backbone benefits from QR receipts, split payouts, and offline-first by default.',
    popularIndustries: [
      'internet-cafes',
      'mobile-phone-repair',
      'artisan-potters',
      'community-radio-stations',
      'village-savings-groups',
    ],
    population: 6300000,
    businessCount: 500000,
  },

  'buenos-aires-argentina': {
    slug: 'buenos-aires-argentina',
    name: 'Buenos Aires',
    city: 'Buenos Aires',
    country: 'Argentina',
    title: 'Crypto Payments in Buenos Aires, Argentina | PortalPay',
    metaDescription:
      'Adopt low-fee QR payments with instant settlement for cafés, repair kiosks, and artisan vendors.',
    localContext:
      'Buenos Aires craft districts and cafés leverage split payouts, QR receipts, and offline support.',
    popularIndustries: [
      'artisan-potters',
      'internet-cafes',
      'mobile-phone-repair',
      'community-radio-stations',
      'village-savings-groups',
    ],
    population: 3000000,
    businessCount: 450000,
  },

  'mexico-city-mexico': {
    slug: 'mexico-city-mexico',
    name: 'Mexico City',
    city: 'Mexico City',
    country: 'Mexico',
    title: 'Crypto Payments in Mexico City, Mexico | PortalPay',
    metaDescription:
      'Scale QR receipts and instant settlement for cafés, repair hubs, and artisan markets.',
    localContext:
      'Mexico City’s immense SME base can run split payouts, QR tickets, and offline-first operations.',
    popularIndustries: [
      'internet-cafes',
      'mobile-phone-repair',
      'artisan-potters',
      'community-radio-stations',
      'village-savings-groups',
    ],
    population: 9200000,
    businessCount: 800000,
  },

  'guadalajara-mexico': {
    slug: 'guadalajara-mexico',
    name: 'Guadalajara',
    city: 'Guadalajara',
    country: 'Mexico',
    title: 'Crypto Payments in Guadalajara, Mexico | PortalPay',
    metaDescription:
      'Instant settlement and QR receipts for cafés, repair shops, and artisan vendors.',
    localContext:
      'Guadalajara’s tech and craft ecosystems benefit from split payouts, QR receipts, and offline-first support.',
    popularIndustries: [
      'internet-cafes',
      'mobile-phone-repair',
      'artisan-potters',
      'village-savings-groups',
      'community-radio-stations',
    ],
    population: 1500000,
    businessCount: 180000,
  },

  // MENA + Central Asia
  'amman-jordan': {
    slug: 'amman-jordan',
    name: 'Amman',
    city: 'Amman',
    country: 'Jordan',
    title: 'Crypto Payments in Amman, Jordan | PortalPay',
    metaDescription:
      'QR receipts, instant settlement, and offline-first for cafés, repair hubs, and artisan vendors.',
    localContext:
      'Amman’s urban SMEs can use split payouts for attendants, QR receipts for transparency, and community radio for outreach.',
    popularIndustries: [
      'internet-cafes',
      'mobile-phone-repair',
      'artisan-potters',
      'community-radio-stations',
      'village-savings-groups',
    ],
    population: 1200000,
    businessCount: 160000,
  },

  'beirut-lebanon': {
    slug: 'beirut-lebanon',
    name: 'Beirut',
    city: 'Beirut',
    country: 'Lebanon',
    title: 'Crypto Payments in Beirut, Lebanon | PortalPay',
    metaDescription:
      'Low-fee QR payments and instant settlement for cafés, repair hubs, and artisan vendors.',
    localContext:
      'Beirut’s resilient SME network benefits from QR receipts, split payouts, and offline-first operations amid infrastructure variability.',
    popularIndustries: [
      'internet-cafes',
      'mobile-phone-repair',
      'artisan-potters',
      'community-radio-stations',
      'village-savings-groups',
    ],
    population: 1000000,
    businessCount: 150000,
  },

  'ramallah-palestine': {
    slug: 'ramallah-palestine',
    name: 'Ramallah',
    city: 'Ramallah',
    country: 'Palestine',
    title: 'Crypto Payments in Ramallah, Palestine | PortalPay',
    metaDescription:
      'Instant settlement and QR receipts for cafés, repair kiosks, and artisan vendors.',
    localContext:
      'Ramallah’s cafés and co-ops benefit from split payouts, QR receipts, and offline-first support.',
    popularIndustries: [
      'internet-cafes',
      'mobile-phone-repair',
      'artisan-potters',
      'community-radio-stations',
      'village-savings-groups',
    ],
    population: 40000,
    businessCount: 20000,
  },

  'casablanca-morocco': {
    slug: 'casablanca-morocco',
    name: 'Casablanca',
    city: 'Casablanca',
    country: 'Morocco',
    title: 'Crypto Payments in Casablanca, Morocco | PortalPay',
    metaDescription:
      'QR payments and instant settlement for cafés, repair hubs, and artisan markets.',
    localContext:
      'Casablanca’s urban SMEs leverage QR receipts, split payouts, and offline support for reliability.',
    popularIndustries: [
      'internet-cafes',
      'mobile-phone-repair',
      'artisan-potters',
      'community-radio-stations',
      'village-savings-groups',
    ],
    population: 3700000,
    businessCount: 300000,
  },

  'marrakesh-morocco': {
    slug: 'marrakesh-morocco',
    name: 'Marrakesh',
    city: 'Marrakesh',
    country: 'Morocco',
    title: 'Crypto Payments in Marrakesh, Morocco | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for artisan souks, cafés, and repair kiosks.',
    localContext:
      'Marrakesh’s renowned artisan markets benefit from QR receipts, transparent inventory tagging, and split payouts.',
    popularIndustries: [
      'artisan-potters',
      'internet-cafes',
      'mobile-phone-repair',
      'community-radio-stations',
      'village-savings-groups',
    ],
    population: 930000,
    businessCount: 120000,
  },

  'tunis-tunisia': {
    slug: 'tunis-tunisia',
    name: 'Tunis',
    city: 'Tunis',
    country: 'Tunisia',
    title: 'Crypto Payments in Tunis, Tunisia | PortalPay',
    metaDescription:
      'Instant settlement and offline-first QR payments for cafés, repair hubs, and artisan vendors.',
    localContext:
      'Tunis SMEs use split payouts, QR receipts, and offline-first operations for predictable settlement.',
    popularIndustries: [
      'internet-cafes',
      'mobile-phone-repair',
      'artisan-potters',
      'community-radio-stations',
      'village-savings-groups',
    ],
    population: 640000,
    businessCount: 90000,
  },

  'algiers-algeria': {
    slug: 'algiers-algeria',
    name: 'Algiers',
    city: 'Algiers',
    country: 'Algeria',
    title: 'Crypto Payments in Algiers, Algeria | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for cafés, repair hubs, and coastal services.',
    localContext:
      'Algiers’ coastal and urban SMEs benefit from ticketing, split payouts, and offline support.',
    popularIndustries: [
      'small-ferry-operators',
      'internet-cafes',
      'mobile-phone-repair',
      'community-radio-stations',
      'village-savings-groups',
    ],
    population: 3400000,
    businessCount: 220000,
  },

  'yerevan-armenia': {
    slug: 'yerevan-armenia',
    name: 'Yerevan',
    city: 'Yerevan',
    country: 'Armenia',
    title: 'Crypto Payments in Yerevan, Armenia | PortalPay',
    metaDescription:
      'Low-fee QR payments and instant settlement for cafés, repair hubs, and artisan vendors.',
    localContext:
      'Yerevan’s growing SME tech-and-craft blend aligns with QR receipts, split payouts, and offline-first by default.',
    popularIndustries: [
      'internet-cafes',
      'mobile-phone-repair',
      'artisan-potters',
      'community-radio-stations',
      'village-savings-groups',
    ],
    population: 1100000,
    businessCount: 140000,
  },

  'tashkent-uzbekistan': {
    slug: 'tashkent-uzbekistan',
    name: 'Tashkent',
    city: 'Tashkent',
    country: 'Uzbekistan',
    title: 'Crypto Payments in Tashkent, Uzbekistan | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for cafés, repair shops, and artisan vendors.',
    localContext:
      'Tashkent’s SME corridors benefit from transparent QR receipts, split payouts, and offline-first support.',
    popularIndustries: [
      'internet-cafes',
      'mobile-phone-repair',
      'artisan-potters',
      'community-radio-stations',
      'village-savings-groups',
    ],
    population: 2500000,
    businessCount: 200000,
  },

  'almaty-kazakhstan': {
    slug: 'almaty-kazakhstan',
    name: 'Almaty',
    city: 'Almaty',
    country: 'Kazakhstan',
    title: 'Crypto Payments in Almaty, Kazakhstan | PortalPay',
    metaDescription:
      'Instant settlement and offline-first QR payments for cafés, repair hubs, and artisan vendors.',
    localContext:
      'Almaty’s mix of tech and craft SMEs use split payouts, QR receipts, and inventory tagging.',
    popularIndustries: [
      'internet-cafes',
      'mobile-phone-repair',
      'artisan-potters',
      'community-radio-stations',
      'village-savings-groups',
    ],
    population: 2000000,
    businessCount: 170000,
  },

  // Global hubs + selected islands
  'istanbul-turkiye': {
    slug: 'istanbul-turkiye',
    name: 'Istanbul',
    city: 'Istanbul',
    country: 'Türkiye',
    title: 'Crypto Payments in Istanbul, Türkiye | PortalPay',
    metaDescription:
      'Scale QR receipts and instant settlement for ferries, repair hubs, cafés, and artisan vendors.',
    localContext:
      'Istanbul’s Bosphorus ferries, craft bazaars, and cafés use QR ticketing, split payouts, and offline-first support.',
    popularIndustries: [
      'small-ferry-operators',
      'mobile-phone-repair',
      'internet-cafes',
      'artisan-potters',
      'community-radio-stations',
    ],
    population: 15500000,
    businessCount: 900000,
  },

  'tbilisi-georgia': {
    slug: 'tbilisi-georgia',
    name: 'Tbilisi',
    city: 'Tbilisi',
    country: 'Georgia',
    title: 'Crypto Payments in Tbilisi, Georgia | PortalPay',
    metaDescription:
      'Instant settlement and QR receipts for cafés, repair hubs, and artisan vendors.',
    localContext:
      'Tbilisi’s SME economy benefits from split payouts, QR receipts, and offline-first operations.',
    popularIndustries: [
      'internet-cafes',
      'mobile-phone-repair',
      'artisan-potters',
      'community-radio-stations',
      'village-savings-groups',
    ],
    population: 1200000,
    businessCount: 100000,
  },

  'kyiv-ukraine': {
    slug: 'kyiv-ukraine',
    name: 'Kyiv',
    city: 'Kyiv',
    country: 'Ukraine',
    title: 'Crypto Payments in Kyiv, Ukraine | PortalPay',
    metaDescription:
      'QR receipts, instant settlement, and offline-first support for cafés, repair hubs, and artisan vendors.',
    localContext:
      'Kyiv’s resilient SMEs leverage split payouts, QR receipts, and transparent inventory workflows.',
    popularIndustries: [
      'internet-cafes',
      'mobile-phone-repair',
      'artisan-potters',
      'community-radio-stations',
      'village-savings-groups',
    ],
    population: 2900000,
    businessCount: 300000,
  },

  'belgrade-serbia': {
    slug: 'belgrade-serbia',
    name: 'Belgrade',
    city: 'Belgrade',
    country: 'Serbia',
    title: 'Crypto Payments in Belgrade, Serbia | PortalPay',
    metaDescription:
      'Instant settlement and QR payments for cafés, repair hubs, and artisan markets.',
    localContext:
      'Belgrade’s cafés and craft vendors gain transparency through QR receipts, split payouts, and offline-first operations.',
    popularIndustries: [
      'internet-cafes',
      'mobile-phone-repair',
      'artisan-potters',
      'community-radio-stations',
      'village-savings-groups',
    ],
    population: 1200000,
    businessCount: 140000,
  },

  'tirana-albania': {
    slug: 'tirana-albania',
    name: 'Tirana',
    city: 'Tirana',
    country: 'Albania',
    title: 'Crypto Payments in Tirana, Albania | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for cafés, repair kiosks, and artisan vendors.',
    localContext:
      'Tirana’s growing SME base uses split payouts, QR receipts, and offline-first for reliability.',
    popularIndustries: [
      'internet-cafes',
      'mobile-phone-repair',
      'artisan-potters',
      'community-radio-stations',
      'village-savings-groups',
    ],
    population: 500000,
    businessCount: 70000,
  },

  'port-of-spain-trinidad': {
    slug: 'port-of-spain-trinidad',
    name: 'Port of Spain',
    city: 'Port of Spain',
    country: 'Trinidad and Tobago',
    title: 'Crypto Payments in Port of Spain, Trinidad | PortalPay',
    metaDescription:
      'Instant settlement and QR ticketing for coastal services, cafés, and repair hubs.',
    localContext:
      'Island SMEs benefit from QR tickets, split payouts for crews, and offline-first operations.',
    popularIndustries: [
      'small-ferry-operators',
      'internet-cafes',
      'mobile-phone-repair',
      'community-radio-stations',
      'village-savings-groups',
    ],
    population: 37000,
    businessCount: 10000,
  },

  'kingston-jamaica': {
    slug: 'kingston-jamaica',
    name: 'Kingston',
    city: 'Kingston',
    country: 'Jamaica',
    title: 'Crypto Payments in Kingston, Jamaica | PortalPay',
    metaDescription:
      'Adopt QR receipts and instant settlement for coastal ferries, cafés, and repair shops.',
    localContext:
      'Kingston’s coastal and urban SMEs use QR ticketing, split payouts, and offline-first support.',
    popularIndustries: [
      'small-ferry-operators',
      'mobile-phone-repair',
      'internet-cafes',
      'community-radio-stations',
      'village-savings-groups',
    ],
    population: 660000,
    businessCount: 90000,
  },
  'johannesburg-south-africa': {
    slug: 'johannesburg-south-africa',
    name: 'Johannesburg',
    city: 'Johannesburg',
    country: 'South Africa',
    title: 'Crypto Payments in Johannesburg, South Africa | PortalPay',
    metaDescription:
      'Low-fee QR payments for markets, cafés, and repair hubs in Johannesburg. Instant settlement and offline-first support.',
    localContext:
      'Township markets and service corridors benefit from QR receipts, split payouts for attendants, and transparent inventory tagging.',
    popularIndustries: [
      'street-food-vendors',
      'internet-cafes',
      'mobile-phone-repair',
      'hardware-shops',
      'community-radio-stations',
    ],
    population: 5700000,
    businessCount: 700000,
  },

  'cape-town-south-africa': {
    slug: 'cape-town-south-africa',
    name: 'Cape Town',
    city: 'Cape Town',
    country: 'South Africa',
    title: 'Crypto Payments in Cape Town, South Africa | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for cafés, ferries, and artisan vendors across Cape Town.',
    localContext:
      'Tourism corridors and waterfront services use QR ticketing, split payouts, and offline-first operations.',
    popularIndustries: [
      'cafes',
      'small-ferry-operators',
      'artisan-potters',
      'internet-cafes',
      'mobile-phone-repair',
    ],
    population: 4600000,
    businessCount: 350000,
  },

  'durban-south-africa': {
    slug: 'durban-south-africa',
    name: 'Durban',
    city: 'Durban',
    country: 'South Africa',
    title: 'Crypto Payments in Durban, South Africa | PortalPay',
    metaDescription:
      'Instant-settlement QR payments for coastal services, markets, and repair hubs in Durban.',
    localContext:
      'Port-adjacent SMEs leverage QR tickets, attendant splits, and transparent receipts for daily settlement.',
    popularIndustries: [
      'small-ferry-operators',
      'street-food-vendors',
      'mobile-phone-repair',
      'internet-cafes',
      'village-savings-groups',
    ],
    population: 3700000,
    businessCount: 280000,
  },

  'alexandria-egypt': {
    slug: 'alexandria-egypt',
    name: 'Alexandria',
    city: 'Alexandria',
    country: 'Egypt',
    title: 'Crypto Payments in Alexandria, Egypt | PortalPay',
    metaDescription:
      'Bring instant, low-fee QR payments to Alexandria’s cafés, ferries, and repair kiosks.',
    localContext:
      'Coastal routes and dense markets benefit from QR ticketing, inventory tagging, and split payouts.',
    popularIndustries: [
      'small-ferry-operators',
      'internet-cafes',
      'mobile-phone-repair',
      'community-radio-stations',
      'artisan-potters',
    ],
    population: 5200000,
    businessCount: 300000,
  },

  'rabat-morocco': {
    slug: 'rabat-morocco',
    name: 'Rabat',
    city: 'Rabat',
    country: 'Morocco',
    title: 'Crypto Payments in Rabat, Morocco | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for cafés, artisan souks, and repair hubs in Rabat.',
    localContext:
      'Government and academic districts spawn SMEs that benefit from split payouts and transparent QR receipts.',
    popularIndustries: [
      'cafes',
      'artisan-potters',
      'internet-cafes',
      'mobile-phone-repair',
      'village-savings-groups',
    ],
    population: 580000,
    businessCount: 90000,
  },

  'fes-morocco': {
    slug: 'fes-morocco',
    name: 'Fes',
    city: 'Fes',
    country: 'Morocco',
    title: 'Crypto Payments in Fes, Morocco | PortalPay',
    metaDescription:
      'Modern QR payments for historic artisan quarters, cafés, and repair shops in Fes.',
    localContext:
      'Souk artisans and cafés use QR receipts, inventory tagging, and instant settlement for co-ops.',
    popularIndustries: [
      'artisan-potters',
      'internet-cafes',
      'cafes',
      'mobile-phone-repair',
      'community-radio-stations',
    ],
    population: 1200000,
    businessCount: 150000,
  },

  'mombasa-kenya': {
    slug: 'mombasa-kenya',
    name: 'Mombasa',
    city: 'Mombasa',
    country: 'Kenya',
    title: 'Crypto Payments in Mombasa, Kenya | PortalPay',
    metaDescription:
      'QR ticketing and instant settlement for coastal ferries, markets, and repair hubs.',
    localContext:
      'Harbor services and tourist corridors leverage QR tickets, split payouts, and offline support.',
    popularIndustries: [
      'small-ferry-operators',
      'street-food-vendors',
      'mobile-phone-repair',
      'internet-cafes',
      'community-radio-stations',
    ],
    population: 1200000,
    businessCount: 110000,
  },

  'kisumu-kenya': {
    slug: 'kisumu-kenya',
    name: 'Kisumu',
    city: 'Kisumu',
    country: 'Kenya',
    title: 'Crypto Payments in Kisumu, Kenya | PortalPay',
    metaDescription:
      'Instant-settlement QR payments for lakeside transport, cafés, and repair kiosks.',
    localContext:
      'Lake Victoria services and markets benefit from QR tickets, receipts, and split payouts.',
    popularIndustries: [
      'small-ferry-operators',
      'internet-cafes',
      'mobile-phone-repair',
      'village-savings-groups',
      'artisan-potters',
    ],
    population: 610000,
    businessCount: 70000,
  },

  'stone-town-tanzania': {
    slug: 'stone-town-tanzania',
    name: 'Stone Town',
    city: 'Stone Town',
    country: 'Tanzania',
    title: 'Crypto Payments in Stone Town, Tanzania | PortalPay',
    metaDescription:
      'QR ticketing for boats, instant settlement for cafés and craft vendors in Zanzibar’s Stone Town.',
    localContext:
      'Tourism routes rely on QR tickets, transparent receipts, and split payouts for guides and crews.',
    popularIndustries: [
      'small-ferry-operators',
      'cafes',
      'artisan-potters',
      'mobile-phone-repair',
      'internet-cafes',
    ],
    population: 160000,
    businessCount: 25000,
  },

  'kumasi-ghana': {
    slug: 'kumasi-ghana',
    name: 'Kumasi',
    city: 'Kumasi',
    country: 'Ghana',
    title: 'Crypto Payments in Kumasi, Ghana | PortalPay',
    metaDescription:
      'QR receipts and split payouts for Kejetia market vendors, cafés, and repair hubs.',
    localContext:
      'Large open-air markets benefit from instant settlement, QR receipts, and simple co-op flows.',
    popularIndustries: [
      'market-stall-vendors',
      'internet-cafes',
      'mobile-phone-repair',
      'community-radio-stations',
      'village-savings-groups',
    ],
    population: 3200000,
    businessCount: 210000,
  },

  'abuja-nigeria': {
    slug: 'abuja-nigeria',
    name: 'Abuja',
    city: 'Abuja',
    country: 'Nigeria',
    title: 'Crypto Payments in Abuja, Nigeria | PortalPay',
    metaDescription:
      'Low-fee QR payments with instant settlement for cafés, repair hubs, and training labs.',
    localContext:
      'Administrative districts and SME services adopt QR receipts, split payouts, and offline-first mode.',
    popularIndustries: [
      'internet-cafes',
      'mobile-phone-repair',
      'cafes',
      'community-radio-stations',
      'village-savings-groups',
    ],
    population: 3600000,
    businessCount: 260000,
  },

  'kano-nigeria': {
    slug: 'kano-nigeria',
    name: 'Kano',
    city: 'Kano',
    country: 'Nigeria',
    title: 'Crypto Payments in Kano, Nigeria | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for market vendors, cafés, and repair kiosks.',
    localContext:
      'Ancient trade markets modernize revenue with QR receipts, inventory tags, and attendant splits.',
    popularIndustries: [
      'market-stall-vendors',
      'street-food-vendors',
      'mobile-phone-repair',
      'internet-cafes',
      'community-radio-stations',
    ],
    population: 4200000,
    businessCount: 300000,
  },

  'port-harcourt-nigeria': {
    slug: 'port-harcourt-nigeria',
    name: 'Port Harcourt',
    city: 'Port Harcourt',
    country: 'Nigeria',
    title: 'Crypto Payments in Port Harcourt, Nigeria | PortalPay',
    metaDescription:
      'Instant-settlement QR payments for ferries, markets, and cafés in Port Harcourt.',
    localContext:
      'Delta transport and urban SMEs benefit from QR ticketing, split payouts, and offline operations.',
    popularIndustries: [
      'small-ferry-operators',
      'street-food-vendors',
      'mobile-phone-repair',
      'internet-cafes',
      'village-savings-groups',
    ],
    population: 1900000,
    businessCount: 150000,
  },

  'kinshasa-dr-congo': {
    slug: 'kinshasa-dr-congo',
    name: 'Kinshasa',
    city: 'Kinshasa',
    country: 'DR Congo',
    title: 'Crypto Payments in Kinshasa, DR Congo | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for river transport, cafés, and repair hubs.',
    localContext:
      'Congo River services and city markets use QR ticketing, split payouts, and offline-first receipts.',
    popularIndustries: [
      'small-ferry-operators',
      'internet-cafes',
      'mobile-phone-repair',
      'market-stall-vendors',
      'community-radio-stations',
    ],
    population: 15000000,
    businessCount: 600000,
  },

  'douala-cameroon': {
    slug: 'douala-cameroon',
    name: 'Douala',
    city: 'Douala',
    country: 'Cameroon',
    title: 'Crypto Payments in Douala, Cameroon | PortalPay',
    metaDescription:
      'Low-fee QR payments and instant settlement for ports, cafés, and repair hubs in Douala.',
    localContext:
      'Port-adjacent SMEs leverage QR tickets, split payouts, and transparent receipts for daily close.',
    popularIndustries: [
      'small-ferry-operators',
      'mobile-phone-repair',
      'internet-cafes',
      'street-food-vendors',
      'village-savings-groups',
    ],
    population: 3600000,
    businessCount: 240000,
  },

  'windhoek-namibia': {
    slug: 'windhoek-namibia',
    name: 'Windhoek',
    city: 'Windhoek',
    country: 'Namibia',
    title: 'Crypto Payments in Windhoek, Namibia | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for cafés, repair hubs, and community groups.',
    localContext:
      'Windhoek SMEs adopt split payouts, QR receipts, and offline-first reliability for daily operations.',
    popularIndustries: [
      'internet-cafes',
      'mobile-phone-repair',
      'cafes',
      'community-radio-stations',
      'village-savings-groups',
    ],
    population: 430000,
    businessCount: 60000,
  },

  'antananarivo-madagascar': {
    slug: 'antananarivo-madagascar',
    name: 'Antananarivo',
    city: 'Antananarivo',
    country: 'Madagascar',
    title: 'Crypto Payments in Antananarivo, Madagascar | PortalPay',
    metaDescription:
      'Instant-settlement QR payments for craft markets, cafés, and repair kiosks.',
    localContext:
      'Artisan corridors and cafés benefit from QR receipts, inventory tagging, and split payouts.',
    popularIndustries: [
      'artisan-potters',
      'internet-cafes',
      'mobile-phone-repair',
      'street-food-vendors',
      'village-savings-groups',
    ],
    population: 1400000,
    businessCount: 120000,
  },

  'bangalore-india': {
    slug: 'bangalore-india',
    name: 'Bangalore',
    city: 'Bangalore',
    country: 'India',
    title: 'Crypto Payments in Bangalore, India | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for cafés, repair kiosks, and co-ops in Bangalore.',
    localContext:
      'Tech corridors and markets adopt split payouts, QR receipts, and offline-first sales.',
    popularIndustries: [
      'internet-cafes',
      'mobile-phone-repair',
      'cafes',
      'village-savings-groups',
      'community-radio-stations',
    ],
    population: 11000000,
    businessCount: 650000,
  },

  'hyderabad-india': {
    slug: 'hyderabad-india',
    name: 'Hyderabad',
    city: 'Hyderabad',
    country: 'India',
    title: 'Crypto Payments in Hyderabad, India | PortalPay',
    metaDescription:
      'Instant-settlement QR payments for cafés, repair hubs, and market vendors.',
    localContext:
      'Hyderabad SMEs leverage split payouts, QR receipts, and inventory tagging for transparency.',
    popularIndustries: [
      'mobile-phone-repair',
      'internet-cafes',
      'street-food-vendors',
      'hardware-shops',
      'community-radio-stations',
    ],
    population: 10000000,
    businessCount: 600000,
  },

  'chennai-india': {
    slug: 'chennai-india',
    name: 'Chennai',
    city: 'Chennai',
    country: 'India',
    title: 'Crypto Payments in Chennai, India | PortalPay',
    metaDescription:
      'QR payments and offline-first support for coastal ferries, cafés, and repair kiosks.',
    localContext:
      'Maritime services and bazaars benefit from QR ticketing, split payouts, and instant settlement.',
    popularIndustries: [
      'small-ferry-operators',
      'internet-cafes',
      'mobile-phone-repair',
      'cafes',
      'village-savings-groups',
    ],
    population: 11000000,
    businessCount: 500000,
  },

  'kolkata-india': {
    slug: 'kolkata-india',
    name: 'Kolkata',
    city: 'Kolkata',
    country: 'India',
    title: 'Crypto Payments in Kolkata, India | PortalPay',
    metaDescription:
      'Instant-settlement QR receipts for markets, cafés, and repair hubs.',
    localContext:
      'Historic markets use QR receipts, inventory tagging, and attendant splits for daily close.',
    popularIndustries: [
      'market-stall-vendors',
      'mobile-phone-repair',
      'internet-cafes',
      'street-food-vendors',
      'community-radio-stations',
    ],
    population: 14800000,
    businessCount: 700000,
  },

  'islamabad-pakistan': {
    slug: 'islamabad-pakistan',
    name: 'Islamabad',
    city: 'Islamabad',
    country: 'Pakistan',
    title: 'Crypto Payments in Islamabad, Pakistan | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for cafés, repair kiosks, and artisan vendors.',
    localContext:
      'Administrative and student districts adopt QR receipts, split payouts, and offline-first reliability.',
    popularIndustries: [
      'internet-cafes',
      'mobile-phone-repair',
      'cafes',
      'artisan-potters',
      'village-savings-groups',
    ],
    population: 1200000,
    businessCount: 150000,
  },

  'chittagong-bangladesh': {
    slug: 'chittagong-bangladesh',
    name: 'Chittagong',
    city: 'Chittagong',
    country: 'Bangladesh',
    title: 'Crypto Payments in Chittagong, Bangladesh | PortalPay',
    metaDescription:
      'Instant-settlement QR payments for port services, cafés, and repair hubs.',
    localContext:
      'Port-adjacent SMEs use QR tickets, split payouts, and transparent receipts for crews.',
    popularIndustries: [
      'small-ferry-operators',
      'mobile-phone-repair',
      'internet-cafes',
      'street-food-vendors',
      'village-savings-groups',
    ],
    population: 2800000,
    businessCount: 180000,
  },

  'bangkok-thailand': {
    slug: 'bangkok-thailand',
    name: 'Bangkok',
    city: 'Bangkok',
    country: 'Thailand',
    title: 'Crypto Payments in Bangkok, Thailand | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for cafés, markets, and repair kiosks in Bangkok.',
    localContext:
      'Night markets and commuter corridors benefit from QR receipts, split payouts, and offline-first.',
    popularIndustries: [
      'street-food-vendors',
      'internet-cafes',
      'mobile-phone-repair',
      'cafes',
      'community-radio-stations',
    ],
    population: 10500000,
    businessCount: 700000,
  },

  'chiang-mai-thailand': {
    slug: 'chiang-mai-thailand',
    name: 'Chiang Mai',
    city: 'Chiang Mai',
    country: 'Thailand',
    title: 'Crypto Payments in Chiang Mai, Thailand | PortalPay',
    metaDescription:
      'Instant-settlement QR payments for artisan markets, cafés, and repair hubs.',
    localContext:
      'Craft districts and cafés leverage QR receipts, inventory tagging, and split payouts.',
    popularIndustries: [
      'artisan-potters',
      'cafes',
      'internet-cafes',
      'mobile-phone-repair',
      'village-savings-groups',
    ],
    population: 1300000,
    businessCount: 120000,
  },

  'kuala-lumpur-malaysia': {
    slug: 'kuala-lumpur-malaysia',
    name: 'Kuala Lumpur',
    city: 'Kuala Lumpur',
    country: 'Malaysia',
    title: 'Crypto Payments in Kuala Lumpur, Malaysia | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for cafés, markets, and repair hubs.',
    localContext:
      'Urban SMEs adopt split payouts, QR receipts, and offline-first for predictable cash flow.',
    popularIndustries: [
      'internet-cafes',
      'mobile-phone-repair',
      'cafes',
      'street-food-vendors',
      'community-radio-stations',
    ],
    population: 7900000,
    businessCount: 500000,
  },

  'penang-malaysia': {
    slug: 'penang-malaysia',
    name: 'Penang',
    city: 'Penang',
    country: 'Malaysia',
    title: 'Crypto Payments in Penang, Malaysia | PortalPay',
    metaDescription:
      'Instant-settlement QR payments for hawker stalls, cafés, and repair kiosks.',
    localContext:
      'Hawker culture aligns with QR receipts, inventory tags, and split payouts for attendants.',
    popularIndustries: [
      'street-food-vendors',
      'internet-cafes',
      'mobile-phone-repair',
      'cafes',
      'village-savings-groups',
    ],
    population: 1800000,
    businessCount: 140000,
  },

  'cebu-city-philippines': {
    slug: 'cebu-city-philippines',
    name: 'Cebu City',
    city: 'Cebu City',
    country: 'Philippines',
    title: 'Crypto Payments in Cebu City, Philippines | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for ferry routes, cafés, and repair kiosks.',
    localContext:
      'Island ferries and urban markets benefit from QR ticketing, split payouts, and offline-first.',
    popularIndustries: [
      'small-ferry-operators',
      'internet-cafes',
      'mobile-phone-repair',
      'sari-sari-stores',
      'community-radio-stations',
    ],
    population: 1000000,
    businessCount: 90000,
  },

  'denpasar-bali-indonesia': {
    slug: 'denpasar-bali-indonesia',
    name: 'Denpasar (Bali)',
    city: 'Denpasar',
    country: 'Indonesia',
    title: 'Crypto Payments in Denpasar (Bali), Indonesia | PortalPay',
    metaDescription:
      'Instant-settlement QR payments for tourism, artisan vendors, and cafés in Bali.',
    localContext:
      'Tourism SMEs use QR receipts, inventory tags, and split payouts for guides and attendants.',
    popularIndustries: [
      'artisan-potters',
      'cafes',
      'internet-cafes',
      'mobile-phone-repair',
      'small-ferry-operators',
    ],
    population: 930000,
    businessCount: 120000,
  },

  'bandung-indonesia': {
    slug: 'bandung-indonesia',
    name: 'Bandung',
    city: 'Bandung',
    country: 'Indonesia',
    title: 'Crypto Payments in Bandung, Indonesia | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for cafés, repair hubs, and craft markets.',
    localContext:
      'Student and craft districts adopt split payouts, QR receipts, and offline-first flows.',
    popularIndustries: [
      'internet-cafes',
      'mobile-phone-repair',
      'artisan-potters',
      'cafes',
      'village-savings-groups',
    ],
    population: 2500000,
    businessCount: 190000,
  },

  'da-nang-vietnam': {
    slug: 'da-nang-vietnam',
    name: 'Da Nang',
    city: 'Da Nang',
    country: 'Vietnam',
    title: 'Crypto Payments in Da Nang, Vietnam | PortalPay',
    metaDescription:
      'Instant-settlement QR payments for cafés, ferries, and repair hubs.',
    localContext:
      'Coastal services and cafés leverage QR ticketing, split payouts, and offline receipts.',
    popularIndustries: [
      'small-ferry-operators',
      'internet-cafes',
      'mobile-phone-repair',
      'cafes',
      'artisan-potters',
    ],
    population: 1200000,
    businessCount: 110000,
  },

  'montevideo-uruguay': {
    slug: 'montevideo-uruguay',
    name: 'Montevideo',
    city: 'Montevideo',
    country: 'Uruguay',
    title: 'Crypto Payments in Montevideo, Uruguay | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for cafés, artisan vendors, and repair kiosks.',
    localContext:
      'Montevideo SMEs adopt split payouts, QR receipts, and offline-first operations.',
    popularIndustries: [
      'cafes',
      'internet-cafes',
      'mobile-phone-repair',
      'artisan-potters',
      'village-savings-groups',
    ],
    population: 1700000,
    businessCount: 200000,
  },

  'asuncion-paraguay': {
    slug: 'asuncion-paraguay',
    name: 'Asunción',
    city: 'Asunción',
    country: 'Paraguay',
    title: 'Crypto Payments in Asunción, Paraguay | PortalPay',
    metaDescription:
      'Instant-settlement QR payments for markets, cafés, and repair hubs.',
    localContext:
      'Market vendors and cafés use QR receipts, inventory tags, and split payouts.',
    popularIndustries: [
      'market-stall-vendors',
      'internet-cafes',
      'mobile-phone-repair',
      'cafes',
      'community-radio-stations',
    ],
    population: 530000,
    businessCount: 80000,
  },

  'valparaiso-chile': {
    slug: 'valparaiso-chile',
    name: 'Valparaíso',
    city: 'Valparaíso',
    country: 'Chile',
    title: 'Crypto Payments in Valparaíso, Chile | PortalPay',
    metaDescription:
      'QR ticketing and instant settlement for coastal services, cafés, and artisan vendors.',
    localContext:
      'Port and tourism SMEs leverage QR tickets, split payouts, and offline-first receipts.',
    popularIndustries: [
      'small-ferry-operators',
      'cafes',
      'internet-cafes',
      'artisan-potters',
      'mobile-phone-repair',
    ],
    population: 1000000,
    businessCount: 100000,
  },

  'cordoba-argentina': {
    slug: 'cordoba-argentina',
    name: 'Córdoba',
    city: 'Córdoba',
    country: 'Argentina',
    title: 'Crypto Payments in Córdoba, Argentina | PortalPay',
    metaDescription:
      'Instant-settlement QR payments for cafés, markets, and repair kiosks.',
    localContext:
      'Student districts and markets adopt QR receipts, split payouts, and offline-first support.',
    popularIndustries: [
      'internet-cafes',
      'mobile-phone-repair',
      'cafes',
      'artisan-potters',
      'village-savings-groups',
    ],
    population: 1400000,
    businessCount: 160000,
  },

  'rosario-argentina': {
    slug: 'rosario-argentina',
    name: 'Rosario',
    city: 'Rosario',
    country: 'Argentina',
    title: 'Crypto Payments in Rosario, Argentina | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for cafés, repair hubs, and craft vendors.',
    localContext:
      'Rosario SMEs benefit from split payouts, QR receipts, and transparent inventory tagging.',
    popularIndustries: [
      'cafes',
      'internet-cafes',
      'mobile-phone-repair',
      'artisan-potters',
      'community-radio-stations',
    ],
    population: 1300000,
    businessCount: 140000,
  },

  'fortaleza-brazil': {
    slug: 'fortaleza-brazil',
    name: 'Fortaleza',
    city: 'Fortaleza',
    country: 'Brazil',
    title: 'Crypto Payments in Fortaleza, Brazil | PortalPay',
    metaDescription:
      'Instant-settlement QR payments for coastal services, cafés, and repair hubs.',
    localContext:
      'Beachfront SMEs adopt QR tickets, split payouts, and offline-first receipts.',
    popularIndustries: [
      'small-ferry-operators',
      'street-food-vendors',
      'internet-cafes',
      'mobile-phone-repair',
      'cafes',
    ],
    population: 2700000,
    businessCount: 220000,
  },

  'recife-brazil': {
    slug: 'recife-brazil',
    name: 'Recife',
    city: 'Recife',
    country: 'Brazil',
    title: 'Crypto Payments in Recife, Brazil | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for markets, cafés, and repair kiosks.',
    localContext:
      'Port and market SMEs use QR receipts, inventory tagging, and split payouts.',
    popularIndustries: [
      'market-stall-vendors',
      'internet-cafes',
      'mobile-phone-repair',
      'street-food-vendors',
      'community-radio-stations',
    ],
    population: 1600000,
    businessCount: 150000,
  },

  'belo-horizonte-brazil': {
    slug: 'belo-horizonte-brazil',
    name: 'Belo Horizonte',
    city: 'Belo Horizonte',
    country: 'Brazil',
    title: 'Crypto Payments in Belo Horizonte, Brazil | PortalPay',
    metaDescription:
      'Instant-settlement QR payments for cafés, repair hubs, and artisan vendors.',
    localContext:
      'Urban SMEs adopt split payouts, QR receipts, and offline-first operations.',
    popularIndustries: [
      'cafes',
      'internet-cafes',
      'mobile-phone-repair',
      'artisan-potters',
      'village-savings-groups',
    ],
    population: 5100000,
    businessCount: 400000,
  },

  'brasilia-brazil': {
    slug: 'brasilia-brazil',
    name: 'Brasília',
    city: 'Brasília',
    country: 'Brazil',
    title: 'Crypto Payments in Brasília, Brazil | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for cafés, markets, and repair kiosks.',
    localContext:
      'Administrative districts and markets adopt split payouts and offline-first receipts.',
    popularIndustries: [
      'internet-cafes',
      'mobile-phone-repair',
      'cafes',
      'street-food-vendors',
      'community-radio-stations',
    ],
    population: 4200000,
    businessCount: 300000,
  },

  'manaus-brazil': {
    slug: 'manaus-brazil',
    name: 'Manaus',
    city: 'Manaus',
    country: 'Brazil',
    title: 'Crypto Payments in Manaus, Brazil | PortalPay',
    metaDescription:
      'QR ticketing and instant settlement for river transport, cafés, and repair hubs.',
    localContext:
      'Amazon waterways SMEs use QR tickets, split payouts, and offline-first support.',
    popularIndustries: [
      'small-ferry-operators',
      'internet-cafes',
      'mobile-phone-repair',
      'street-food-vendors',
      'village-savings-groups',
    ],
    population: 2200000,
    businessCount: 160000,
  },

  'curitiba-brazil': {
    slug: 'curitiba-brazil',
    name: 'Curitiba',
    city: 'Curitiba',
    country: 'Brazil',
    title: 'Crypto Payments in Curitiba, Brazil | PortalPay',
    metaDescription:
      'Instant-settlement QR payments for cafés, markets, and repair kiosks.',
    localContext:
      'Curitiba SMEs leverage QR receipts, inventory tags, and split payouts.',
    popularIndustries: [
      'cafes',
      'internet-cafes',
      'mobile-phone-repair',
      'street-food-vendors',
      'community-radio-stations',
    ],
    population: 1900000,
    businessCount: 170000,
  },

  'barranquilla-colombia': {
    slug: 'barranquilla-colombia',
    name: 'Barranquilla',
    city: 'Barranquilla',
    country: 'Colombia',
    title: 'Crypto Payments in Barranquilla, Colombia | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for coastal services, cafés, and repair hubs.',
    localContext:
      'Coastal SMEs adopt QR ticketing, split payouts, and offline-first receipts.',
    popularIndustries: [
      'small-ferry-operators',
      'internet-cafes',
      'mobile-phone-repair',
      'cafes',
      'artisan-potters',
    ],
    population: 1200000,
    businessCount: 110000,
  },

  'cartagena-colombia': {
    slug: 'cartagena-colombia',
    name: 'Cartagena',
    city: 'Cartagena',
    country: 'Colombia',
    title: 'Crypto Payments in Cartagena, Colombia | PortalPay',
    metaDescription:
      'Instant-settlement QR payments for tourism, artisan vendors, and cafés in Cartagena.',
    localContext:
      'Tourism corridors use QR receipts, inventory tagging, and split payouts for guides and vendors.',
    popularIndustries: [
      'artisan-potters',
      'cafes',
      'internet-cafes',
      'mobile-phone-repair',
      'small-ferry-operators',
    ],
    population: 1000000,
    businessCount: 100000,
  },

  'dubai-uae': {
    slug: 'dubai-uae',
    name: 'Dubai',
    city: 'Dubai',
    country: 'United Arab Emirates',
    title: 'Crypto Payments in Dubai, UAE | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for cafés, markets, and repair hubs in Dubai.',
    localContext:
      'Retail corridors and tourism services leverage split payouts, QR receipts, and offline-first reliability.',
    popularIndustries: [
      'cafes',
      'internet-cafes',
      'mobile-phone-repair',
      'street-food-vendors',
      'community-radio-stations',
    ],
    population: 3500000,
    businessCount: 700000,
  },

  'abu-dhabi-uae': {
    slug: 'abu-dhabi-uae',
    name: 'Abu Dhabi',
    city: 'Abu Dhabi',
    country: 'United Arab Emirates',
    title: 'Crypto Payments in Abu Dhabi, UAE | PortalPay',
    metaDescription:
      'Instant-settlement QR payments for cafés, artisan vendors, and repair kiosks.',
    localContext:
      'Administrative and retail districts adopt QR receipts, inventory tags, and split payouts.',
    popularIndustries: [
      'cafes',
      'internet-cafes',
      'mobile-phone-repair',
      'artisan-potters',
      'village-savings-groups',
    ],
    population: 1500000,
    businessCount: 250000,
  },

  'doha-qatar': {
    slug: 'doha-qatar',
    name: 'Doha',
    city: 'Doha',
    country: 'Qatar',
    title: 'Crypto Payments in Doha, Qatar | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for cafés, markets, and repair hubs.',
    localContext:
      'Souq and waterfront SMEs leverage split payouts, QR receipts, and offline-first operations.',
    popularIndustries: [
      'cafes',
      'internet-cafes',
      'mobile-phone-repair',
      'street-food-vendors',
      'community-radio-stations',
    ],
    population: 2400000,
    businessCount: 300000,
  },

  'muscat-oman': {
    slug: 'muscat-oman',
    name: 'Muscat',
    city: 'Muscat',
    country: 'Oman',
    title: 'Crypto Payments in Muscat, Oman | PortalPay',
    metaDescription:
      'Instant-settlement QR payments for coastal services, cafés, and repair kiosks.',
    localContext:
      'Coastal SMEs adopt QR ticketing, split payouts, and offline-first receipts.',
    popularIndustries: [
      'small-ferry-operators',
      'cafes',
      'internet-cafes',
      'mobile-phone-repair',
      'artisan-potters',
    ],
    population: 1500000,
    businessCount: 180000,
  },

  'baku-azerbaijan': {
    slug: 'baku-azerbaijan',
    name: 'Baku',
    city: 'Baku',
    country: 'Azerbaijan',
    title: 'Crypto Payments in Baku, Azerbaijan | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for cafés, markets, and repair hubs.',
    localContext:
      'Caspian coastal SMEs use split payouts, QR receipts, and offline-first operations.',
    popularIndustries: [
      'cafes',
      'internet-cafes',
      'mobile-phone-repair',
      'street-food-vendors',
      'community-radio-stations',
    ],
    population: 2300000,
    businessCount: 200000,
  },

  'bishkek-kyrgyzstan': {
    slug: 'bishkek-kyrgyzstan',
    name: 'Bishkek',
    city: 'Bishkek',
    country: 'Kyrgyzstan',
    title: 'Crypto Payments in Bishkek, Kyrgyzstan | PortalPay',
    metaDescription:
      'Instant-settlement QR payments for markets, cafés, and repair kiosks.',
    localContext:
      'Bazaars and cafés adopt QR receipts, inventory tagging, and split payouts.',
    popularIndustries: [
      'market-stall-vendors',
      'internet-cafes',
      'mobile-phone-repair',
      'cafes',
      'village-savings-groups',
    ],
    population: 1100000,
    businessCount: 90000,
  },

  'dushanbe-tajikistan': {
    slug: 'dushanbe-tajikistan',
    name: 'Dushanbe',
    city: 'Dushanbe',
    country: 'Tajikistan',
    title: 'Crypto Payments in Dushanbe, Tajikistan | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for cafés, markets, and repair hubs.',
    localContext:
      'Dushanbe SMEs leverage split payouts, QR receipts, and offline-first operations.',
    popularIndustries: [
      'cafes',
      'internet-cafes',
      'mobile-phone-repair',
      'street-food-vendors',
      'community-radio-stations',
    ],
    population: 900000,
    businessCount: 80000,
  },

  'panama-city-panama': {
    slug: 'panama-city-panama',
    name: 'Panama City',
    city: 'Panama City',
    country: 'Panama',
    title: 'Crypto Payments in Panama City, Panama | PortalPay',
    metaDescription:
      'Instant-settlement QR payments for markets, cafés, and repair kiosks.',
    localContext:
      'Logistics-adjacent SMEs adopt QR receipts, split payouts, and offline-first support.',
    popularIndustries: [
      'market-stall-vendors',
      'internet-cafes',
      'mobile-phone-repair',
      'cafes',
      'artisan-potters',
    ],
    population: 1600000,
    businessCount: 180000,
  },
  'guatemala-city-guatemala': {
    slug: 'guatemala-city-guatemala',
    name: 'Guatemala City',
    city: 'Guatemala City',
    country: 'Guatemala',
    title: 'Crypto Payments in Guatemala City, Guatemala | PortalPay',
    metaDescription:
      'Instant-settlement QR payments for markets, cafés, and repair hubs in Guatemala City.',
    localContext:
      'Historic markets and urban SMEs adopt QR receipts, split payouts, and offline-first operations.',
    popularIndustries: [
      'market-stall-vendors',
      'street-food-vendors',
      'internet-cafes',
      'mobile-phone-repair',
      'community-radio-stations',
    ],
    population: 3000000,
    businessCount: 220000,
  },

  'san-salvador-el-salvador': {
    slug: 'san-salvador-el-salvador',
    name: 'San Salvador',
    city: 'San Salvador',
    country: 'El Salvador',
    title: 'Crypto Payments in San Salvador, El Salvador | PortalPay',
    metaDescription:
      'Low-fee QR payments for markets, cafés, and repair kiosks in San Salvador.',
    localContext:
      'Street vendors and retail corridors benefit from QR receipts, inventory tagging, and split payouts.',
    popularIndustries: [
      'street-food-vendors',
      'market-stall-vendors',
      'mobile-phone-repair',
      'internet-cafes',
      'community-radio-stations',
    ],
    population: 1200000,
    businessCount: 90000,
  },

  'tegucigalpa-honduras': {
    slug: 'tegucigalpa-honduras',
    name: 'Tegucigalpa',
    city: 'Tegucigalpa',
    country: 'Honduras',
    title: 'Crypto Payments in Tegucigalpa, Honduras | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for markets, cafés, and repair hubs.',
    localContext:
      'Urban SMEs adopt split payouts, QR receipts, and offline-first reliability.',
    popularIndustries: [
      'market-stall-vendors',
      'street-food-vendors',
      'internet-cafes',
      'mobile-phone-repair',
      'community-radio-stations',
    ],
    population: 1100000,
    businessCount: 80000,
  },

  'managua-nicaragua': {
    slug: 'managua-nicaragua',
    name: 'Managua',
    city: 'Managua',
    country: 'Nicaragua',
    title: 'Crypto Payments in Managua, Nicaragua | PortalPay',
    metaDescription:
      'Instant-settlement QR payments for markets, cafés, and repair kiosks.',
    localContext:
      'Retail corridors and artisan vendors benefit from transparent QR receipts and split payouts.',
    popularIndustries: [
      'market-stall-vendors',
      'artisan-potters',
      'internet-cafes',
      'mobile-phone-repair',
      'street-food-vendors',
    ],
    population: 1100000,
    businessCount: 90000,
  },

  'san-jose-costa-rica': {
    slug: 'san-jose-costa-rica',
    name: 'San José',
    city: 'San José',
    country: 'Costa Rica',
    title: 'Crypto Payments in San José, Costa Rica | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for cafés, markets, and repair hubs.',
    localContext:
      'San José SMEs leverage split payouts, QR receipts, and offline-first operations.',
    popularIndustries: [
      'cafes',
      'internet-cafes',
      'mobile-phone-repair',
      'market-stall-vendors',
      'community-radio-stations',
    ],
    population: 1400000,
    businessCount: 120000,
  },

  'santo-domingo-dominican-republic': {
    slug: 'santo-domingo-dominican-republic',
    name: 'Santo Domingo',
    city: 'Santo Domingo',
    country: 'Dominican Republic',
    title: 'Crypto Payments in Santo Domingo, Dominican Republic | PortalPay',
    metaDescription:
      'Instant-settlement QR payments for coastal services, cafés, and repair hubs.',
    localContext:
      'Tourism corridors and local markets adopt QR tickets, split payouts, and offline receipts.',
    popularIndustries: [
      'small-ferry-operators',
      'cafes',
      'internet-cafes',
      'mobile-phone-repair',
      'street-food-vendors',
    ],
    population: 3000000,
    businessCount: 250000,
  },

  'port-au-prince-haiti': {
    slug: 'port-au-prince-haiti',
    name: 'Port-au-Prince',
    city: 'Port-au-Prince',
    country: 'Haiti',
    title: 'Crypto Payments in Port-au-Prince, Haiti | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for markets, cafés, and repair kiosks.',
    localContext:
      'Local SMEs benefit from split payouts, QR receipts, and offline-first support.',
    popularIndustries: [
      'market-stall-vendors',
      'street-food-vendors',
      'mobile-phone-repair',
      'internet-cafes',
      'community-radio-stations',
    ],
    population: 1200000,
    businessCount: 100000,
  },

  'havana-cuba': {
    slug: 'havana-cuba',
    name: 'Havana',
    city: 'Havana',
    country: 'Cuba',
    title: 'Crypto Payments in Havana, Cuba | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for artisan vendors, cafés, and repair hubs.',
    localContext:
      'Craft corridors and cafés leverage QR receipts, inventory tagging, and split payouts.',
    popularIndustries: [
      'artisan-potters',
      'cafes',
      'internet-cafes',
      'mobile-phone-repair',
      'street-food-vendors',
    ],
    population: 2100000,
    businessCount: 180000,
  },

  'georgetown-guyana': {
    slug: 'georgetown-guyana',
    name: 'Georgetown',
    city: 'Georgetown',
    country: 'Guyana',
    title: 'Crypto Payments in Georgetown, Guyana | PortalPay',
    metaDescription:
      'Instant-settlement QR payments for markets, cafés, and repair hubs.',
    localContext:
      'Port-adjacent SMEs and markets benefit from QR receipts, split payouts, and offline-first support.',
    popularIndustries: [
      'market-stall-vendors',
      'street-food-vendors',
      'internet-cafes',
      'mobile-phone-repair',
      'community-radio-stations',
    ],
    population: 200000,
    businessCount: 30000,
  },

  'paramaribo-suriname': {
    slug: 'paramaribo-suriname',
    name: 'Paramaribo',
    city: 'Paramaribo',
    country: 'Suriname',
    title: 'Crypto Payments in Paramaribo, Suriname | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for cafés, markets, and repair kiosks.',
    localContext:
      'SMEs adopt split payouts, QR receipts, and offline-first reliability.',
    popularIndustries: [
      'cafes',
      'internet-cafes',
      'mobile-phone-repair',
      'market-stall-vendors',
      'street-food-vendors',
    ],
    population: 250000,
    businessCount: 35000,
  },

  'sofia-bulgaria': {
    slug: 'sofia-bulgaria',
    name: 'Sofia',
    city: 'Sofia',
    country: 'Bulgaria',
    title: 'Crypto Payments in Sofia, Bulgaria | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for cafés, markets, and repair hubs.',
    localContext:
      'Tech and craft SMEs use split payouts, QR receipts, and offline-first operations.',
    popularIndustries: [
      'cafes',
      'internet-cafes',
      'mobile-phone-repair',
      'artisan-potters',
      'community-radio-stations',
    ],
    population: 1300000,
    businessCount: 200000,
  },

  'bucharest-romania': {
    slug: 'bucharest-romania',
    name: 'Bucharest',
    city: 'Bucharest',
    country: 'Romania',
    title: 'Crypto Payments in Bucharest, Romania | PortalPay',
    metaDescription:
      'Instant-settlement QR payments for cafés, markets, and repair kiosks.',
    localContext:
      'Urban SMEs benefit from QR receipts, inventory tagging, and split payouts.',
    popularIndustries: [
      'cafes',
      'internet-cafes',
      'mobile-phone-repair',
      'market-stall-vendors',
      'community-radio-stations',
    ],
    population: 1800000,
    businessCount: 250000,
  },

  'chisinau-moldova': {
    slug: 'chisinau-moldova',
    name: 'Chișinău',
    city: 'Chișinău',
    country: 'Moldova',
    title: 'Crypto Payments in Chișinău, Moldova | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for cafés, artisan vendors, and repair hubs.',
    localContext:
      'Craft vendors and cafés leverage split payouts, QR receipts, and offline-first operations.',
    popularIndustries: [
      'artisan-potters',
      'cafes',
      'internet-cafes',
      'mobile-phone-repair',
      'village-savings-groups',
    ],
    population: 700000,
    businessCount: 90000,
  },

  'sarajevo-bosnia-and-herzegovina': {
    slug: 'sarajevo-bosnia-and-herzegovina',
    name: 'Sarajevo',
    city: 'Sarajevo',
    country: 'Bosnia and Herzegovina',
    title: 'Crypto Payments in Sarajevo, Bosnia and Herzegovina | PortalPay',
    metaDescription:
      'Instant-settlement QR payments for cafés, markets, and repair kiosks.',
    localContext:
      'Old-town craft vendors and cafés benefit from QR receipts, split payouts, and offline-first support.',
    popularIndustries: [
      'artisan-potters',
      'cafes',
      'internet-cafes',
      'mobile-phone-repair',
      'market-stall-vendors',
    ],
    population: 500000,
    businessCount: 70000,
  },

  'skopje-north-macedonia': {
    slug: 'skopje-north-macedonia',
    name: 'Skopje',
    city: 'Skopje',
    country: 'North Macedonia',
    title: 'Crypto Payments in Skopje, North Macedonia | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for cafés, markets, and repair hubs.',
    localContext:
      'SMEs adopt split payouts, QR receipts, and offline-first reliability.',
    popularIndustries: [
      'cafes',
      'internet-cafes',
      'mobile-phone-repair',
      'market-stall-vendors',
      'community-radio-stations',
    ],
    population: 600000,
    businessCount: 80000,
  },

  'pristina-kosovo': {
    slug: 'pristina-kosovo',
    name: 'Pristina',
    city: 'Pristina',
    country: 'Kosovo',
    title: 'Crypto Payments in Pristina, Kosovo | PortalPay',
    metaDescription:
      'Instant-settlement QR payments for cafés, markets, and repair kiosks.',
    localContext:
      'Student and artisan districts use QR receipts, inventory tags, and split payouts.',
    popularIndustries: [
      'cafes',
      'internet-cafes',
      'mobile-phone-repair',
      'artisan-potters',
      'market-stall-vendors',
    ],
    population: 200000,
    businessCount: 30000,
  },

  'podgorica-montenegro': {
    slug: 'podgorica-montenegro',
    name: 'Podgorica',
    city: 'Podgorica',
    country: 'Montenegro',
    title: 'Crypto Payments in Podgorica, Montenegro | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for cafés, markets, and repair hubs.',
    localContext:
      'Urban SMEs leverage split payouts, QR receipts, and offline-first support.',
    popularIndustries: [
      'cafes',
      'internet-cafes',
      'mobile-phone-repair',
      'market-stall-vendors',
      'community-radio-stations',
    ],
    population: 200000,
    businessCount: 25000,
  },

  'astana-kazakhstan': {
    slug: 'astana-kazakhstan',
    name: 'Astana',
    city: 'Astana',
    country: 'Kazakhstan',
    title: 'Crypto Payments in Astana, Kazakhstan | PortalPay',
    metaDescription:
      'Instant-settlement QR payments for cafés, markets, and repair hubs.',
    localContext:
      'Administrative districts and SMEs adopt split payouts, QR receipts, and offline-first operations.',
    popularIndustries: [
      'cafes',
      'internet-cafes',
      'mobile-phone-repair',
      'street-food-vendors',
      'community-radio-stations',
    ],
    population: 1200000,
    businessCount: 150000,
  },

  'ashgabat-turkmenistan': {
    slug: 'ashgabat-turkmenistan',
    name: 'Ashgabat',
    city: 'Ashgabat',
    country: 'Turkmenistan',
    title: 'Crypto Payments in Ashgabat, Turkmenistan | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for cafés, markets, and repair kiosks.',
    localContext:
      'SMEs benefit from QR receipts, inventory tagging, and split payouts for attendants.',
    popularIndustries: [
      'market-stall-vendors',
      'internet-cafes',
      'mobile-phone-repair',
      'cafes',
      'community-radio-stations',
    ],
    population: 1000000,
    businessCount: 120000,
  },

  'ulaanbaatar-mongolia': {
    slug: 'ulaanbaatar-mongolia',
    name: 'Ulaanbaatar',
    city: 'Ulaanbaatar',
    country: 'Mongolia',
    title: 'Crypto Payments in Ulaanbaatar, Mongolia | PortalPay',
    metaDescription:
      'Instant-settlement QR payments for markets, cafés, and repair hubs.',
    localContext:
      'Craft vendors and cafés adopt QR receipts, split payouts, and offline-first operations.',
    popularIndustries: [
      'artisan-potters',
      'market-stall-vendors',
      'internet-cafes',
      'mobile-phone-repair',
      'street-food-vendors',
    ],
    population: 1500000,
    businessCount: 160000,
  },

  'suva-fiji': {
    slug: 'suva-fiji',
    name: 'Suva',
    city: 'Suva',
    country: 'Fiji',
    title: 'Crypto Payments in Suva, Fiji | PortalPay',
    metaDescription:
      'QR ticketing and instant settlement for coastal services, cafés, and repair hubs.',
    localContext:
      'Island SMEs leverage QR tickets, split payouts, and offline-first receipts.',
    popularIndustries: [
      'small-ferry-operators',
      'cafes',
      'internet-cafes',
      'mobile-phone-repair',
      'artisan-potters',
    ],
    population: 180000,
    businessCount: 25000,
  },

  'apia-samoa': {
    slug: 'apia-samoa',
    name: 'Apia',
    city: 'Apia',
    country: 'Samoa',
    title: 'Crypto Payments in Apia, Samoa | PortalPay',
    metaDescription:
      'Instant-settlement QR payments for coastal services, markets, and cafés.',
    localContext:
      'Tourism and market SMEs use QR receipts, inventory tagging, and split payouts.',
    popularIndustries: [
      'small-ferry-operators',
      'market-stall-vendors',
      'cafes',
      'internet-cafes',
      'mobile-phone-repair',
    ],
    population: 37000,
    businessCount: 8000,
  },

  'port-moresby-papua-new-guinea': {
    slug: 'port-moresby-papua-new-guinea',
    name: 'Port Moresby',
    city: 'Port Moresby',
    country: 'Papua New Guinea',
    title: 'Crypto Payments in Port Moresby, Papua New Guinea | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for coastal services, markets, and repair hubs.',
    localContext:
      'Coastal SMEs adopt QR tickets, split payouts, and offline-first operations.',
    popularIndustries: [
      'small-ferry-operators',
      'market-stall-vendors',
      'internet-cafes',
      'mobile-phone-repair',
      'street-food-vendors',
    ],
    population: 320000,
    businessCount: 40000,
  },

  'monrovia-liberia': {
    slug: 'monrovia-liberia',
    name: 'Monrovia',
    city: 'Monrovia',
    country: 'Liberia',
    title: 'Crypto Payments in Monrovia, Liberia | PortalPay',
    metaDescription:
      'Instant-settlement QR payments for markets, cafés, and repair kiosks.',
    localContext:
      'Port-adjacent SMEs and markets leverage QR receipts, inventory tags, and split payouts.',
    popularIndustries: [
      'market-stall-vendors',
      'street-food-vendors',
      'internet-cafes',
      'mobile-phone-repair',
      'community-radio-stations',
    ],
    population: 1500000,
    businessCount: 100000,
  },

  'freetown-sierra-leone': {
    slug: 'freetown-sierra-leone',
    name: 'Freetown',
    city: 'Freetown',
    country: 'Sierra Leone',
    title: 'Crypto Payments in Freetown, Sierra Leone | PortalPay',
    metaDescription:
      'QR ticketing and instant settlement for coastal services, cafés, and repair hubs.',
    localContext:
      'Coastal SMEs adopt QR tickets, split payouts, and offline-first receipts.',
    popularIndustries: [
      'small-ferry-operators',
      'internet-cafes',
      'mobile-phone-repair',
      'street-food-vendors',
      'cafes',
    ],
    population: 1200000,
    businessCount: 90000,
  },

  'conakry-guinea': {
    slug: 'conakry-guinea',
    name: 'Conakry',
    city: 'Conakry',
    country: 'Guinea',
    title: 'Crypto Payments in Conakry, Guinea | PortalPay',
    metaDescription:
      'Instant-settlement QR payments for markets, cafés, and repair kiosks.',
    localContext:
      'Market SMEs adopt QR receipts, inventory tagging, and split payouts.',
    popularIndustries: [
      'market-stall-vendors',
      'street-food-vendors',
      'internet-cafes',
      'mobile-phone-repair',
      'community-radio-stations',
    ],
    population: 1800000,
    businessCount: 130000,
  },

  'bamako-mali': {
    slug: 'bamako-mali',
    name: 'Bamako',
    city: 'Bamako',
    country: 'Mali',
    title: 'Crypto Payments in Bamako, Mali | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for markets, cafés, and repair hubs.',
    localContext:
      'SMEs use QR receipts, split payouts, and offline-first operations for cash flow.',
    popularIndustries: [
      'market-stall-vendors',
      'internet-cafes',
      'mobile-phone-repair',
      'street-food-vendors',
      'community-radio-stations',
    ],
    population: 2800000,
    businessCount: 190000,
  },

  'ouagadougou-burkina-faso': {
    slug: 'ouagadougou-burkina-faso',
    name: 'Ouagadougou',
    city: 'Ouagadougou',
    country: 'Burkina Faso',
    title: 'Crypto Payments in Ouagadougou, Burkina Faso | PortalPay',
    metaDescription:
      'Instant-settlement QR payments for markets, cafés, and repair kiosks.',
    localContext:
      'Market vendors and cafés adopt QR receipts, inventory tagging, and split payouts.',
    popularIndustries: [
      'market-stall-vendors',
      'street-food-vendors',
      'internet-cafes',
      'mobile-phone-repair',
      'village-savings-groups',
    ],
    population: 2500000,
    businessCount: 180000,
  },

  'niamey-niger': {
    slug: 'niamey-niger',
    name: 'Niamey',
    city: 'Niamey',
    country: 'Niger',
    title: 'Crypto Payments in Niamey, Niger | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for markets, cafés, and repair hubs.',
    localContext:
      'SMEs leverage QR receipts, split payouts, and offline-first support.',
    popularIndustries: [
      'market-stall-vendors',
      'internet-cafes',
      'mobile-phone-repair',
      'street-food-vendors',
      'community-radio-stations',
    ],
    population: 1400000,
    businessCount: 100000,
  },

  'lome-togo': {
    slug: 'lome-togo',
    name: 'Lomé',
    city: 'Lomé',
    country: 'Togo',
    title: 'Crypto Payments in Lomé, Togo | PortalPay',
    metaDescription:
      'Instant-settlement QR payments for coastal services, markets, and cafés.',
    localContext:
      'Port and market SMEs adopt QR tickets, split payouts, and offline-first receipts.',
    popularIndustries: [
      'small-ferry-operators',
      'market-stall-vendors',
      'internet-cafes',
      'mobile-phone-repair',
      'street-food-vendors',
    ],
    population: 1600000,
    businessCount: 120000,
  },

  'cotonou-benin': {
    slug: 'cotonou-benin',
    name: 'Cotonou',
    city: 'Cotonou',
    country: 'Benin',
    title: 'Crypto Payments in Cotonou, Benin | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for markets, cafés, and repair kiosks.',
    localContext:
      'Coastal SMEs and market vendors leverage QR receipts, inventory tags, and split payouts.',
    popularIndustries: [
      'market-stall-vendors',
      'street-food-vendors',
      'internet-cafes',
      'mobile-phone-repair',
      'community-radio-stations',
    ],
    population: 1200000,
    businessCount: 100000,
  },

  'gaborone-botswana': {
    slug: 'gaborone-botswana',
    name: 'Gaborone',
    city: 'Gaborone',
    country: 'Botswana',
    title: 'Crypto Payments in Gaborone, Botswana | PortalPay',
    metaDescription:
      'Instant-settlement QR payments for cafés, markets, and repair hubs.',
    localContext:
      'Urban SMEs adopt split payouts, QR receipts, and offline-first reliability.',
    popularIndustries: [
      'cafes',
      'internet-cafes',
      'mobile-phone-repair',
      'market-stall-vendors',
      'village-savings-groups',
    ],
    population: 240000,
    businessCount: 35000,
  },

  'maseru-lesotho': {
    slug: 'maseru-lesotho',
    name: 'Maseru',
    city: 'Maseru',
    country: 'Lesotho',
    title: 'Crypto Payments in Maseru, Lesotho | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for markets, cafés, and repair kiosks.',
    localContext:
      'SMEs leverage QR receipts, split payouts, and offline-first operations.',
    popularIndustries: [
      'market-stall-vendors',
      'internet-cafes',
      'mobile-phone-repair',
      'street-food-vendors',
      'community-radio-stations',
    ],
    population: 110000,
    businessCount: 15000,
  },

  'mbabane-eswatini': {
    slug: 'mbabane-eswatini',
    name: 'Mbabane',
    city: 'Mbabane',
    country: 'Eswatini',
    title: 'Crypto Payments in Mbabane, Eswatini | PortalPay',
    metaDescription:
      'Instant-settlement QR payments for cafés, markets, and repair hubs.',
    localContext:
      'Urban SMEs use split payouts, QR receipts, and offline-first reliability for daily close.',
    popularIndustries: [
      'cafes',
      'internet-cafes',
      'mobile-phone-repair',
      'market-stall-vendors',
      'village-savings-groups',
    ],
    population: 95000,
    businessCount: 12000,
  },

  'sanaa-yemen': {
    slug: 'sanaa-yemen',
    name: "Sana'a",
    city: "Sana'a",
    country: 'Yemen',
    title: "Crypto Payments in Sana'a, Yemen | PortalPay",
    metaDescription:
      'QR receipts and instant settlement for markets, cafés, and repair kiosks.',
    localContext:
      'Market SMEs leverage QR receipts, split payouts, and offline-first operations.',
    popularIndustries: [
      'market-stall-vendors',
      'street-food-vendors',
      'internet-cafes',
      'mobile-phone-repair',
      'community-radio-stations',
    ],
    population: 2900000,
    businessCount: 200000,
  },

  'aden-yemen': {
    slug: 'aden-yemen',
    name: 'Aden',
    city: 'Aden',
    country: 'Yemen',
    title: 'Crypto Payments in Aden, Yemen | PortalPay',
    metaDescription:
      'Instant-settlement QR payments for coastal services, markets, and cafés.',
    localContext:
      'Coastal and market SMEs adopt QR tickets, split payouts, and offline-first receipts.',
    popularIndustries: [
      'small-ferry-operators',
      'market-stall-vendors',
      'internet-cafes',
      'mobile-phone-repair',
      'street-food-vendors',
    ],
    population: 800000,
    businessCount: 70000,
  },

  'bandar-seri-begawan-brunei': {
    slug: 'bandar-seri-begawan-brunei',
    name: 'Bandar Seri Begawan',
    city: 'Bandar Seri Begawan',
    country: 'Brunei',
    title: 'Crypto Payments in Bandar Seri Begawan, Brunei | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for cafés, markets, and repair hubs.',
    localContext:
      'Urban SMEs adopt split payouts, QR receipts, and offline-first operations.',
    popularIndustries: [
      'cafes',
      'internet-cafes',
      'mobile-phone-repair',
      'market-stall-vendors',
      'community-radio-stations',
    ],
    population: 100000,
    businessCount: 15000,
  },

  'dili-timor-leste': {
    slug: 'dili-timor-leste',
    name: 'Dili',
    city: 'Dili',
    country: 'Timor-Leste',
    title: 'Crypto Payments in Dili, Timor-Leste | PortalPay',
    metaDescription:
      'Instant-settlement QR payments for coastal services, markets, and cafés.',
    localContext:
      'Coastal SMEs adopt QR tickets, split payouts, and offline-first receipts.',
    popularIndustries: [
      'small-ferry-operators',
      'market-stall-vendors',
      'internet-cafes',
      'mobile-phone-repair',
      'cafes',
    ],
    population: 280000,
    businessCount: 30000,
  },
  'luanda-angola': {
    slug: 'luanda-angola',
    name: 'Luanda',
    city: 'Luanda',
    country: 'Angola',
    title: 'Crypto Payments in Luanda, Angola | PortalPay',
    metaDescription:
      'Instant-settlement QR payments for ports, markets, and cafés in Luanda.',
    localContext:
      'Ports and waterfront SMEs use QR tickets, split payouts, and offline-first receipts.',
    popularIndustries: [
      'small-ferry-operators',
      'internet-cafes',
      'mobile-phone-repair',
      'street-food-vendors',
      'community-radio-stations',
    ],
    population: 8600000,
    businessCount: 500000,
  },

  'libreville-gabon': {
    slug: 'libreville-gabon',
    name: 'Libreville',
    city: 'Libreville',
    country: 'Gabon',
    title: 'Crypto Payments in Libreville, Gabon | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for cafés, markets, and repair hubs.',
    localContext:
      'Coastal SMEs adopt QR tickets, split payouts, and offline-first reliability.',
    popularIndustries: [
      'small-ferry-operators',
      'internet-cafes',
      'mobile-phone-repair',
      'cafes',
      'village-savings-groups',
    ],
    population: 800000,
    businessCount: 90000,
  },

  'yaounde-cameroon': {
    slug: 'yaounde-cameroon',
    name: 'Yaoundé',
    city: 'Yaoundé',
    country: 'Cameroon',
    title: 'Crypto Payments in Yaoundé, Cameroon | PortalPay',
    metaDescription:
      'Instant-settlement QR payments for markets, cafés, and repair kiosks.',
    localContext:
      'Government districts and markets leverage QR receipts, inventory tagging, and split payouts.',
    popularIndustries: [
      'market-stall-vendors',
      'internet-cafes',
      'mobile-phone-repair',
      'community-radio-stations',
      'cafes',
    ],
    population: 3300000,
    businessCount: 230000,
  },

  'brazzaville-congo': {
    slug: 'brazzaville-congo',
    name: 'Brazzaville',
    city: 'Brazzaville',
    country: 'Republic of the Congo',
    title: 'Crypto Payments in Brazzaville, Republic of the Congo | PortalPay',
    metaDescription:
      'QR ticketing and instant settlement for river services, cafés, and repair hubs.',
    localContext:
      'Congo River SMEs adopt QR tickets, split payouts, and offline-first receipts.',
    popularIndustries: [
      'small-ferry-operators',
      'internet-cafes',
      'mobile-phone-repair',
      'market-stall-vendors',
      'village-savings-groups',
    ],
    population: 2300000,
    businessCount: 160000,
  },

  'bangui-central-african-republic': {
    slug: 'bangui-central-african-republic',
    name: 'Bangui',
    city: 'Bangui',
    country: 'Central African Republic',
    title: 'Crypto Payments in Bangui, Central African Republic | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for markets, cafés, and repair hubs.',
    localContext:
      'Local SMEs use QR receipts, split payouts, and offline-first mode for reliability.',
    popularIndustries: [
      'market-stall-vendors',
      'mobile-phone-repair',
      'internet-cafes',
      'village-savings-groups',
      'community-radio-stations',
    ],
    population: 900000,
    businessCount: 70000,
  },

  'lilongwe-malawi': {
    slug: 'lilongwe-malawi',
    name: 'Lilongwe',
    city: 'Lilongwe',
    country: 'Malawi',
    title: 'Crypto Payments in Lilongwe, Malawi | PortalPay',
    metaDescription:
      'Instant-settlement QR payments for markets, cafés, and repair kiosks.',
    localContext:
      'Lilongwe SMEs adopt QR receipts, split payouts, and offline-first operations.',
    popularIndustries: [
      'market-stall-vendors',
      'internet-cafes',
      'mobile-phone-repair',
      'community-radio-stations',
      'village-savings-groups',
    ],
    population: 1100000,
    businessCount: 90000,
  },

  'blantyre-malawi': {
    slug: 'blantyre-malawi',
    name: 'Blantyre',
    city: 'Blantyre',
    country: 'Malawi',
    title: 'Crypto Payments in Blantyre, Malawi | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for cafés, markets, and repair hubs.',
    localContext:
      'Trading corridors and bakeries benefit from QR receipts, inventory tags, and split payouts.',
    popularIndustries: [
      'street-food-vendors',
      'internet-cafes',
      'mobile-phone-repair',
      'bakeries',
      'village-savings-groups',
    ],
    population: 1100000,
    businessCount: 95000,
  },

  'nouakchott-mauritania': {
    slug: 'nouakchott-mauritania',
    name: 'Nouakchott',
    city: 'Nouakchott',
    country: 'Mauritania',
    title: 'Crypto Payments in Nouakchott, Mauritania | PortalPay',
    metaDescription:
      'Instant-settlement QR payments for coastal services, markets, and cafés.',
    localContext:
      'Port and market SMEs adopt QR tickets, split payouts, and offline-first receipts.',
    popularIndustries: [
      'small-ferry-operators',
      'street-food-vendors',
      'market-stall-vendors',
      'mobile-phone-repair',
      'internet-cafes',
    ],
    population: 1100000,
    businessCount: 85000,
  },

  'bissau-guinea-bissau': {
    slug: 'bissau-guinea-bissau',
    name: 'Bissau',
    city: 'Bissau',
    country: 'Guinea-Bissau',
    title: 'Crypto Payments in Bissau, Guinea-Bissau | PortalPay',
    metaDescription:
      'QR ticketing and instant settlement for coastal services, cafés, and repair hubs.',
    localContext:
      'Coastal SMEs and markets use QR tickets, split payouts, and offline-first receipts.',
    popularIndustries: [
      'small-ferry-operators',
      'market-stall-vendors',
      'mobile-phone-repair',
      'internet-cafes',
      'community-radio-stations',
    ],
    population: 500000,
    businessCount: 60000,
  },

  'praia-cape-verde': {
    slug: 'praia-cape-verde',
    name: 'Praia',
    city: 'Praia',
    country: 'Cape Verde',
    title: 'Crypto Payments in Praia, Cape Verde | PortalPay',
    metaDescription:
      'Instant-settlement QR payments for coastal services, cafés, and artisan vendors.',
    localContext:
      'Island SMEs adopt QR receipts, inventory tags, and split payouts for crews.',
    popularIndustries: [
      'small-ferry-operators',
      'cafes',
      'internet-cafes',
      'mobile-phone-repair',
      'artisan-potters',
    ],
    population: 160000,
    businessCount: 22000,
  },

  'tripoli-libya': {
    slug: 'tripoli-libya',
    name: 'Tripoli',
    city: 'Tripoli',
    country: 'Libya',
    title: 'Crypto Payments in Tripoli, Libya | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for markets, cafés, and repair hubs.',
    localContext:
      'Urban SMEs leverage QR receipts, split payouts, and offline-first reliability.',
    popularIndustries: [
      'cafes',
      'internet-cafes',
      'mobile-phone-repair',
      'market-stall-vendors',
      'community-radio-stations',
    ],
    population: 1200000,
    businessCount: 130000,
  },

  'khartoum-sudan': {
    slug: 'khartoum-sudan',
    name: 'Khartoum',
    city: 'Khartoum',
    country: 'Sudan',
    title: 'Crypto Payments in Khartoum, Sudan | PortalPay',
    metaDescription:
      'Instant-settlement QR payments for markets, cafés, and repair kiosks.',
    localContext:
      'Markets and corridors adopt QR receipts, inventory tags, and split payouts.',
    popularIndustries: [
      'market-stall-vendors',
      'mobile-phone-repair',
      'internet-cafes',
      'community-radio-stations',
      'village-savings-groups',
    ],
    population: 5900000,
    businessCount: 400000,
  },

  'erbil-iraq': {
    slug: 'erbil-iraq',
    name: 'Erbil',
    city: 'Erbil',
    country: 'Iraq',
    title: 'Crypto Payments in Erbil, Iraq | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for cafés, markets, and repair hubs.',
    localContext:
      'Bazaar vendors and cafés leverage QR receipts, split payouts, and offline-first support.',
    popularIndustries: [
      'cafes',
      'internet-cafes',
      'mobile-phone-repair',
      'artisan-potters',
      'community-radio-stations',
    ],
    population: 1200000,
    businessCount: 150000,
  },

  'baghdad-iraq': {
    slug: 'baghdad-iraq',
    name: 'Baghdad',
    city: 'Baghdad',
    country: 'Iraq',
    title: 'Crypto Payments in Baghdad, Iraq | PortalPay',
    metaDescription:
      'Instant-settlement QR payments for markets, cafés, and repair kiosks.',
    localContext:
      'Retail corridors and markets adopt QR receipts, inventory tagging, and split payouts.',
    popularIndustries: [
      'cafes',
      'internet-cafes',
      'mobile-phone-repair',
      'market-stall-vendors',
      'community-radio-stations',
    ],
    population: 7600000,
    businessCount: 600000,
  },

  'riyadh-saudi-arabia': {
    slug: 'riyadh-saudi-arabia',
    name: 'Riyadh',
    city: 'Riyadh',
    country: 'Saudi Arabia',
    title: 'Crypto Payments in Riyadh, Saudi Arabia | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for cafés, retail, and repair hubs.',
    localContext:
      'Retail corridors and cafés adopt split payouts, QR receipts, and offline-first reliability.',
    popularIndustries: [
      'cafes',
      'internet-cafes',
      'mobile-phone-repair',
      'retail',
      'community-radio-stations',
    ],
    population: 7700000,
    businessCount: 900000,
  },

  'jeddah-saudi-arabia': {
    slug: 'jeddah-saudi-arabia',
    name: 'Jeddah',
    city: 'Jeddah',
    country: 'Saudi Arabia',
    title: 'Crypto Payments in Jeddah, Saudi Arabia | PortalPay',
    metaDescription:
      'Instant-settlement QR payments for coastal services, cafés, and repair hubs.',
    localContext:
      'Port-adjacent SMEs use QR tickets, split payouts, and offline-first operations.',
    popularIndustries: [
      'small-ferry-operators',
      'internet-cafes',
      'mobile-phone-repair',
      'cafes',
      'retail',
    ],
    population: 4200000,
    businessCount: 500000,
  },

  'manama-bahrain': {
    slug: 'manama-bahrain',
    name: 'Manama',
    city: 'Manama',
    country: 'Bahrain',
    title: 'Crypto Payments in Manama, Bahrain | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for cafés, artisan vendors, and repair kiosks.',
    localContext:
      'Island SMEs leverage QR receipts, inventory tags, and split payouts.',
    popularIndustries: [
      'cafes',
      'internet-cafes',
      'mobile-phone-repair',
      'small-ferry-operators',
      'artisan-potters',
    ],
    population: 210000,
    businessCount: 30000,
  },

  'kuwait-city-kuwait': {
    slug: 'kuwait-city-kuwait',
    name: 'Kuwait City',
    city: 'Kuwait City',
    country: 'Kuwait',
    title: 'Crypto Payments in Kuwait City, Kuwait | PortalPay',
    metaDescription:
      'Instant-settlement QR payments for cafés, retail, and repair hubs.',
    localContext:
      'Retail corridors and cafés adopt split payouts, QR receipts, and offline-first operations.',
    popularIndustries: [
      'cafes',
      'internet-cafes',
      'mobile-phone-repair',
      'retail',
      'community-radio-stations',
    ],
    population: 450000,
    businessCount: 70000,
  },

  'pune-india': {
    slug: 'pune-india',
    name: 'Pune',
    city: 'Pune',
    country: 'India',
    title: 'Crypto Payments in Pune, India | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for cafés, repair hubs, and bakeries.',
    localContext:
      'Tech corridors and bazaars benefit from split payouts, QR receipts, and offline-first sales.',
    popularIndustries: [
      'internet-cafes',
      'mobile-phone-repair',
      'cafes',
      'bakeries',
      'hardware-shops',
    ],
    population: 7600000,
    businessCount: 500000,
  },

  'ahmedabad-india': {
    slug: 'ahmedabad-india',
    name: 'Ahmedabad',
    city: 'Ahmedabad',
    country: 'India',
    title: 'Crypto Payments in Ahmedabad, India | PortalPay',
    metaDescription:
      'Instant-settlement QR payments for markets, cafés, and artisan vendors.',
    localContext:
      'Textile and craft SMEs adopt QR receipts, inventory tagging, and split payouts.',
    popularIndustries: [
      'market-stall-vendors',
      'internet-cafes',
      'mobile-phone-repair',
      'community-radio-stations',
      'artisan-potters',
    ],
    population: 8400000,
    businessCount: 600000,
  },

  'jaipur-india': {
    slug: 'jaipur-india',
    name: 'Jaipur',
    city: 'Jaipur',
    country: 'India',
    title: 'Crypto Payments in Jaipur, India | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for artisan bazaars, cafés, and repair kiosks.',
    localContext:
      'Handicraft markets and cafés leverage QR receipts, split payouts, and offline-first.',
    popularIndustries: [
      'artisan-potters',
      'cafes',
      'internet-cafes',
      'mobile-phone-repair',
      'market-stall-vendors',
    ],
    population: 4300000,
    businessCount: 320000,
  },

  'surat-india': {
    slug: 'surat-india',
    name: 'Surat',
    city: 'Surat',
    country: 'India',
    title: 'Crypto Payments in Surat, India | PortalPay',
    metaDescription:
      'Instant-settlement QR payments for markets, cafés, and repair hubs.',
    localContext:
      'Textile corridors adopt QR receipts, inventory tagging, and split payouts.',
    popularIndustries: [
      'market-stall-vendors',
      'internet-cafes',
      'mobile-phone-repair',
      'street-food-vendors',
      'community-radio-stations',
    ],
    population: 7000000,
    businessCount: 450000,
  },

  'peshawar-pakistan': {
    slug: 'peshawar-pakistan',
    name: 'Peshawar',
    city: 'Peshawar',
    country: 'Pakistan',
    title: 'Crypto Payments in Peshawar, Pakistan | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for markets, cafés, and repair kiosks.',
    localContext:
      'Historic bazaars adopt QR receipts, split payouts, and offline-first workflows.',
    popularIndustries: [
      'market-stall-vendors',
      'mobile-phone-repair',
      'internet-cafes',
      'street-food-vendors',
      'community-radio-stations',
    ],
    population: 2000000,
    businessCount: 180000,
  },

  'quetta-pakistan': {
    slug: 'quetta-pakistan',
    name: 'Quetta',
    city: 'Quetta',
    country: 'Pakistan',
    title: 'Crypto Payments in Quetta, Pakistan | PortalPay',
    metaDescription:
      'Instant-settlement QR payments for markets, cafés, and repair hubs.',
    localContext:
      'Trade corridors leverage QR receipts, inventory tags, and split payouts.',
    popularIndustries: [
      'market-stall-vendors',
      'internet-cafes',
      'mobile-phone-repair',
      'cafes',
      'village-savings-groups',
    ],
    population: 1200000,
    businessCount: 100000,
  },

  'faisalabad-pakistan': {
    slug: 'faisalabad-pakistan',
    name: 'Faisalabad',
    city: 'Faisalabad',
    country: 'Pakistan',
    title: 'Crypto Payments in Faisalabad, Pakistan | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for hardware, markets, and repair hubs.',
    localContext:
      'Industrial SMEs adopt QR receipts, split payouts, and offline-first reliability.',
    popularIndustries: [
      'hardware-shops',
      'mobile-phone-repair',
      'internet-cafes',
      'street-food-vendors',
      'community-radio-stations',
    ],
    population: 3800000,
    businessCount: 300000,
  },

  'multan-pakistan': {
    slug: 'multan-pakistan',
    name: 'Multan',
    city: 'Multan',
    country: 'Pakistan',
    title: 'Crypto Payments in Multan, Pakistan | PortalPay',
    metaDescription:
      'Instant-settlement QR payments for markets, cafés, and repair hubs.',
    localContext:
      'Craft vendors and bazaars benefit from QR receipts, inventory tags, and split payouts.',
    popularIndustries: [
      'market-stall-vendors',
      'internet-cafes',
      'mobile-phone-repair',
      'street-food-vendors',
      'artisan-potters',
    ],
    population: 2100000,
    businessCount: 180000,
  },

  'pokhara-nepal': {
    slug: 'pokhara-nepal',
    name: 'Pokhara',
    city: 'Pokhara',
    country: 'Nepal',
    title: 'Crypto Payments in Pokhara, Nepal | PortalPay',
    metaDescription:
      'QR ticketing and instant settlement for tours, cafés, and artisan vendors.',
    localContext:
      'Tour operators and craft markets leverage split payouts, QR receipts, and offline-first operations.',
    popularIndustries: [
      'cryptid-tour-operators',
      'artisan-potters',
      'internet-cafes',
      'tuk-tuk-operators',
      'cafes',
    ],
    population: 600000,
    businessCount: 70000,
  },

  'sylhet-bangladesh': {
    slug: 'sylhet-bangladesh',
    name: 'Sylhet',
    city: 'Sylhet',
    country: 'Bangladesh',
    title: 'Crypto Payments in Sylhet, Bangladesh | PortalPay',
    metaDescription:
      'Instant-settlement QR payments for markets, cafés, and repair hubs.',
    localContext:
      'Tea corridor SMEs adopt QR receipts, split payouts, and offline-first reliability.',
    popularIndustries: [
      'market-stall-vendors',
      'internet-cafes',
      'mobile-phone-repair',
      'community-radio-stations',
      'village-savings-groups',
    ],
    population: 700000,
    businessCount: 80000,
  },

  'rajshahi-bangladesh': {
    slug: 'rajshahi-bangladesh',
    name: 'Rajshahi',
    city: 'Rajshahi',
    country: 'Bangladesh',
    title: 'Crypto Payments in Rajshahi, Bangladesh | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for artisan vendors, cafés, and repair hubs.',
    localContext:
      'Craft and market SMEs adopt QR receipts, inventory tags, and split payouts.',
    popularIndustries: [
      'artisan-potters',
      'market-stall-vendors',
      'internet-cafes',
      'mobile-phone-repair',
      'street-food-vendors',
    ],
    population: 770000,
    businessCount: 90000,
  },

  'mandalay-myanmar': {
    slug: 'mandalay-myanmar',
    name: 'Mandalay',
    city: 'Mandalay',
    country: 'Myanmar',
    title: 'Crypto Payments in Mandalay, Myanmar | PortalPay',
    metaDescription:
      'Instant-settlement QR payments for cafés, artisan vendors, and repair hubs.',
    localContext:
      'Craft corridors and cafés use QR receipts, split payouts, and offline-first mode.',
    popularIndustries: [
      'internet-cafes',
      'mobile-phone-repair',
      'artisan-potters',
      'community-radio-stations',
      'small-ferry-operators',
    ],
    population: 1200000,
    businessCount: 120000,
  },

  'luang-prabang-laos': {
    slug: 'luang-prabang-laos',
    name: 'Luang Prabang',
    city: 'Luang Prabang',
    country: 'Laos',
    title: 'Crypto Payments in Luang Prabang, Laos | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for cafés, artisan markets, and repair kiosks.',
    localContext:
      'Tour and craft SMEs leverage split payouts, QR receipts, and offline-first operations.',
    popularIndustries: [
      'artisan-potters',
      'cafes',
      'internet-cafes',
      'mobile-phone-repair',
      'community-radio-stations',
    ],
    population: 56000,
    businessCount: 8000,
  },

  'siem-reap-cambodia': {
    slug: 'siem-reap-cambodia',
    name: 'Siem Reap',
    city: 'Siem Reap',
    country: 'Cambodia',
    title: 'Crypto Payments in Siem Reap, Cambodia | PortalPay',
    metaDescription:
      'Instant-settlement QR payments for tourism, cafés, and artisan vendors.',
    localContext:
      'Tour operators and artisan markets adopt QR receipts, inventory tagging, and split payouts.',
    popularIndustries: [
      'artisan-potters',
      'cafes',
      'internet-cafes',
      'mobile-phone-repair',
      'community-radio-stations',
    ],
    population: 250000,
    businessCount: 35000,
  },

  'medan-indonesia': {
    slug: 'medan-indonesia',
    name: 'Medan',
    city: 'Medan',
    country: 'Indonesia',
    title: 'Crypto Payments in Medan, Indonesia | PortalPay',
    metaDescription:
      'QR ticketing and instant settlement for ports, cafés, and repair hubs.',
    localContext:
      'Port-adjacent SMEs use QR tickets, split payouts, and offline-first receipts.',
    popularIndustries: [
      'small-ferry-operators',
      'internet-cafes',
      'mobile-phone-repair',
      'cafes',
      'market-stall-vendors',
    ],
    population: 2600000,
    businessCount: 190000,
  },

  'makassar-indonesia': {
    slug: 'makassar-indonesia',
    name: 'Makassar',
    city: 'Makassar',
    country: 'Indonesia',
    title: 'Crypto Payments in Makassar, Indonesia | PortalPay',
    metaDescription:
      'Instant-settlement QR payments for coastal services, cafés, and repair hubs.',
    localContext:
      'Coastal SMEs adopt QR tickets, split payouts, and offline-first operations.',
    popularIndustries: [
      'small-ferry-operators',
      'internet-cafes',
      'mobile-phone-repair',
      'cafes',
      'street-food-vendors',
    ],
    population: 1700000,
    businessCount: 130000,
  },

  'hue-vietnam': {
    slug: 'hue-vietnam',
    name: 'Huế',
    city: 'Huế',
    country: 'Vietnam',
    title: 'Crypto Payments in Huế, Vietnam | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for artisan vendors, cafés, and repair hubs.',
    localContext:
      'Historic craft corridors and cafés leverage split payouts, QR receipts, and offline-first.',
    popularIndustries: [
      'artisan-potters',
      'cafes',
      'internet-cafes',
      'mobile-phone-repair',
      'street-food-vendors',
    ],
    population: 650000,
    businessCount: 70000,
  },

  'kota-kinabalu-malaysia': {
    slug: 'kota-kinabalu-malaysia',
    name: 'Kota Kinabalu',
    city: 'Kota Kinabalu',
    country: 'Malaysia',
    title: 'Crypto Payments in Kota Kinabalu, Malaysia | PortalPay',
    metaDescription:
      'QR ticketing and instant settlement for ferries, cafés, and repair hubs.',
    localContext:
      'Coastal SMEs adopt QR tickets, split payouts, and offline-first receipts.',
    popularIndustries: [
      'small-ferry-operators',
      'cafes',
      'internet-cafes',
      'mobile-phone-repair',
      'market-stall-vendors',
    ],
    population: 500000,
    businessCount: 60000,
  },

  'johor-bahru-malaysia': {
    slug: 'johor-bahru-malaysia',
    name: 'Johor Bahru',
    city: 'Johor Bahru',
    country: 'Malaysia',
    title: 'Crypto Payments in Johor Bahru, Malaysia | PortalPay',
    metaDescription:
      'Instant-settlement QR payments for cafés, retail, and repair hubs.',
    localContext:
      'Cross-border retail SMEs leverage QR receipts, split payouts, and offline-first support.',
    popularIndustries: [
      'internet-cafes',
      'mobile-phone-repair',
      'cafes',
      'retail',
      'street-food-vendors',
    ],
    population: 820000,
    businessCount: 120000,
  },

  'davao-city-philippines': {
    slug: 'davao-city-philippines',
    name: 'Davao City',
    city: 'Davao City',
    country: 'Philippines',
    title: 'Crypto Payments in Davao City, Philippines | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for ferries, sari-sari stores, and repair hubs.',
    localContext:
      'Island ferries and neighborhood stores adopt QR receipts, inventory tags, and split payouts.',
    popularIndustries: [
      'sari-sari-stores',
      'internet-cafes',
      'mobile-phone-repair',
      'small-ferry-operators',
      'community-radio-stations',
    ],
    population: 1800000,
    businessCount: 160000,
  },

  'monterrey-mexico': {
    slug: 'monterrey-mexico',
    name: 'Monterrey',
    city: 'Monterrey',
    country: 'Mexico',
    title: 'Crypto Payments in Monterrey, Mexico | PortalPay',
    metaDescription:
      'Instant-settlement QR payments for cafés, hardware, and repair hubs.',
    localContext:
      'Industrial corridors adopt QR receipts, split payouts, and offline-first reliability.',
    popularIndustries: [
      'internet-cafes',
      'mobile-phone-repair',
      'cafes',
      'hardware-shops',
      'retail',
    ],
    population: 1150000,
    businessCount: 200000,
  },

  'puebla-mexico': {
    slug: 'puebla-mexico',
    name: 'Puebla',
    city: 'Puebla',
    country: 'Mexico',
    title: 'Crypto Payments in Puebla, Mexico | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for markets, cafés, and artisan vendors.',
    localContext:
      'Historic markets and craft SMEs leverage QR receipts, inventory tags, and split payouts.',
    popularIndustries: [
      'market-stall-vendors',
      'internet-cafes',
      'mobile-phone-repair',
      'cafes',
      'artisan-potters',
    ],
    population: 1700000,
    businessCount: 220000,
  },

  'tijuana-mexico': {
    slug: 'tijuana-mexico',
    name: 'Tijuana',
    city: 'Tijuana',
    country: 'Mexico',
    title: 'Crypto Payments in Tijuana, Mexico | PortalPay',
    metaDescription:
      'Instant-settlement QR payments for cafés, retail, and repair hubs.',
    localContext:
      'Cross-border SMEs adopt QR receipts, split payouts, and offline-first operations.',
    popularIndustries: [
      'internet-cafes',
      'mobile-phone-repair',
      'cafes',
      'street-food-vendors',
      'retail',
    ],
    population: 2000000,
    businessCount: 250000,
  },

  'arequipa-peru': {
    slug: 'arequipa-peru',
    name: 'Arequipa',
    city: 'Arequipa',
    country: 'Peru',
    title: 'Crypto Payments in Arequipa, Peru | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for artisan vendors, cafés, and repair hubs.',
    localContext:
      'Craft corridors and cafés leverage split payouts, QR receipts, and offline-first support.',
    popularIndustries: [
      'artisan-potters',
      'internet-cafes',
      'mobile-phone-repair',
      'cafes',
      'market-stall-vendors',
    ],
    population: 1100000,
    businessCount: 150000,
  },

  'concepcion-chile': {
    slug: 'concepcion-chile',
    name: 'Concepción',
    city: 'Concepción',
    country: 'Chile',
    title: 'Crypto Payments in Concepción, Chile | PortalPay',
    metaDescription:
      'Instant-settlement QR payments for cafés, markets, and repair hubs.',
    localContext:
      'Industrial and student SMEs adopt QR receipts, split payouts, and offline-first.',
    popularIndustries: [
      'internet-cafes',
      'mobile-phone-repair',
      'cafes',
      'artisan-potters',
      'community-radio-stations',
    ],
    population: 900000,
    businessCount: 120000,
  },

  'mendoza-argentina': {
    slug: 'mendoza-argentina',
    name: 'Mendoza',
    city: 'Mendoza',
    country: 'Argentina',
    title: 'Crypto Payments in Mendoza, Argentina | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for artisan vendors, cafés, and repair hubs.',
    localContext:
      'Tourism and craft SMEs use QR receipts, inventory tags, and split payouts.',
    popularIndustries: [
      'artisan-potters',
      'cafes',
      'internet-cafes',
      'mobile-phone-repair',
      'community-radio-stations',
    ],
    population: 1150000,
    businessCount: 160000,
  },

  'cuenca-ecuador': {
    slug: 'cuenca-ecuador',
    name: 'Cuenca',
    city: 'Cuenca',
    country: 'Ecuador',
    title: 'Crypto Payments in Cuenca, Ecuador | PortalPay',
    metaDescription:
      'Instant-settlement QR payments for artisan markets, cafés, and repair hubs.',
    localContext:
      'Historic craft SMEs leverage split payouts, QR receipts, and offline-first operations.',
    popularIndustries: [
      'artisan-potters',
      'cafes',
      'internet-cafes',
      'mobile-phone-repair',
      'market-stall-vendors',
    ],
    population: 640000,
    businessCount: 90000,
  },

  'cochabamba-bolivia': {
    slug: 'cochabamba-bolivia',
    name: 'Cochabamba',
    city: 'Cochabamba',
    country: 'Bolivia',
    title: 'Crypto Payments in Cochabamba, Bolivia | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for markets, cafés, and repair hubs.',
    localContext:
      'Highland SMEs adopt QR receipts, inventory tags, and split payouts.',
    popularIndustries: [
      'market-stall-vendors',
      'internet-cafes',
      'mobile-phone-repair',
      'cafes',
      'artisan-potters',
    ],
    population: 1900000,
    businessCount: 150000,
  },

  'ciudad-del-este-paraguay': {
    slug: 'ciudad-del-este-paraguay',
    name: 'Ciudad del Este',
    city: 'Ciudad del Este',
    country: 'Paraguay',
    title: 'Crypto Payments in Ciudad del Este, Paraguay | PortalPay',
    metaDescription:
      'Instant-settlement QR payments for border markets, cafés, and repair hubs.',
    localContext:
      'Cross-border trade SMEs adopt QR receipts, inventory tagging, and split payouts.',
    popularIndustries: [
      'market-stall-vendors',
      'street-food-vendors',
      'internet-cafes',
      'mobile-phone-repair',
      'community-radio-stations',
    ],
    population: 320000,
    businessCount: 50000,
  },

  'nassau-bahamas': {
    slug: 'nassau-bahamas',
    name: 'Nassau',
    city: 'Nassau',
    country: 'Bahamas',
    title: 'Crypto Payments in Nassau, Bahamas | PortalPay',
    metaDescription:
      'QR ticketing and instant settlement for coastal services, cafés, and repair hubs.',
    localContext:
      'Tourism SMEs adopt QR tickets, split payouts, and offline-first operations.',
    popularIndustries: [
      'small-ferry-operators',
      'cafes',
      'internet-cafes',
      'mobile-phone-repair',
      'artisan-potters',
    ],
    population: 275000,
    businessCount: 40000,
  },

  'bridgetown-barbados': {
    slug: 'bridgetown-barbados',
    name: 'Bridgetown',
    city: 'Bridgetown',
    country: 'Barbados',
    title: 'Crypto Payments in Bridgetown, Barbados | PortalPay',
    metaDescription:
      'Instant-settlement QR payments for tourism, cafés, and repair kiosks.',
    localContext:
      'Waterfront SMEs leverage QR receipts, inventory tags, and split payouts.',
    popularIndustries: [
      'small-ferry-operators',
      'cafes',
      'internet-cafes',
      'mobile-phone-repair',
      'artisan-potters',
    ],
    population: 110000,
    businessCount: 15000,
  },

  'castries-st-lucia': {
    slug: 'castries-st-lucia',
    name: 'Castries',
    city: 'Castries',
    country: 'St. Lucia',
    title: 'Crypto Payments in Castries, St. Lucia | PortalPay',
    metaDescription:
      'QR ticketing and instant settlement for coastal services, cafés, and repair hubs.',
    localContext:
      'Island SMEs adopt QR tickets, split payouts, and offline-first receipts.',
    popularIndustries: [
      'small-ferry-operators',
      'cafes',
      'internet-cafes',
      'mobile-phone-repair',
      'artisan-potters',
    ],
    population: 20000,
    businessCount: 5000,
  },

  'st-georges-grenada': {
    slug: 'st-georges-grenada',
    name: "St. George's",
    city: "St. George's",
    country: 'Grenada',
    title: "Crypto Payments in St. George's, Grenada | PortalPay",
    metaDescription:
      'Instant-settlement QR payments for coastal services, markets, and cafés.',
    localContext:
      'Tourism SMEs leverage QR tickets, split payouts, and offline-first support.',
    popularIndustries: [
      'small-ferry-operators',
      'cafes',
      'internet-cafes',
      'mobile-phone-repair',
      'artisan-potters',
    ],
    population: 38000,
    businessCount: 6000,
  },

  'port-vila-vanuatu': {
    slug: 'port-vila-vanuatu',
    name: 'Port Vila',
    city: 'Port Vila',
    country: 'Vanuatu',
    title: 'Crypto Payments in Port Vila, Vanuatu | PortalPay',
    metaDescription:
      'QR ticketing and instant settlement for coastal services, cafés, and repair hubs.',
    localContext:
      'Island SMEs adopt QR tickets, split payouts, and offline-first operations.',
    popularIndustries: [
      'small-ferry-operators',
      'cafes',
      'internet-cafes',
      'mobile-phone-repair',
      'artisan-potters',
    ],
    population: 50000,
    businessCount: 7000,
  },

  'honiara-solomon-islands': {
    slug: 'honiara-solomon-islands',
    name: 'Honiara',
    city: 'Honiara',
    country: 'Solomon Islands',
    title: 'Crypto Payments in Honiara, Solomon Islands | PortalPay',
    metaDescription:
      'Instant-settlement QR payments for coastal services, markets, and cafés.',
    localContext:
      'Island SMEs use QR tickets, split payouts, and offline-first receipts.',
    popularIndustries: [
      'small-ferry-operators',
      'cafes',
      'internet-cafes',
      'mobile-phone-repair',
      'market-stall-vendors',
    ],
    population: 130000,
    businessCount: 18000,
  },

  'nukualofa-tonga': {
    slug: 'nukualofa-tonga',
    name: "Nuku'alofa",
    city: "Nuku'alofa",
    country: 'Tonga',
    title: "Crypto Payments in Nuku'alofa, Tonga | PortalPay",
    metaDescription:
      'QR ticketing and instant settlement for coastal services, cafés, and repair hubs.',
    localContext:
      'Tourism and market SMEs adopt QR tickets, split payouts, and offline-first support.',
    popularIndustries: [
      'small-ferry-operators',
      'cafes',
      'internet-cafes',
      'mobile-phone-repair',
      'artisan-potters',
    ],
    population: 24000,
    businessCount: 4000,
  },

  'port-louis-mauritius': {
    slug: 'port-louis-mauritius',
    name: 'Port Louis',
    city: 'Port Louis',
    country: 'Mauritius',
    title: 'Crypto Payments in Port Louis, Mauritius | PortalPay',
    metaDescription:
      'Instant-settlement QR payments for coastal services, cafés, and artisan vendors.',
    localContext:
      'Island SMEs adopt QR receipts, inventory tagging, and split payouts.',
    popularIndustries: [
      'small-ferry-operators',
      'cafes',
      'internet-cafes',
      'mobile-phone-repair',
      'artisan-potters',
    ],
    population: 150000,
    businessCount: 25000,
  },

  'male-maldives': {
    slug: 'male-maldives',
    name: 'Malé',
    city: 'Malé',
    country: 'Maldives',
    title: 'Crypto Payments in Malé, Maldives | PortalPay',
    metaDescription:
      'QR ticketing and instant settlement for coastal services, cafés, and repair hubs.',
    localContext:
      'Resort and ferry SMEs use QR tickets, split payouts, and offline-first operations.',
    popularIndustries: [
      'small-ferry-operators',
      'cafes',
      'internet-cafes',
      'mobile-phone-repair',
      'artisan-potters',
    ],
    population: 200000,
    businessCount: 30000,
  },

  'san-juan-puerto-rico': {
    slug: 'san-juan-puerto-rico',
    name: 'San Juan',
    city: 'San Juan',
    country: 'Puerto Rico',
    title: 'Crypto Payments in San Juan, Puerto Rico | PortalPay',
    metaDescription:
      'Instant-settlement QR payments for coastal services, cafés, and artisan vendors.',
    localContext:
      'Tourism corridors adopt QR receipts, inventory tags, and split payouts.',
    popularIndustries: [
      'small-ferry-operators',
      'cafes',
      'internet-cafes',
      'mobile-phone-repair',
      'artisan-potters',
    ],
    population: 320000,
    businessCount: 45000,
  },

  'belize-city-belize': {
    slug: 'belize-city-belize',
    name: 'Belize City',
    city: 'Belize City',
    country: 'Belize',
    title: 'Crypto Payments in Belize City, Belize | PortalPay',
    metaDescription:
      'QR ticketing and instant settlement for coastal services, markets, and cafés.',
    localContext:
      'Coastal SMEs and markets leverage QR tickets, split payouts, and offline-first receipts.',
    popularIndustries: [
      'small-ferry-operators',
      'market-stall-vendors',
      'internet-cafes',
      'mobile-phone-repair',
      'street-food-vendors',
    ],
    population: 61000,
    businessCount: 9000,
  },
  'ibadan-nigeria': {
    slug: 'ibadan-nigeria',
    name: 'Ibadan',
    city: 'Ibadan',
    country: 'Nigeria',
    title: 'Crypto Payments in Ibadan, Nigeria | PortalPay',
    metaDescription:
      'Instant-settlement QR payments for markets, cafés, and repair hubs in Ibadan.',
    localContext:
      'Traditional markets and service corridors adopt QR receipts, split payouts, and offline-first operations.',
    popularIndustries: [
      'market-stall-vendors',
      'street-food-vendors',
      'mobile-phone-repair',
      'internet-cafes',
      'community-radio-stations',
    ],
    population: 3500000,
    businessCount: 260000,
  },

  'benin-city-nigeria': {
    slug: 'benin-city-nigeria',
    name: 'Benin City',
    city: 'Benin City',
    country: 'Nigeria',
    title: 'Crypto Payments in Benin City, Nigeria | PortalPay',
    metaDescription:
      'Low-fee QR payments for markets, cafés, and repair hubs in Benin City.',
    localContext:
      'Artisan vendors and electronics repair adopt QR receipts, split payouts, and inventory tagging.',
    popularIndustries: [
      'artisan-potters',
      'mobile-phone-repair',
      'internet-cafes',
      'market-stall-vendors',
      'street-food-vendors',
    ],
    population: 1700000,
    businessCount: 140000,
  },

  'aba-nigeria': {
    slug: 'aba-nigeria',
    name: 'Aba',
    city: 'Aba',
    country: 'Nigeria',
    title: 'Crypto Payments in Aba, Nigeria | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for hardware, markets, and repair hubs.',
    localContext:
      'Manufacturing SMEs and markets benefit from QR receipts, inventory tags, and split payouts.',
    popularIndustries: [
      'hardware-shops',
      'market-stall-vendors',
      'mobile-phone-repair',
      'internet-cafes',
      'street-food-vendors',
    ],
    population: 1200000,
    businessCount: 110000,
  },

  'onitsha-nigeria': {
    slug: 'onitsha-nigeria',
    name: 'Onitsha',
    city: 'Onitsha',
    country: 'Nigeria',
    title: 'Crypto Payments in Onitsha, Nigeria | PortalPay',
    metaDescription:
      'Instant-settlement QR payments for market vendors, cafés, and repair kiosks.',
    localContext:
      'One of West Africa’s busiest markets adopts QR receipts, split payouts, and offline-first support.',
    popularIndustries: [
      'market-stall-vendors',
      'street-food-vendors',
      'mobile-phone-repair',
      'internet-cafes',
      'community-radio-stations',
    ],
    population: 1200000,
    businessCount: 150000,
  },

  'eldoret-kenya': {
    slug: 'eldoret-kenya',
    name: 'Eldoret',
    city: 'Eldoret',
    country: 'Kenya',
    title: 'Crypto Payments in Eldoret, Kenya | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for markets, cafés, and repair hubs.',
    localContext:
      'Agri-trade corridors and urban markets leverage split payouts, QR receipts, and offline-first operations.',
    popularIndustries: [
      'market-stall-vendors',
      'internet-cafes',
      'mobile-phone-repair',
      'cafes',
      'village-savings-groups',
    ],
    population: 475000,
    businessCount: 65000,
  },

  'gulu-uganda': {
    slug: 'gulu-uganda',
    name: 'Gulu',
    city: 'Gulu',
    country: 'Uganda',
    title: 'Crypto Payments in Gulu, Uganda | PortalPay',
    metaDescription:
      'Instant-settlement QR payments for markets, cafés, and repair kiosks.',
    localContext:
      'Regional trade and services adopt QR receipts, split payouts, and community radio outreach.',
    popularIndustries: [
      'market-stall-vendors',
      'internet-cafes',
      'mobile-phone-repair',
      'village-savings-groups',
      'community-radio-stations',
    ],
    population: 150000,
    businessCount: 24000,
  },

  'mwanza-tanzania': {
    slug: 'mwanza-tanzania',
    name: 'Mwanza',
    city: 'Mwanza',
    country: 'Tanzania',
    title: 'Crypto Payments in Mwanza, Tanzania | PortalPay',
    metaDescription:
      'QR ticketing and instant settlement for lake ferries, markets, and cafés.',
    localContext:
      'Lake Victoria transport and markets benefit from QR tickets, receipts, and split payouts.',
    popularIndustries: [
      'small-ferry-operators',
      'market-stall-vendors',
      'internet-cafes',
      'mobile-phone-repair',
      'village-savings-groups',
    ],
    population: 1200000,
    businessCount: 100000,
  },

  'ndola-zambia': {
    slug: 'ndola-zambia',
    name: 'Ndola',
    city: 'Ndola',
    country: 'Zambia',
    title: 'Crypto Payments in Ndola, Zambia | PortalPay',
    metaDescription:
      'Instant-settlement QR payments for hardware, markets, and cafés.',
    localContext:
      'Copperbelt SMEs adopt QR receipts, inventory tagging, and split payouts for transparency.',
    popularIndustries: [
      'hardware-shops',
      'internet-cafes',
      'mobile-phone-repair',
      'village-savings-groups',
      'community-radio-stations',
    ],
    population: 575000,
    businessCount: 75000,
  },

  'bulawayo-zimbabwe': {
    slug: 'bulawayo-zimbabwe',
    name: 'Bulawayo',
    city: 'Bulawayo',
    country: 'Zimbabwe',
    title: 'Crypto Payments in Bulawayo, Zimbabwe | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for artisan vendors, cafés, and repair hubs.',
    localContext:
      'Industrial and craft SMEs leverage QR receipts, split payouts, and offline-first reliability.',
    popularIndustries: [
      'artisan-potters',
      'bakeries',
      'internet-cafes',
      'mobile-phone-repair',
      'village-savings-groups',
    ],
    population: 700000,
    businessCount: 90000,
  },

  'pretoria-south-africa': {
    slug: 'pretoria-south-africa',
    name: 'Pretoria',
    city: 'Pretoria',
    country: 'South Africa',
    title: 'Crypto Payments in Pretoria, South Africa | PortalPay',
    metaDescription:
      'Instant-settlement QR payments for cafés, repair hubs, and retail corridors.',
    localContext:
      'Administrative districts and SMEs adopt split payouts, QR receipts, and offline-first support.',
    popularIndustries: [
      'cafes',
      'internet-cafes',
      'mobile-phone-repair',
      'hardware-shops',
      'community-radio-stations',
    ],
    population: 2500000,
    businessCount: 320000,
  },

  'gqeberha-south-africa': {
    slug: 'gqeberha-south-africa',
    name: 'Gqeberha',
    city: 'Gqeberha',
    country: 'South Africa',
    title: 'Crypto Payments in Gqeberha, South Africa | PortalPay',
    metaDescription:
      'QR ticketing and instant settlement for coastal services, cafés, and repair hubs.',
    localContext:
      'Port-city SMEs leverage QR tickets, split payouts, and offline-first receipts.',
    popularIndustries: [
      'small-ferry-operators',
      'cafes',
      'internet-cafes',
      'mobile-phone-repair',
      'artisan-potters',
    ],
    population: 1200000,
    businessCount: 150000,
  },

  'bloemfontein-south-africa': {
    slug: 'bloemfontein-south-africa',
    name: 'Bloemfontein',
    city: 'Bloemfontein',
    country: 'South Africa',
    title: 'Crypto Payments in Bloemfontein, South Africa | PortalPay',
    metaDescription:
      'Instant-settlement QR payments for cafés, repair hubs, and artisan vendors.',
    localContext:
      'Student and civic districts adopt QR receipts, inventory tagging, and split payouts.',
    popularIndustries: [
      'cafes',
      'bakeries',
      'internet-cafes',
      'mobile-phone-repair',
      'community-radio-stations',
    ],
    population: 520000,
    businessCount: 80000,
  },

  'lucknow-india': {
    slug: 'lucknow-india',
    name: 'Lucknow',
    city: 'Lucknow',
    country: 'India',
    title: 'Crypto Payments in Lucknow, India | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for markets, cafés, and repair hubs.',
    localContext:
      'Bazaars and cafés leverage QR receipts, split payouts, and offline-first operations.',
    popularIndustries: [
      'market-stall-vendors',
      'cafes',
      'internet-cafes',
      'mobile-phone-repair',
      'community-radio-stations',
    ],
    population: 3400000,
    businessCount: 450000,
  },

  'kanpur-india': {
    slug: 'kanpur-india',
    name: 'Kanpur',
    city: 'Kanpur',
    country: 'India',
    title: 'Crypto Payments in Kanpur, India | PortalPay',
    metaDescription:
      'Instant-settlement QR payments for hardware, markets, and cafés.',
    localContext:
      'Industrial corridors adopt QR receipts, inventory tagging, and split payouts.',
    popularIndustries: [
      'hardware-shops',
      'market-stall-vendors',
      'mobile-phone-repair',
      'internet-cafes',
      'street-food-vendors',
    ],
    population: 3200000,
    businessCount: 420000,
  },

  'indore-india': {
    slug: 'indore-india',
    name: 'Indore',
    city: 'Indore',
    country: 'India',
    title: 'Crypto Payments in Indore, India | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for cafés, markets, and repair hubs.',
    localContext:
      'Clean city corridors and night markets leverage QR receipts, split payouts, and offline-first.',
    popularIndustries: [
      'cafes',
      'bakeries',
      'internet-cafes',
      'mobile-phone-repair',
      'market-stall-vendors',
    ],
    population: 3000000,
    businessCount: 390000,
  },

  'nagpur-india': {
    slug: 'nagpur-india',
    name: 'Nagpur',
    city: 'Nagpur',
    country: 'India',
    title: 'Crypto Payments in Nagpur, India | PortalPay',
    metaDescription:
      'Instant-settlement QR payments for hardware, markets, and cafés.',
    localContext:
      'Logistics and orange-market SMEs adopt QR receipts, inventory tags, and split payouts.',
    popularIndustries: [
      'hardware-shops',
      'market-stall-vendors',
      'internet-cafes',
      'mobile-phone-repair',
      'cafes',
    ],
    population: 2400000,
    businessCount: 310000,
  },

  'coimbatore-india': {
    slug: 'coimbatore-india',
    name: 'Coimbatore',
    city: 'Coimbatore',
    country: 'India',
    title: 'Crypto Payments in Coimbatore, India | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for cafés, repair hubs, and hardware.',
    localContext:
      'Textile and hardware SMEs leverage split payouts, QR receipts, and offline-first operations.',
    popularIndustries: [
      'cafes',
      'internet-cafes',
      'mobile-phone-repair',
      'hardware-shops',
      'village-savings-groups',
    ],
    population: 2100000,
    businessCount: 280000,
  },

  'kochi-india': {
    slug: 'kochi-india',
    name: 'Kochi',
    city: 'Kochi',
    country: 'India',
    title: 'Crypto Payments in Kochi, India | PortalPay',
    metaDescription:
      'QR ticketing and instant settlement for backwater ferries, cafés, and repair hubs.',
    localContext:
      'Coastal ferries and markets adopt QR tickets, split payouts, and offline-first receipts.',
    popularIndustries: [
      'small-ferry-operators',
      'cafes',
      'internet-cafes',
      'mobile-phone-repair',
      'artisan-potters',
    ],
    population: 2200000,
    businessCount: 300000,
  },

  'visakhapatnam-india': {
    slug: 'visakhapatnam-india',
    name: 'Visakhapatnam',
    city: 'Visakhapatnam',
    country: 'India',
    title: 'Crypto Payments in Visakhapatnam, India | PortalPay',
    metaDescription:
      'Instant-settlement QR payments for ports, cafés, and repair hubs.',
    localContext:
      'Port SMEs leverage QR receipts, inventory tagging, and split payouts.',
    popularIndustries: [
      'small-ferry-operators',
      'internet-cafes',
      'mobile-phone-repair',
      'cafes',
      'street-food-vendors',
    ],
    population: 2100000,
    businessCount: 260000,
  },

  'khulna-bangladesh': {
    slug: 'khulna-bangladesh',
    name: 'Khulna',
    city: 'Khulna',
    country: 'Bangladesh',
    title: 'Crypto Payments in Khulna, Bangladesh | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for markets, cafés, and repair hubs.',
    localContext:
      'Southwest corridor SMEs adopt QR receipts, split payouts, and offline-first support.',
    popularIndustries: [
      'market-stall-vendors',
      'internet-cafes',
      'mobile-phone-repair',
      'community-radio-stations',
      'village-savings-groups',
    ],
    population: 1500000,
    businessCount: 130000,
  },

  'can-tho-vietnam': {
    slug: 'can-tho-vietnam',
    name: 'Cần Thơ',
    city: 'Cần Thơ',
    country: 'Vietnam',
    title: 'Crypto Payments in Cần Thơ, Vietnam | PortalPay',
    metaDescription:
      'QR ticketing and instant settlement for Mekong ferries, cafés, and repair hubs.',
    localContext:
      'Delta SMEs adopt QR tickets, split payouts, and offline-first receipts.',
    popularIndustries: [
      'small-ferry-operators',
      'cafes',
      'internet-cafes',
      'mobile-phone-repair',
      'market-stall-vendors',
    ],
    population: 1200000,
    businessCount: 100000,
  },

  'hai-phong-vietnam': {
    slug: 'hai-phong-vietnam',
    name: 'Hải Phòng',
    city: 'Hải Phòng',
    country: 'Vietnam',
    title: 'Crypto Payments in Hải Phòng, Vietnam | PortalPay',
    metaDescription:
      'Instant-settlement QR payments for ports, cafés, and repair hubs.',
    localContext:
      'Port-city SMEs leverage QR receipts, inventory tags, and split payouts.',
    popularIndustries: [
      'small-ferry-operators',
      'hardware-shops',
      'internet-cafes',
      'mobile-phone-repair',
      'cafes',
    ],
    population: 2100000,
    businessCount: 170000,
  },

  'iloilo-city-philippines': {
    slug: 'iloilo-city-philippines',
    name: 'Iloilo City',
    city: 'Iloilo City',
    country: 'Philippines',
    title: 'Crypto Payments in Iloilo City, Philippines | PortalPay',
    metaDescription:
      'QR ticketing and instant settlement for ferries, sari-sari stores, and repair hubs.',
    localContext:
      'Iloilo’s port and neighborhoods adopt QR receipts, split payouts, and offline-first operations.',
    popularIndustries: [
      'small-ferry-operators',
      'sari-sari-stores',
      'internet-cafes',
      'mobile-phone-repair',
      'cafes',
    ],
    population: 460000,
    businessCount: 60000,
  },

  'cagayan-de-oro-philippines': {
    slug: 'cagayan-de-oro-philippines',
    name: 'Cagayan de Oro',
    city: 'Cagayan de Oro',
    country: 'Philippines',
    title: 'Crypto Payments in Cagayan de Oro, Philippines | PortalPay',
    metaDescription:
      'Instant-settlement QR payments for ferries, markets, and cafés.',
    localContext:
      'Northern Mindanao SMEs adopt QR tickets, receipts, and split payouts.',
    popularIndustries: [
      'small-ferry-operators',
      'market-stall-vendors',
      'internet-cafes',
      'mobile-phone-repair',
      'cafes',
    ],
    population: 800000,
    businessCount: 90000,
  },

  'semarang-indonesia': {
    slug: 'semarang-indonesia',
    name: 'Semarang',
    city: 'Semarang',
    country: 'Indonesia',
    title: 'Crypto Payments in Semarang, Indonesia | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for ports, cafés, and repair hubs.',
    localContext:
      'Javanese port SMEs leverage split payouts, QR receipts, and offline-first operations.',
    popularIndustries: [
      'small-ferry-operators',
      'internet-cafes',
      'mobile-phone-repair',
      'cafes',
      'market-stall-vendors',
    ],
    population: 1700000,
    businessCount: 140000,
  },

  'palembang-indonesia': {
    slug: 'palembang-indonesia',
    name: 'Palembang',
    city: 'Palembang',
    country: 'Indonesia',
    title: 'Crypto Payments in Palembang, Indonesia | PortalPay',
    metaDescription:
      'Instant-settlement QR payments for river ferries, markets, and cafés.',
    localContext:
      'Musi River SMEs adopt QR tickets, split payouts, and offline-first receipts.',
    popularIndustries: [
      'small-ferry-operators',
      'market-stall-vendors',
      'internet-cafes',
      'mobile-phone-repair',
      'cafes',
    ],
    population: 1800000,
    businessCount: 150000,
  },

  'balikpapan-indonesia': {
    slug: 'balikpapan-indonesia',
    name: 'Balikpapan',
    city: 'Balikpapan',
    country: 'Indonesia',
    title: 'Crypto Payments in Balikpapan, Indonesia | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for ports, cafés, and repair hubs.',
    localContext:
      'Port and logistics SMEs leverage QR receipts, split payouts, and inventory tagging.',
    popularIndustries: [
      'internet-cafes',
      'mobile-phone-repair',
      'small-ferry-operators',
      'cafes',
      'hardware-shops',
    ],
    population: 700000,
    businessCount: 90000,
  },

  'merida-mexico': {
    slug: 'merida-mexico',
    name: 'Mérida',
    city: 'Mérida',
    country: 'Mexico',
    title: 'Crypto Payments in Mérida, Mexico | PortalPay',
    metaDescription:
      'Instant-settlement QR payments for artisan vendors, cafés, and repair hubs.',
    localContext:
      'Historic center SMEs adopt QR receipts, inventory tags, and split payouts.',
    popularIndustries: [
      'artisan-potters',
      'cafes',
      'internet-cafes',
      'mobile-phone-repair',
      'street-food-vendors',
    ],
    population: 1200000,
    businessCount: 180000,
  },

  'oaxaca-mexico': {
    slug: 'oaxaca-mexico',
    name: 'Oaxaca',
    city: 'Oaxaca',
    country: 'Mexico',
    title: 'Crypto Payments in Oaxaca, Mexico | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for artisan markets, cafés, and repair hubs.',
    localContext:
      'Oaxaca’s craft bazaars leverage QR receipts, split payouts, and offline-first reliability.',
    popularIndustries: [
      'artisan-potters',
      'market-stall-vendors',
      'cafes',
      'internet-cafes',
      'mobile-phone-repair',
    ],
    population: 720000,
    businessCount: 110000,
  },

  'cusco-peru': {
    slug: 'cusco-peru',
    name: 'Cusco',
    city: 'Cusco',
    country: 'Peru',
    title: 'Crypto Payments in Cusco, Peru | PortalPay',
    metaDescription:
      'Instant-settlement QR payments for tours, artisan vendors, and cafés.',
    localContext:
      'Tour operators and artisan vendors adopt QR receipts, inventory tags, and split payouts.',
    popularIndustries: [
      'cryptid-tour-operators',
      'artisan-potters',
      'cafes',
      'internet-cafes',
      'mobile-phone-repair',
    ],
    population: 430000,
    businessCount: 80000,
  },

  'el-alto-bolivia': {
    slug: 'el-alto-bolivia',
    name: 'El Alto',
    city: 'El Alto',
    country: 'Bolivia',
    title: 'Crypto Payments in El Alto, Bolivia | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for high-altitude markets, cafés, and repair hubs.',
    localContext:
      'Mesa markets and SMEs leverage split payouts, QR receipts, and offline-first support.',
    popularIndustries: [
      'market-stall-vendors',
      'street-food-vendors',
      'internet-cafes',
      'mobile-phone-repair',
      'artisan-potters',
    ],
    population: 950000,
    businessCount: 120000,
  },

  'antofagasta-chile': {
    slug: 'antofagasta-chile',
    name: 'Antofagasta',
    city: 'Antofagasta',
    country: 'Chile',
    title: 'Crypto Payments in Antofagasta, Chile | PortalPay',
    metaDescription:
      'Instant-settlement QR payments for ports, cafés, and repair hubs.',
    localContext:
      'Mining-adjacent SMEs use QR receipts, inventory tags, and split payouts.',
    popularIndustries: [
      'hardware-shops',
      'internet-cafes',
      'mobile-phone-repair',
      'cafes',
      'small-ferry-operators',
    ],
    population: 400000,
    businessCount: 60000,
  },

  'batumi-georgia': {
    slug: 'batumi-georgia',
    name: 'Batumi',
    city: 'Batumi',
    country: 'Georgia',
    title: 'Crypto Payments in Batumi, Georgia | PortalPay',
    metaDescription:
      'QR ticketing and instant settlement for coastal services, cafés, and repair hubs.',
    localContext:
      'Seaside SMEs adopt QR tickets, split payouts, and offline-first receipts.',
    popularIndustries: [
      'small-ferry-operators',
      'cafes',
      'internet-cafes',
      'mobile-phone-repair',
      'artisan-potters',
    ],
    population: 170000,
    businessCount: 25000,
  },

  'lviv-ukraine': {
    slug: 'lviv-ukraine',
    name: 'Lviv',
    city: 'Lviv',
    country: 'Ukraine',
    title: 'Crypto Payments in Lviv, Ukraine | PortalPay',
    metaDescription:
      'Instant-settlement QR payments for cafés, artisan vendors, and repair hubs.',
    localContext:
      'Cafe culture and artisan vendors leverage QR receipts, split payouts, and offline-first reliability.',
    popularIndustries: [
      'cafes',
      'artisan-potters',
      'internet-cafes',
      'mobile-phone-repair',
      'community-radio-stations',
    ],
    population: 720000,
    businessCount: 110000,
  },

  'tangier-morocco': {
    slug: 'tangier-morocco',
    name: 'Tangier',
    city: 'Tangier',
    country: 'Morocco',
    title: 'Crypto Payments in Tangier, Morocco | PortalPay',
    metaDescription:
      'QR ticketing and instant settlement for coastal services, cafés, and artisan vendors.',
    localContext:
      'Port and tourism SMEs adopt QR tickets, split payouts, and offline-first receipts.',
    popularIndustries: [
      'small-ferry-operators',
      'cafes',
      'internet-cafes',
      'mobile-phone-repair',
      'artisan-potters',
    ],
    population: 1100000,
    businessCount: 150000,
  },

  'oran-algeria': {
    slug: 'oran-algeria',
    name: 'Oran',
    city: 'Oran',
    country: 'Algeria',
    title: 'Crypto Payments in Oran, Algeria | PortalPay',
    metaDescription:
      'Instant-settlement QR payments for ports, cafés, and repair hubs.',
    localContext:
      'Coastal SMEs use QR receipts, inventory tagging, and split payouts.',
    popularIndustries: [
      'small-ferry-operators',
      'internet-cafes',
      'mobile-phone-repair',
      'cafes',
      'hardware-shops',
    ],
    population: 1600000,
    businessCount: 180000,
  },

  'sfax-tunisia': {
    slug: 'sfax-tunisia',
    name: 'Sfax',
    city: 'Sfax',
    country: 'Tunisia',
    title: 'Crypto Payments in Sfax, Tunisia | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for markets, cafés, and repair hubs.',
    localContext:
      'Industrial and market SMEs adopt QR receipts, split payouts, and offline-first support.',
    popularIndustries: [
      'market-stall-vendors',
      'internet-cafes',
      'mobile-phone-repair',
      'cafes',
      'community-radio-stations',
    ],
    population: 900000,
    businessCount: 120000,
  },

  // North America - Developed Countries
  'new-york-usa': {
    slug: 'new-york-usa',
    name: 'New York',
    city: 'New York',
    country: 'United States',
    title: 'Crypto Payments in New York, USA | PortalPay',
    metaDescription:
      'Ultra-low fees for NYC cafés, repair shops, and artisan vendors with instant settlement.',
    localContext:
      'Five boroughs of SMEs adopt QR receipts, split payouts for staff, and transparent inventory management.',
    popularIndustries: [
      'cafes',
      'mobile-phone-repair',
      'artisan-potters',
      'hardware-shops',
      'bakeries',
    ],
    population: 8300000,
    businessCount: 950000,
  },

  'los-angeles-usa': {
    slug: 'los-angeles-usa',
    name: 'Los Angeles',
    city: 'Los Angeles',
    country: 'United States',
    title: 'Crypto Payments in Los Angeles, USA | PortalPay',
    metaDescription:
      'Save on payment fees for LA cafés, repair shops, and street vendors with instant crypto settlement.',
    localContext:
      "From food trucks to repair kiosks, LA's diverse SMEs benefit from split payouts, QR receipts, and offline-first operations.",
    popularIndustries: [
      'street-food-vendors',
      'cafes',
      'mobile-phone-repair',
      'artisan-potters',
      'hardware-shops',
    ],
    population: 3900000,
    businessCount: 700000,
  },

  'chicago-usa': {
    slug: 'chicago-usa',
    name: 'Chicago',
    city: 'Chicago',
    country: 'United States',
    title: 'Crypto Payments in Chicago, USA | PortalPay',
    metaDescription:
      'Low-fee crypto payments for Chicago cafés, repair shops, and neighborhood stores.',
    localContext:
      'Neighborhoods across Chicago adopt QR receipts, split payouts, and instant settlement for daily operations.',
    popularIndustries: [
      'cafes',
      'bakeries',
      'mobile-phone-repair',
      'hardware-shops',
      'street-food-vendors',
    ],
    population: 2700000,
    businessCount: 450000,
  },

  'houston-usa': {
    slug: 'houston-usa',
    name: 'Houston',
    city: 'Houston',
    country: 'United States',
    title: 'Crypto Payments in Houston, USA | PortalPay',
    metaDescription:
      'Instant settlement and QR receipts for Houston cafés, repair shops, and retail.',
    localContext:
      'Energy corridor SMEs and diverse neighborhoods benefit from transparent QR receipts and split payouts.',
    popularIndustries: [
      'cafes',
      'mobile-phone-repair',
      'hardware-shops',
      'bakeries',
      'street-food-vendors',
    ],
    population: 2300000,
    businessCount: 380000,
  },

  'toronto-canada': {
    slug: 'toronto-canada',
    name: 'Toronto',
    city: 'Toronto',
    country: 'Canada',
    title: 'Crypto Payments in Toronto, Canada | PortalPay',
    metaDescription:
      'Low-fee crypto payments for Toronto cafés, repair shops, and neighborhood stores.',
    localContext:
      'Multicultural neighborhoods and dense SME corridors leverage QR receipts, split payouts, and instant settlement.',
    popularIndustries: [
      'cafes',
      'mobile-phone-repair',
      'bakeries',
      'hardware-shops',
      'artisan-potters',
    ],
    population: 2900000,
    businessCount: 450000,
  },

  'vancouver-canada': {
    slug: 'vancouver-canada',
    name: 'Vancouver',
    city: 'Vancouver',
    country: 'Canada',
    title: 'Crypto Payments in Vancouver, Canada | PortalPay',
    metaDescription:
      'Instant settlement and QR receipts for Vancouver cafés, repair shops, and coastal services.',
    localContext:
      'Waterfront SMEs and tech-forward neighborhoods adopt split payouts, QR receipts, and offline-first support.',
    popularIndustries: [
      'cafes',
      'mobile-phone-repair',
      'small-ferry-operators',
      'artisan-potters',
      'bakeries',
    ],
    population: 630000,
    businessCount: 120000,
  },

  'montreal-canada': {
    slug: 'montreal-canada',
    name: 'Montreal',
    city: 'Montreal',
    country: 'Canada',
    title: 'Crypto Payments in Montreal, Canada | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for Montreal cafés, bakeries, and repair shops.',
    localContext:
      'Bilingual neighborhoods and café culture benefit from split payouts, transparent receipts, and offline-first operations.',
    popularIndustries: [
      'cafes',
      'bakeries',
      'mobile-phone-repair',
      'artisan-potters',
      'hardware-shops',
    ],
    population: 1700000,
    businessCount: 280000,
  },

  // North America - USA (Additional)
  'san-francisco-usa': {
    slug: 'san-francisco-usa',
    name: 'San Francisco',
    city: 'San Francisco',
    country: 'United States',
    title: 'Crypto Payments in San Francisco, USA | PortalPay',
    metaDescription:
      'Instant settlement and low-fee crypto payments for SF cafés, repair shops, and startups.',
    localContext:
      'From SoMa startups to Mission cafés, SMEs adopt QR receipts, split payouts, and offline-first reliability.',
    popularIndustries: [
      'cafes',
      'mobile-phone-repair',
      'freelancers',
      'cannabis-dispensaries',
      'bakeries',
    ],
    population: 815000,
    businessCount: 120000,
  },
  'san-diego-usa': {
    slug: 'san-diego-usa',
    name: 'San Diego',
    city: 'San Diego',
    country: 'United States',
    title: 'Crypto Payments in San Diego, USA | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for coastal cafés, repair shops, and food trucks.',
    localContext:
      'Beachfront vendors and neighborhood cafés leverage QR receipts, split payouts, and offline-first operations.',
    popularIndustries: [
      'cafes',
      'food-trucks',
      'mobile-phone-repair',
      'bakeries',
      'hardware-shops',
    ],
    population: 1400000,
    businessCount: 190000,
  },
  'san-jose-usa': {
    slug: 'san-jose-usa',
    name: 'San Jose',
    city: 'San Jose',
    country: 'United States',
    title: 'Crypto Payments in San Jose, USA | PortalPay',
    metaDescription:
      'Low-fee crypto payments for Silicon Valley cafés, repair hubs, and freelancers.',
    localContext:
      'Tech corridors adopt QR receipts for pop-ups, labs, and cafés with split payouts for attendants.',
    popularIndustries: [
      'freelancers',
      'cafes',
      'mobile-phone-repair',
      'bakeries',
      'cleaning-services',
    ],
    population: 1000000,
    businessCount: 160000,
  },
  'seattle-usa': {
    slug: 'seattle-usa',
    name: 'Seattle',
    city: 'Seattle',
    country: 'United States',
    title: 'Crypto Payments in Seattle, USA | PortalPay',
    metaDescription:
      'Instant settlement and QR receipts for café culture, ferries, and repair hubs.',
    localContext:
      'Puget Sound ferries, cafés, and repair districts adopt QR tickets, split payouts, and offline-first operations.',
    popularIndustries: [
      'cafes',
      'small-ferry-operators',
      'mobile-phone-repair',
      'cannabis-dispensaries',
      'bakeries',
    ],
    population: 760000,
    businessCount: 120000,
  },
  'boston-usa': {
    slug: 'boston-usa',
    name: 'Boston',
    city: 'Boston',
    country: 'United States',
    title: 'Crypto Payments in Boston, USA | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for student cafés, bakeries, and repair shops.',
    localContext:
      'University corridors and harbor services leverage QR receipts, split payouts, and transparent inventory tagging.',
    popularIndustries: [
      'cafes',
      'bakeries',
      'mobile-phone-repair',
      'hardware-shops',
      'small-ferry-operators',
    ],
    population: 680000,
    businessCount: 110000,
  },
  'washington-dc-usa': {
    slug: 'washington-dc-usa',
    name: 'Washington, DC',
    city: 'Washington',
    country: 'United States',
    title: 'Crypto Payments in Washington, DC, USA | PortalPay',
    metaDescription:
      'Low-fee crypto payments for DC cafés, freelancers, and repair hubs with instant settlement.',
    localContext:
      'K Street to H Street SMEs adopt QR receipts, split payouts, and offline-first support for daily close.',
    popularIndustries: [
      'cafes',
      'freelancers',
      'mobile-phone-repair',
      'cleaning-services',
      'bakeries',
    ],
    population: 710000,
    businessCount: 115000,
  },
  'philadelphia-usa': {
    slug: 'philadelphia-usa',
    name: 'Philadelphia',
    city: 'Philadelphia',
    country: 'United States',
    title: 'Crypto Payments in Philadelphia, USA | PortalPay',
    metaDescription:
      'Instant-settlement QR payments for cafés, food trucks, and repair shops across Philly.',
    localContext:
      'Neighborhood corridors adopt QR receipts, split payouts, and transparent inventory tagging.',
    popularIndustries: [
      'cafes',
      'food-trucks',
      'mobile-phone-repair',
      'bakeries',
      'hardware-shops',
    ],
    population: 1600000,
    businessCount: 230000,
  },
  'phoenix-usa': {
    slug: 'phoenix-usa',
    name: 'Phoenix',
    city: 'Phoenix',
    country: 'United States',
    title: 'Crypto Payments in Phoenix, USA | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for auto repair, cafés, and contractors.',
    localContext:
      'Sunbelt SMEs adopt QR receipts, split payouts, and offline-first operations for predictable settlement.',
    popularIndustries: [
      'auto-repair',
      'cafes',
      'mobile-phone-repair',
      'plumbing-services',
      'hvac-services',
    ],
    population: 1700000,
    businessCount: 260000,
  },
  'san-antonio-usa': {
    slug: 'san-antonio-usa',
    name: 'San Antonio',
    city: 'San Antonio',
    country: 'United States',
    title: 'Crypto Payments in San Antonio, USA | PortalPay',
    metaDescription:
      'Instant settlement for cafés, bakeries, and home services across San Antonio.',
    localContext:
      'River Walk vendors and neighborhoods adopt QR receipts, split payouts, and offline-first mode.',
    popularIndustries: [
      'cafes',
      'bakeries',
      'mobile-phone-repair',
      'landscaping-services',
      'cleaning-services',
    ],
    population: 1600000,
    businessCount: 210000,
  },
  'dallas-usa': {
    slug: 'dallas-usa',
    name: 'Dallas',
    city: 'Dallas',
    country: 'United States',
    title: 'Crypto Payments in Dallas, USA | PortalPay',
    metaDescription:
      'Low-fee crypto payments for cafés, repair hubs, and blue-collar services.',
    localContext:
      'DFW SMEs leverage QR receipts, split payouts, and inventory tagging for transparent ops.',
    popularIndustries: [
      'cafes',
      'mobile-phone-repair',
      'electrical-contractors',
      'plumbing-services',
      'hvac-services',
    ],
    population: 1300000,
    businessCount: 300000,
  },
  'austin-usa': {
    slug: 'austin-usa',
    name: 'Austin',
    city: 'Austin',
    country: 'United States',
    title: 'Crypto Payments in Austin, USA | PortalPay',
    metaDescription:
      'Instant settlement for food trucks, cafés, and freelancers in Austin.',
    localContext:
      'Live music and tech scenes adopt QR receipts, split payouts, and offline-first operations.',
    popularIndustries: [
      'food-trucks',
      'freelancers',
      'cafes',
      'mobile-phone-repair',
      'bakeries',
    ],
    population: 980000,
    businessCount: 160000,
  },
  'miami-usa': {
    slug: 'miami-usa',
    name: 'Miami',
    city: 'Miami',
    country: 'United States',
    title: 'Crypto Payments in Miami, USA | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for cafés, travel, and repair hubs in Miami.',
    localContext:
      'Travel corridors and coastal SMEs adopt QR receipts, split payouts, and instant settlement.',
    popularIndustries: [
      'cafes',
      'travel-agencies',
      'ticket-brokers',
      'mobile-phone-repair',
      'bakeries',
    ],
    population: 450000,
    businessCount: 100000,
  },
  'orlando-usa': {
    slug: 'orlando-usa',
    name: 'Orlando',
    city: 'Orlando',
    country: 'United States',
    title: 'Crypto Payments in Orlando, USA | PortalPay',
    metaDescription:
      'Instant-settlement QR payments for tourism, cafés, and timeshares in Orlando.',
    localContext:
      'Hospitality and attractions leverage QR receipts, split payouts, and offline-first reliability.',
    popularIndustries: [
      'timeshares',
      'cafes',
      'travel-agencies',
      'ticket-brokers',
      'mobile-phone-repair',
    ],
    population: 310000,
    businessCount: 85000,
  },
  'tampa-usa': {
    slug: 'tampa-usa',
    name: 'Tampa',
    city: 'Tampa',
    country: 'United States',
    title: 'Crypto Payments in Tampa, USA | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for coastal services, cafés, and repair shops.',
    localContext:
      'Harbor SMEs adopt QR receipts, split payouts, and inventory tagging for transparent ops.',
    popularIndustries: [
      'cafes',
      'mobile-phone-repair',
      'small-ferry-operators',
      'bakeries',
      'hardware-shops',
    ],
    population: 400000,
    businessCount: 90000,
  },
  'atlanta-usa': {
    slug: 'atlanta-usa',
    name: 'Atlanta',
    city: 'Atlanta',
    country: 'United States',
    title: 'Crypto Payments in Atlanta, USA | PortalPay',
    metaDescription:
      'Instant settlement and QR receipts for cafés, contractors, and repair hubs.',
    localContext:
      'Metro SMEs adopt split payouts and offline-first workflows for daily settlement.',
    popularIndustries: [
      'cafes',
      'mobile-phone-repair',
      'general-contractors',
      'cleaning-services',
      'bakeries',
    ],
    population: 510000,
    businessCount: 140000,
  },
  'denver-usa': {
    slug: 'denver-usa',
    name: 'Denver',
    city: 'Denver',
    country: 'United States',
    title: 'Crypto Payments in Denver, USA | PortalPay',
    metaDescription:
      'Low-fee crypto payments for cafés, cannabis retailers, and repair hubs.',
    localContext:
      'Front Range SMEs leverage QR receipts, split payouts, and offline-first reliability.',
    popularIndustries: [
      'cannabis-dispensaries',
      'cafes',
      'mobile-phone-repair',
      'bakeries',
      'hardware-shops',
    ],
    population: 715000,
    businessCount: 120000,
  },
  'las-vegas-usa': {
    slug: 'las-vegas-usa',
    name: 'Las Vegas',
    city: 'Las Vegas',
    country: 'United States',
    title: 'Crypto Payments in Las Vegas, USA | PortalPay',
    metaDescription:
      'Instant settlement for casinos, nightlife, cafés, and repair hubs in Las Vegas.',
    localContext:
      'Strip and Downtown SMEs adopt QR receipts, split payouts, and offline-first operations.',
    popularIndustries: [
      'casinos-gambling',
      'adult-entertainment',
      'cafes',
      'mobile-phone-repair',
      'liquor-stores',
    ],
    population: 660000,
    businessCount: 180000,
  },
  'portland-usa': {
    slug: 'portland-usa',
    name: 'Portland',
    city: 'Portland',
    country: 'United States',
    title: 'Crypto Payments in Portland, USA | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for cafés, artisans, and repair shops.',
    localContext:
      'Maker culture and café corridors leverage split payouts, QR receipts, and offline-first mode.',
    popularIndustries: [
      'cafes',
      'artisan-potters',
      'mobile-phone-repair',
      'cannabis-dispensaries',
      'bakeries',
    ],
    population: 640000,
    businessCount: 100000,
  },
  'detroit-usa': {
    slug: 'detroit-usa',
    name: 'Detroit',
    city: 'Detroit',
    country: 'United States',
    title: 'Crypto Payments in Detroit, USA | PortalPay',
    metaDescription:
      'Instant settlement for auto repair, hardware, and cafés in Detroit.',
    localContext:
      'Manufacturing-adjacent SMEs adopt QR receipts, inventory tagging, and split payouts.',
    popularIndustries: [
      'auto-repair',
      'hardware-shops',
      'cafes',
      'mobile-phone-repair',
      'cleaning-services',
    ],
    population: 630000,
    businessCount: 90000,
  },
  'minneapolis-usa': {
    slug: 'minneapolis-usa',
    name: 'Minneapolis',
    city: 'Minneapolis',
    country: 'United States',
    title: 'Crypto Payments in Minneapolis, USA | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for cafés, bakeries, and contractors.',
    localContext:
      'Twin Cities SMEs leverage split payouts, QR receipts, and offline-first operations.',
    popularIndustries: [
      'cafes',
      'bakeries',
      'mobile-phone-repair',
      'plumbing-services',
      'hvac-services',
    ],
    population: 430000,
    businessCount: 80000,
  },
  'charlotte-usa': {
    slug: 'charlotte-usa',
    name: 'Charlotte',
    city: 'Charlotte',
    country: 'United States',
    title: 'Crypto Payments in Charlotte, USA | PortalPay',
    metaDescription:
      'Instant settlement for cafés, repair hubs, and home services in Charlotte.',
    localContext:
      'Financial district and neighborhoods adopt QR receipts, split payouts, and transparent operations.',
    popularIndustries: [
      'cafes',
      'mobile-phone-repair',
      'electrical-contractors',
      'cleaning-services',
      'bakeries',
    ],
    population: 900000,
    businessCount: 140000,
  },
  'raleigh-usa': {
    slug: 'raleigh-usa',
    name: 'Raleigh',
    city: 'Raleigh',
    country: 'United States',
    title: 'Crypto Payments in Raleigh, USA | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for research triangle cafés and repair shops.',
    localContext:
      'Tech and university SMEs adopt split payouts, QR receipts, and offline-first mode.',
    popularIndustries: [
      'freelancers',
      'cafes',
      'mobile-phone-repair',
      'bakeries',
      'cleaning-services',
    ],
    population: 480000,
    businessCount: 80000,
  },
  'nashville-usa': {
    slug: 'nashville-usa',
    name: 'Nashville',
    city: 'Nashville',
    country: 'United States',
    title: 'Crypto Payments in Nashville, USA | PortalPay',
    metaDescription:
      'Instant-settlement QR payments for cafés, music venues, and repair hubs.',
    localContext:
      'Music City SMEs leverage QR receipts, split payouts, and transparent inventory for merch.',
    popularIndustries: [
      'cafes',
      'street-musicians',
      'mobile-phone-repair',
      'bakeries',
      'hardware-shops',
    ],
    population: 700000,
    businessCount: 110000,
  },
  'new-orleans-usa': {
    slug: 'new-orleans-usa',
    name: 'New Orleans',
    city: 'New Orleans',
    country: 'United States',
    title: 'Crypto Payments in New Orleans, USA | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for tourism, cafés, and repair shops.',
    localContext:
      'French Quarter vendors and river services adopt QR receipts, split payouts, and offline-first support.',
    popularIndustries: [
      'cafes',
      'travel-agencies',
      'mobile-phone-repair',
      'bakeries',
      'small-ferry-operators',
    ],
    population: 380000,
    businessCount: 70000,
  },
  'pittsburgh-usa': {
    slug: 'pittsburgh-usa',
    name: 'Pittsburgh',
    city: 'Pittsburgh',
    country: 'United States',
    title: 'Crypto Payments in Pittsburgh, USA | PortalPay',
    metaDescription:
      'Instant settlement for cafés, bakeries, and hardware in Pittsburgh.',
    localContext:
      'Robotics row and neighborhood SMEs adopt QR receipts, split payouts, and inventory tagging.',
    popularIndustries: [
      'cafes',
      'bakeries',
      'hardware-shops',
      'mobile-phone-repair',
      'cleaning-services',
    ],
    population: 300000,
    businessCount: 60000,
  },
  'cleveland-usa': {
    slug: 'cleveland-usa',
    name: 'Cleveland',
    city: 'Cleveland',
    country: 'United States',
    title: 'Crypto Payments in Cleveland, USA | PortalPay',
    metaDescription:
      'Low-fee crypto payments for cafés, auto repair, and home services.',
    localContext:
      'Great Lakes SMEs leverage QR receipts, split payouts, and offline-first operations.',
    popularIndustries: [
      'auto-repair',
      'cafes',
      'mobile-phone-repair',
      'plumbing-services',
      'hvac-services',
    ],
    population: 370000,
    businessCount: 65000,
  },
  'columbus-usa': {
    slug: 'columbus-usa',
    name: 'Columbus',
    city: 'Columbus',
    country: 'United States',
    title: 'Crypto Payments in Columbus, USA | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for student cafés, bakeries, and repair hubs.',
    localContext:
      'Campus and downtown SMEs adopt split payouts and offline-first reliability.',
    popularIndustries: [
      'cafes',
      'bakeries',
      'mobile-phone-repair',
      'cleaning-services',
      'hardware-shops',
    ],
    population: 920000,
    businessCount: 120000,
  },
  'indianapolis-usa': {
    slug: 'indianapolis-usa',
    name: 'Indianapolis',
    city: 'Indianapolis',
    country: 'United States',
    title: 'Crypto Payments in Indianapolis, USA | PortalPay',
    metaDescription:
      'Instant settlement for cafés, contractors, and repair hubs.',
    localContext:
      'Circle City SMEs adopt QR receipts, split payouts, and transparent ops.',
    popularIndustries: [
      'general-contractors',
      'cafes',
      'mobile-phone-repair',
      'bakeries',
      'plumbing-services',
    ],
    population: 900000,
    businessCount: 130000,
  },
  'kansas-city-usa': {
    slug: 'kansas-city-usa',
    name: 'Kansas City',
    city: 'Kansas City',
    country: 'United States',
    title: 'Crypto Payments in Kansas City, USA | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for cafés, BBQ, and repair shops.',
    localContext:
      'Bi-state metro SMEs adopt split payouts, QR receipts, and offline-first mode.',
    popularIndustries: [
      'cafes',
      'restaurants',
      'mobile-phone-repair',
      'bakeries',
      'hardware-shops',
    ],
    population: 510000,
    businessCount: 80000,
  },
  'st-louis-usa': {
    slug: 'st-louis-usa',
    name: 'St. Louis',
    city: 'St. Louis',
    country: 'United States',
    title: 'Crypto Payments in St. Louis, USA | PortalPay',
    metaDescription:
      'Instant settlement for cafés, repair hubs, and home services.',
    localContext:
      'Gateway City SMEs leverage QR receipts, split payouts, and transparent inventory tagging.',
    popularIndustries: [
      'cafes',
      'mobile-phone-repair',
      'cleaning-services',
      'plumbing-services',
      'bakeries',
    ],
    population: 300000,
    businessCount: 55000,
  },
  'cincinnati-usa': {
    slug: 'cincinnati-usa',
    name: 'Cincinnati',
    city: 'Cincinnati',
    country: 'United States',
    title: 'Crypto Payments in Cincinnati, USA | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for cafés, bakeries, and repair shops.',
    localContext:
      'Riverfront SMEs adopt split payouts, QR receipts, and offline-first support.',
    popularIndustries: [
      'cafes',
      'bakeries',
      'mobile-phone-repair',
      'hardware-shops',
      'cleaning-services',
    ],
    population: 310000,
    businessCount: 60000,
  },
  'milwaukee-usa': {
    slug: 'milwaukee-usa',
    name: 'Milwaukee',
    city: 'Milwaukee',
    country: 'United States',
    title: 'Crypto Payments in Milwaukee, USA | PortalPay',
    metaDescription:
      'Instant settlement for cafés, bakeries, and repair hubs in Milwaukee.',
    localContext:
      'Lakefront SMEs adopt QR receipts, split payouts, and transparent operations.',
    popularIndustries: [
      'cafes',
      'bakeries',
      'mobile-phone-repair',
      'hardware-shops',
      'cleaning-services',
    ],
    population: 570000,
    businessCount: 80000,
  },
  'salt-lake-city-usa': {
    slug: 'salt-lake-city-usa',
    name: 'Salt Lake City',
    city: 'Salt Lake City',
    country: 'United States',
    title: 'Crypto Payments in Salt Lake City, USA | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for cafés, outdoor retail, and repair hubs.',
    localContext:
      'Wasatch Front SMEs adopt split payouts, QR receipts, and offline-first reliability.',
    popularIndustries: [
      'retail',
      'cafes',
      'mobile-phone-repair',
      'bakeries',
      'hardware-shops',
    ],
    population: 200000,
    businessCount: 40000,
  },
  'sacramento-usa': {
    slug: 'sacramento-usa',
    name: 'Sacramento',
    city: 'Sacramento',
    country: 'United States',
    title: 'Crypto Payments in Sacramento, USA | PortalPay',
    metaDescription:
      'Instant settlement for cafés, contractors, and repair shops.',
    localContext:
      'Capital corridor SMEs leverage QR receipts, split payouts, and inventory tagging.',
    popularIndustries: [
      'general-contractors',
      'cafes',
      'mobile-phone-repair',
      'bakeries',
      'plumbing-services',
    ],
    population: 530000,
    businessCount: 85000,
  },
  'baltimore-usa': {
    slug: 'baltimore-usa',
    name: 'Baltimore',
    city: 'Baltimore',
    country: 'United States',
    title: 'Crypto Payments in Baltimore, USA | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for harbor services, cafés, and repair hubs.',
    localContext:
      'Port SMEs adopt QR receipts, split payouts, and offline-first operations.',
    popularIndustries: [
      'small-ferry-operators',
      'cafes',
      'mobile-phone-repair',
      'bakeries',
      'hardware-shops',
    ],
    population: 570000,
    businessCount: 90000,
  },
  'jacksonville-usa': {
    slug: 'jacksonville-usa',
    name: 'Jacksonville',
    city: 'Jacksonville',
    country: 'United States',
    title: 'Crypto Payments in Jacksonville, USA | PortalPay',
    metaDescription:
      'Instant settlement for coastal services, cafés, and repair shops.',
    localContext:
      'River and coastal SMEs leverage QR receipts, split payouts, and transparent operations.',
    popularIndustries: [
      'cafes',
      'mobile-phone-repair',
      'small-ferry-operators',
      'bakeries',
      'hardware-shops',
    ],
    population: 960000,
    businessCount: 130000,
  },

  // North America - USA (Southwest Expansion)
  'albuquerque-usa': {
    slug: 'albuquerque-usa',
    name: 'Albuquerque',
    city: 'Albuquerque',
    country: 'United States',
    title: 'Crypto Payments in Albuquerque, USA | PortalPay',
    metaDescription:
      'Instant settlement for cafés, food trucks, and repair hubs across Albuquerque.',
    localContext:
      'Route 66 corridors and neighborhood markets adopt QR receipts, split payouts, and offline-first operations.',
    popularIndustries: [
      'cafes',
      'food-trucks',
      'mobile-phone-repair',
      'cannabis-dispensaries',
      'hardware-shops',
    ],
    population: 560000,
    businessCount: 85000,
  },
  'santa-fe-usa': {
    slug: 'santa-fe-usa',
    name: 'Santa Fe',
    city: 'Santa Fe',
    country: 'United States',
    title: 'Crypto Payments in Santa Fe, USA | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for artisan markets, cafés, and galleries.',
    localContext:
      'Historic plaza vendors and galleries leverage QR receipts, split payouts, and transparent inventory.',
    popularIndustries: [
      'cafes',
      'art-galleries',
      'artisan-potters',
      'mobile-phone-repair',
      'bakeries',
    ],
    population: 89000,
    businessCount: 14000,
  },
  'las-cruces-usa': {
    slug: 'las-cruces-usa',
    name: 'Las Cruces',
    city: 'Las Cruces',
    country: 'United States',
    title: 'Crypto Payments in Las Cruces, USA | PortalPay',
    metaDescription:
      'Instant settlement for markets, cafés, and repair hubs in Las Cruces.',
    localContext:
      'Borderland SMEs adopt QR receipts, split payouts, and offline-first reliability.',
    popularIndustries: [
      'cafes',
      'mobile-phone-repair',
      'auto-repair',
      'hardware-shops',
      'food-trucks',
    ],
    population: 110000,
    businessCount: 17000,
  },
  'rio-rancho-usa': {
    slug: 'rio-rancho-usa',
    name: 'Rio Rancho',
    city: 'Rio Rancho',
    country: 'United States',
    title: 'Crypto Payments in Rio Rancho, USA | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for cafés, contractors, and repair shops.',
    localContext:
      'Growing suburban corridors leverage split payouts, QR receipts, and inventory tagging.',
    popularIndustries: [
      'cafes',
      'mobile-phone-repair',
      'general-contractors',
      'cleaning-services',
      'hardware-shops',
    ],
    population: 106000,
    businessCount: 15000,
  },
  'tucson-usa': {
    slug: 'tucson-usa',
    name: 'Tucson',
    city: 'Tucson',
    country: 'United States',
    title: 'Crypto Payments in Tucson, USA | PortalPay',
    metaDescription:
      'Instant-settlement QR payments for cafés, food trucks, and repair hubs.',
    localContext:
      'University and desert SMEs adopt QR receipts, split payouts, and offline-first operations.',
    popularIndustries: [
      'cafes',
      'food-trucks',
      'mobile-phone-repair',
      'cannabis-dispensaries',
      'auto-repair',
    ],
    population: 540000,
    businessCount: 80000,
  },
  'mesa-usa': {
    slug: 'mesa-usa',
    name: 'Mesa',
    city: 'Mesa',
    country: 'United States',
    title: 'Crypto Payments in Mesa, USA | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for cafés, contractors, and repair hubs.',
    localContext:
      'East Valley SMEs leverage split payouts, transparent receipts, and offline-first mode.',
    popularIndustries: [
      'cafes',
      'mobile-phone-repair',
      'auto-repair',
      'hardware-shops',
      'cleaning-services',
    ],
    population: 500000,
    businessCount: 75000,
  },
  'scottsdale-usa': {
    slug: 'scottsdale-usa',
    name: 'Scottsdale',
    city: 'Scottsdale',
    country: 'United States',
    title: 'Crypto Payments in Scottsdale, USA | PortalPay',
    metaDescription:
      'Instant settlement for cafés, retail, and freelancers in Scottsdale.',
    localContext:
      'Old Town retail and hospitality adopt QR receipts, split payouts, and inventory tagging.',
    popularIndustries: [
      'cafes',
      'retail',
      'freelancers',
      'mobile-phone-repair',
      'travel-agencies',
    ],
    population: 250000,
    businessCount: 40000,
  },
  'tempe-usa': {
    slug: 'tempe-usa',
    name: 'Tempe',
    city: 'Tempe',
    country: 'United States',
    title: 'Crypto Payments in Tempe, USA | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for student cafés, food trucks, and repair hubs.',
    localContext:
      'Campus corridors and Mill Avenue vendors leverage split payouts, QR receipts, and offline-first support.',
    popularIndustries: [
      'cafes',
      'food-trucks',
      'mobile-phone-repair',
      'freelancers',
      'bakeries',
    ],
    population: 190000,
    businessCount: 30000,
  },
  'chandler-usa': {
    slug: 'chandler-usa',
    name: 'Chandler',
    city: 'Chandler',
    country: 'United States',
    title: 'Crypto Payments in Chandler, USA | PortalPay',
    metaDescription:
      'Instant settlement for cafés, repair hubs, and contractors.',
    localContext:
      'Southeast Valley SMEs adopt QR receipts, split payouts, and transparent operations.',
    popularIndustries: [
      'cafes',
      'mobile-phone-repair',
      'hardware-shops',
      'cleaning-services',
      'bakeries',
    ],
    population: 280000,
    businessCount: 45000,
  },
  'glendale-usa': {
    slug: 'glendale-usa',
    name: 'Glendale',
    city: 'Glendale',
    country: 'United States',
    title: 'Crypto Payments in Glendale, USA | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for cafés, auto repair, and home services.',
    localContext:
      'West Valley SMEs leverage split payouts, QR receipts, and offline-first reliability.',
    popularIndustries: [
      'cafes',
      'mobile-phone-repair',
      'auto-repair',
      'bakeries',
      'hardware-shops',
    ],
    population: 250000,
    businessCount: 40000,
  },
  'flagstaff-usa': {
    slug: 'flagstaff-usa',
    name: 'Flagstaff',
    city: 'Flagstaff',
    country: 'United States',
    title: 'Crypto Payments in Flagstaff, USA | PortalPay',
    metaDescription:
      'Instant settlement for tourism, cafés, and repair hubs in Flagstaff.',
    localContext:
      'Gateway to the Grand Canyon SMEs adopt QR receipts, split payouts, and transparent inventory.',
    popularIndustries: [
      'travel-agencies',
      'cafes',
      'mobile-phone-repair',
      'bakeries',
      'retail',
    ],
    population: 78000,
    businessCount: 12000,
  },
  'yuma-usa': {
    slug: 'yuma-usa',
    name: 'Yuma',
    city: 'Yuma',
    country: 'United States',
    title: 'Crypto Payments in Yuma, USA | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for cafés, auto repair, and street vendors.',
    localContext:
      'Border and agricultural SMEs leverage split payouts, QR receipts, and offline-first operations.',
    popularIndustries: [
      'cafes',
      'mobile-phone-repair',
      'auto-repair',
      'street-food-vendors',
      'hardware-shops',
    ],
    population: 100000,
    businessCount: 15000,
  },
  'el-paso-usa': {
    slug: 'el-paso-usa',
    name: 'El Paso',
    city: 'El Paso',
    country: 'United States',
    title: 'Crypto Payments in El Paso, USA | PortalPay',
    metaDescription:
      'Instant settlement for border retail, cafés, and repair hubs in El Paso.',
    localContext:
      'Binational trade corridors adopt QR receipts, split payouts, and offline-first reliability.',
    popularIndustries: [
      'retail',
      'cafes',
      'mobile-phone-repair',
      'hardware-shops',
      'street-food-vendors',
    ],
    population: 680000,
    businessCount: 100000,
  },
  'reno-usa': {
    slug: 'reno-usa',
    name: 'Reno',
    city: 'Reno',
    country: 'United States',
    title: 'Crypto Payments in Reno, USA | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for casinos, cafés, and repair hubs.',
    localContext:
      'Truckee Meadows SMEs leverage QR receipts, split payouts, and transparent operations.',
    popularIndustries: [
      'casinos-gambling',
      'cafes',
      'mobile-phone-repair',
      'liquor-stores',
      'bakeries',
    ],
    population: 270000,
    businessCount: 45000,
  },
  'henderson-usa': {
    slug: 'henderson-usa',
    name: 'Henderson',
    city: 'Henderson',
    country: 'United States',
    title: 'Crypto Payments in Henderson, USA | PortalPay',
    metaDescription:
      'Instant settlement for cafés, retail, and repair hubs in Henderson.',
    localContext:
      'Las Vegas Valley SMEs adopt split payouts, QR receipts, and inventory tagging.',
    popularIndustries: [
      'cafes',
      'retail',
      'mobile-phone-repair',
      'bakeries',
      'cleaning-services',
    ],
    population: 330000,
    businessCount: 50000,
  },
  'north-las-vegas-usa': {
    slug: 'north-las-vegas-usa',
    name: 'North Las Vegas',
    city: 'North Las Vegas',
    country: 'United States',
    title: 'Crypto Payments in North Las Vegas, USA | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for cafés, repair hubs, and home services.',
    localContext:
      'Industrial and residential corridors leverage split payouts, QR receipts, and offline-first mode.',
    popularIndustries: [
      'cafes',
      'mobile-phone-repair',
      'auto-repair',
      'liquor-stores',
      'bakeries',
    ],
    population: 260000,
    businessCount: 40000,
  },
  'provo-usa': {
    slug: 'provo-usa',
    name: 'Provo',
    city: 'Provo',
    country: 'United States',
    title: 'Crypto Payments in Provo, USA | PortalPay',
    metaDescription:
      'Instant settlement for cafés, bakeries, and freelancers in Provo.',
    localContext:
      'Silicon Slopes SMEs adopt QR receipts, split payouts, and transparent operations.',
    popularIndustries: [
      'cafes',
      'bakeries',
      'freelancers',
      'mobile-phone-repair',
      'hardware-shops',
    ],
    population: 120000,
    businessCount: 20000,
  },
  'ogden-usa': {
    slug: 'ogden-usa',
    name: 'Ogden',
    city: 'Ogden',
    country: 'United States',
    title: 'Crypto Payments in Ogden, USA | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for cafés, hardware, and repair hubs.',
    localContext:
      'Wasatch Front SMEs leverage split payouts, QR receipts, and offline-first workflows.',
    popularIndustries: [
      'cafes',
      'mobile-phone-repair',
      'hardware-shops',
      'auto-repair',
      'bakeries',
    ],
    population: 88000,
    businessCount: 14000,
  },
  'st-george-usa': {
    slug: 'st-george-usa',
    name: 'St. George',
    city: 'St. George',
    country: 'United States',
    title: 'Crypto Payments in St. George, USA | PortalPay',
    metaDescription:
      'Instant settlement for tourism, cafés, and repair hubs in St. George.',
    localContext:
      'Desert gateway SMEs adopt QR receipts, split payouts, and transparent inventory tagging.',
    popularIndustries: [
      'travel-agencies',
      'cafes',
      'mobile-phone-repair',
      'bakeries',
      'retail',
    ],
    population: 105000,
    businessCount: 16000,
  },
  'colorado-springs-usa': {
    slug: 'colorado-springs-usa',
    name: 'Colorado Springs',
    city: 'Colorado Springs',
    country: 'United States',
    title: 'Crypto Payments in Colorado Springs, USA | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for cafés, hardware, and repair hubs.',
    localContext:
      'Front Range SMEs leverage split payouts, QR receipts, and offline-first reliability.',
    popularIndustries: [
      'cafes',
      'mobile-phone-repair',
      'hardware-shops',
      'auto-repair',
      'bakeries',
    ],
    population: 490000,
    businessCount: 80000,
  },
  'fort-collins-usa': {
    slug: 'fort-collins-usa',
    name: 'Fort Collins',
    city: 'Fort Collins',
    country: 'United States',
    title: 'Crypto Payments in Fort Collins, USA | PortalPay',
    metaDescription:
      'Instant settlement for cafés, bakeries, and repair hubs in Fort Collins.',
    localContext:
      'University town SMEs adopt QR receipts, split payouts, and transparent operations.',
    popularIndustries: [
      'cafes',
      'bakeries',
      'mobile-phone-repair',
      'hardware-shops',
      'cleaning-services',
    ],
    population: 170000,
    businessCount: 26000,
  },
  'boulder-usa': {
    slug: 'boulder-usa',
    name: 'Boulder',
    city: 'Boulder',
    country: 'United States',
    title: 'Crypto Payments in Boulder, USA | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for cafés, galleries, and freelancers.',
    localContext:
      'Pearl Street vendors and studios leverage split payouts, QR receipts, and offline-first support.',
    popularIndustries: [
      'cafes',
      'art-galleries',
      'freelancers',
      'mobile-phone-repair',
      'bakeries',
    ],
    population: 110000,
    businessCount: 20000,
  },
  'amarillo-usa': {
    slug: 'amarillo-usa',
    name: 'Amarillo',
    city: 'Amarillo',
    country: 'United States',
    title: 'Crypto Payments in Amarillo, USA | PortalPay',
    metaDescription:
      'Instant settlement for cafés, auto repair, and hardware in Amarillo.',
    localContext:
      'Panhandle SMEs adopt QR receipts, split payouts, and offline-first mode.',
    popularIndustries: [
      'cafes',
      'mobile-phone-repair',
      'auto-repair',
      'hardware-shops',
      'street-food-vendors',
    ],
    population: 200000,
    businessCount: 30000,
  },
  'midland-usa': {
    slug: 'midland-usa',
    name: 'Midland',
    city: 'Midland',
    country: 'United States',
    title: 'Crypto Payments in Midland, USA | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for cafés, hardware, and repair hubs.',
    localContext:
      'Permian Basin SMEs leverage split payouts, QR receipts, and transparent inventory.',
    popularIndustries: [
      'cafes',
      'hardware-shops',
      'mobile-phone-repair',
      'auto-repair',
      'cleaning-services',
    ],
    population: 140000,
    businessCount: 22000,
  },
  'odessa-usa': {
    slug: 'odessa-usa',
    name: 'Odessa',
    city: 'Odessa',
    country: 'United States',
    title: 'Crypto Payments in Odessa, USA | PortalPay',
    metaDescription:
      'Instant settlement for cafés, hardware, and repair hubs in Odessa.',
    localContext:
      'Oilfield-adjacent SMEs adopt QR receipts, split payouts, and offline-first operations.',
    popularIndustries: [
      'cafes',
      'hardware-shops',
      'mobile-phone-repair',
      'auto-repair',
      'cleaning-services',
    ],
    population: 120000,
    businessCount: 19000,
  },
  'lubbock-usa': {
    slug: 'lubbock-usa',
    name: 'Lubbock',
    city: 'Lubbock',
    country: 'United States',
    title: 'Crypto Payments in Lubbock, USA | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for cafés, food trucks, and repair hubs.',
    localContext:
      'Hub City SMEs leverage split payouts, QR receipts, and transparent operations.',
    popularIndustries: [
      'cafes',
      'food-trucks',
      'mobile-phone-repair',
      'hardware-shops',
      'bakeries',
    ],
    population: 260000,
    businessCount: 40000,
  },
  'palm-springs-usa': {
    slug: 'palm-springs-usa',
    name: 'Palm Springs',
    city: 'Palm Springs',
    country: 'United States',
    title: 'Crypto Payments in Palm Springs, USA | PortalPay',
    metaDescription:
      'Instant settlement for tourism, cafés, and galleries in Palm Springs.',
    localContext:
      'Resort corridor SMEs adopt QR receipts, split payouts, and inventory tagging for boutiques.',
    popularIndustries: [
      'travel-agencies',
      'cafes',
      'art-galleries',
      'mobile-phone-repair',
      'bakeries',
    ],
    population: 45000,
    businessCount: 7000,
  },

  // Canada (Additional)
  'calgary-canada': {
    slug: 'calgary-canada',
    name: 'Calgary',
    city: 'Calgary',
    country: 'Canada',
    title: 'Crypto Payments in Calgary, Canada | PortalPay',
    metaDescription:
      'Instant settlement and QR receipts for cafés, repair hubs, and contractors in Calgary.',
    localContext:
      'Energy corridor SMEs adopt split payouts, QR receipts, and offline-first reliability.',
    popularIndustries: [
      'cafes',
      'mobile-phone-repair',
      'plumbing-services',
      'hvac-services',
      'cannabis-dispensaries',
    ],
    population: 1400000,
    businessCount: 180000,
  },
  'edmonton-canada': {
    slug: 'edmonton-canada',
    name: 'Edmonton',
    city: 'Edmonton',
    country: 'Canada',
    title: 'Crypto Payments in Edmonton, Canada | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for cafés, repair hubs, and home services.',
    localContext:
      'Prairie SMEs adopt split payouts, QR receipts, and transparent inventory tagging.',
    popularIndustries: [
      'cafes',
      'mobile-phone-repair',
      'plumbing-services',
      'cleaning-services',
      'cannabis-dispensaries',
    ],
    population: 1050000,
    businessCount: 140000,
  },
  'ottawa-canada': {
    slug: 'ottawa-canada',
    name: 'Ottawa',
    city: 'Ottawa',
    country: 'Canada',
    title: 'Crypto Payments in Ottawa, Canada | PortalPay',
    metaDescription:
      'Instant settlement for cafés, bakeries, and repair shops across Ottawa.',
    localContext:
      'Capital SMEs leverage QR receipts, split payouts, and offline-first operations.',
    popularIndustries: [
      'cafes',
      'bakeries',
      'mobile-phone-repair',
      'hardware-shops',
      'cannabis-dispensaries',
    ],
    population: 1050000,
    businessCount: 150000,
  },
  'quebec-city-canada': {
    slug: 'quebec-city-canada',
    name: 'Quebec City',
    city: 'Quebec City',
    country: 'Canada',
    title: 'Crypto Payments in Quebec City, Canada | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for cafés, bakeries, and tourism.',
    localContext:
      'Old City vendors adopt QR receipts, split payouts, and offline-first support.',
    popularIndustries: [
      'cafes',
      'bakeries',
      'mobile-phone-repair',
      'travel-agencies',
      'cannabis-dispensaries',
    ],
    population: 540000,
    businessCount: 80000,
  },
  'winnipeg-canada': {
    slug: 'winnipeg-canada',
    name: 'Winnipeg',
    city: 'Winnipeg',
    country: 'Canada',
    title: 'Crypto Payments in Winnipeg, Canada | PortalPay',
    metaDescription:
      'Instant settlement for cafés, repair hubs, and contractors.',
    localContext:
      'Prairie SMEs adopt QR receipts, split payouts, and inventory tagging.',
    popularIndustries: [
      'cafes',
      'mobile-phone-repair',
      'plumbing-services',
      'cleaning-services',
      'cannabis-dispensaries',
    ],
    population: 750000,
    businessCount: 100000,
  },
  'hamilton-canada': {
    slug: 'hamilton-canada',
    name: 'Hamilton',
    city: 'Hamilton',
    country: 'Canada',
    title: 'Crypto Payments in Hamilton, Canada | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for cafés, bakeries, and repair shops.',
    localContext:
      'Steel city SMEs leverage QR receipts, split payouts, and offline-first operations.',
    popularIndustries: [
      'cafes',
      'bakeries',
      'mobile-phone-repair',
      'hardware-shops',
      'cannabis-dispensaries',
    ],
    population: 580000,
    businessCount: 90000,
  },
  'mississauga-canada': {
    slug: 'mississauga-canada',
    name: 'Mississauga',
    city: 'Mississauga',
    country: 'Canada',
    title: 'Crypto Payments in Mississauga, Canada | PortalPay',
    metaDescription:
      'Instant settlement for cafés, repair hubs, and contractors.',
    localContext:
      'Airport corridor SMEs adopt QR receipts, split payouts, and transparent operations.',
    popularIndustries: [
      'cafes',
      'mobile-phone-repair',
      'cleaning-services',
      'plumbing-services',
      'cannabis-dispensaries',
    ],
    population: 720000,
    businessCount: 110000,
  },
  'brampton-canada': {
    slug: 'brampton-canada',
    name: 'Brampton',
    city: 'Brampton',
    country: 'Canada',
    title: 'Crypto Payments in Brampton, Canada | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for cafés, bakeries, and home services.',
    localContext:
      'Peel Region SMEs leverage split payouts, QR receipts, and offline-first reliability.',
    popularIndustries: [
      'cafes',
      'bakeries',
      'mobile-phone-repair',
      'cleaning-services',
      'cannabis-dispensaries',
    ],
    population: 670000,
    businessCount: 90000,
  },
  'surrey-canada': {
    slug: 'surrey-canada',
    name: 'Surrey',
    city: 'Surrey',
    country: 'Canada',
    title: 'Crypto Payments in Surrey, Canada | PortalPay',
    metaDescription:
      'Instant settlement for cafés, contractors, and repair hubs in Surrey.',
    localContext:
      'Metro Vancouver SMEs adopt QR receipts, split payouts, and transparent ops.',
    popularIndustries: [
      'cafes',
      'plumbing-services',
      'mobile-phone-repair',
      'cleaning-services',
      'cannabis-dispensaries',
    ],
    population: 580000,
    businessCount: 80000,
  },
  'halifax-canada': {
    slug: 'halifax-canada',
    name: 'Halifax',
    city: 'Halifax',
    country: 'Canada',
    title: 'Crypto Payments in Halifax, Canada | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for coastal services, cafés, and repair hubs.',
    localContext:
      'Atlantic port SMEs adopt QR receipts, split payouts, and offline-first operations.',
    popularIndustries: [
      'small-ferry-operators',
      'cafes',
      'mobile-phone-repair',
      'bakeries',
      'cannabis-dispensaries',
    ],
    population: 440000,
    businessCount: 70000,
  },
  'victoria-canada': {
    slug: 'victoria-canada',
    name: 'Victoria',
    city: 'Victoria',
    country: 'Canada',
    title: 'Crypto Payments in Victoria, Canada | PortalPay',
    metaDescription:
      'Instant settlement for cafés, ferries, and repair shops in Victoria.',
    localContext:
      'Island SMEs leverage QR tickets, split payouts, and transparent receipts.',
    popularIndustries: [
      'small-ferry-operators',
      'cafes',
      'mobile-phone-repair',
      'bakeries',
      'cannabis-dispensaries',
    ],
    population: 92000,
    businessCount: 18000,
  },
  'saskatoon-canada': {
    slug: 'saskatoon-canada',
    name: 'Saskatoon',
    city: 'Saskatoon',
    country: 'Canada',
    title: 'Crypto Payments in Saskatoon, Canada | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for cafés, repair hubs, and contractors.',
    localContext:
      'Prairie SMEs adopt split payouts, QR receipts, and offline-first mode.',
    popularIndustries: [
      'cafes',
      'mobile-phone-repair',
      'plumbing-services',
      'cleaning-services',
      'cannabis-dispensaries',
    ],
    population: 280000,
    businessCount: 40000,
  },
  'regina-canada': {
    slug: 'regina-canada',
    name: 'Regina',
    city: 'Regina',
    country: 'Canada',
    title: 'Crypto Payments in Regina, Canada | PortalPay',
    metaDescription:
      'Instant settlement for cafés, repair shops, and contractors.',
    localContext:
      'Capital corridor SMEs leverage QR receipts, split payouts, and transparent operations.',
    popularIndustries: [
      'cafes',
      'mobile-phone-repair',
      'plumbing-services',
      'cleaning-services',
      'cannabis-dispensaries',
    ],
    population: 230000,
    businessCount: 32000,
  },
  'laval-canada': {
    slug: 'laval-canada',
    name: 'Laval',
    city: 'Laval',
    country: 'Canada',
    title: 'Crypto Payments in Laval, Canada | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for cafés, bakeries, and repair hubs.',
    localContext:
      'Greater Montreal SMEs adopt split payouts, QR receipts, and offline-first support.',
    popularIndustries: [
      'cafes',
      'bakeries',
      'mobile-phone-repair',
      'hardware-shops',
      'cannabis-dispensaries',
    ],
    population: 450000,
    businessCount: 65000,
  },
  'gatineau-canada': {
    slug: 'gatineau-canada',
    name: 'Gatineau',
    city: 'Gatineau',
    country: 'Canada',
    title: 'Crypto Payments in Gatineau, Canada | PortalPay',
    metaDescription:
      'Instant settlement for cafés, bakeries, and repair shops.',
    localContext:
      'Ottawa–Gatineau SMEs leverage QR receipts, split payouts, and transparent inventory tagging.',
    popularIndustries: [
      'cafes',
      'bakeries',
      'mobile-phone-repair',
      'cleaning-services',
      'cannabis-dispensaries',
    ],
    population: 290000,
    businessCount: 42000,
  },
  'kitchener-waterloo-canada': {
    slug: 'kitchener-waterloo-canada',
    name: 'Kitchener–Waterloo',
    city: 'Kitchener–Waterloo',
    country: 'Canada',
    title: 'Crypto Payments in Kitchener–Waterloo, Canada | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for cafés, repair hubs, and freelancers.',
    localContext:
      'Tech hub SMEs adopt split payouts, QR receipts, and offline-first operations.',
    popularIndustries: [
      'freelancers',
      'cafes',
      'mobile-phone-repair',
      'bakeries',
      'cannabis-dispensaries',
    ],
    population: 575000,
    businessCount: 80000,
  },
  'london-canada': {
    slug: 'london-canada',
    name: 'London',
    city: 'London',
    country: 'Canada',
    title: 'Crypto Payments in London, Canada | PortalPay',
    metaDescription:
      'Instant settlement for cafés, bakeries, and repair shops in London, Ontario.',
    localContext:
      'University town SMEs leverage QR receipts, split payouts, and transparent operations.',
    popularIndustries: [
      'cafes',
      'bakeries',
      'mobile-phone-repair',
      'hardware-shops',
      'cannabis-dispensaries',
    ],
    population: 420000,
    businessCount: 60000,
  },

  // Mexico (Additional)
  'cancun-mexico': {
    slug: 'cancun-mexico',
    name: 'Cancún',
    city: 'Cancún',
    country: 'Mexico',
    title: 'Crypto Payments in Cancún, Mexico | PortalPay',
    metaDescription:
      'Instant-settlement QR payments for tourism, cafés, and timeshares in Cancún.',
    localContext:
      'Riviera Maya SMEs adopt QR receipts, split payouts, and offline-first operations.',
    popularIndustries: [
      'timeshares',
      'travel-agencies',
      'cafes',
      'mobile-phone-repair',
      'ticket-brokers',
    ],
    population: 900000,
    businessCount: 130000,
  },
  'playa-del-carmen-mexico': {
    slug: 'playa-del-carmen-mexico',
    name: 'Playa del Carmen',
    city: 'Playa del Carmen',
    country: 'Mexico',
    title: 'Crypto Payments in Playa del Carmen, Mexico | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for tourism, cafés, and artisan vendors.',
    localContext:
      'Tourism corridors adopt QR receipts, split payouts, and transparent inventory tagging.',
    popularIndustries: [
      'travel-agencies',
      'cafes',
      'artisan-potters',
      'mobile-phone-repair',
      'ticket-brokers',
    ],
    population: 300000,
    businessCount: 50000,
  },
  'leon-mexico': {
    slug: 'leon-mexico',
    name: 'León',
    city: 'León',
    country: 'Mexico',
    title: 'Crypto Payments in León, Mexico | PortalPay',
    metaDescription:
      'Instant settlement for leather markets, cafés, and repair hubs in León.',
    localContext:
      'Industrial and market SMEs leverage QR receipts, split payouts, and offline-first reliability.',
    popularIndustries: [
      'market-stall-vendors',
      'hardware-shops',
      'internet-cafes',
      'mobile-phone-repair',
      'cafes',
    ],
    population: 1700000,
    businessCount: 220000,
  },
  'queretaro-mexico': {
    slug: 'queretaro-mexico',
    name: 'Querétaro',
    city: 'Querétaro',
    country: 'Mexico',
    title: 'Crypto Payments in Querétaro, Mexico | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for cafés, repair hubs, and hardware.',
    localContext:
      'Aerospace and SME corridors adopt QR receipts, inventory tagging, and split payouts.',
    popularIndustries: [
      'hardware-shops',
      'cafes',
      'mobile-phone-repair',
      'internet-cafes',
      'retail',
    ],
    population: 1200000,
    businessCount: 160000,
  },
  'toluca-mexico': {
    slug: 'toluca-mexico',
    name: 'Toluca',
    city: 'Toluca',
    country: 'Mexico',
    title: 'Crypto Payments in Toluca, Mexico | PortalPay',
    metaDescription:
      'Instant settlement for markets, cafés, and repair hubs in Toluca.',
    localContext:
      'Industrial valley SMEs leverage QR receipts, split payouts, and offline-first operations.',
    popularIndustries: [
      'market-stall-vendors',
      'cafes',
      'mobile-phone-repair',
      'hardware-shops',
      'street-food-vendors',
    ],
    population: 910000,
    businessCount: 130000,
  },
  'veracruz-mexico': {
    slug: 'veracruz-mexico',
    name: 'Veracruz',
    city: 'Veracruz',
    country: 'Mexico',
    title: 'Crypto Payments in Veracruz, Mexico | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for port services, cafés, and repair hubs.',
    localContext:
      'Gulf port SMEs adopt QR receipts, split payouts, and offline-first support.',
    popularIndustries: [
      'small-ferry-operators',
      'cafes',
      'mobile-phone-repair',
      'market-stall-vendors',
      'internet-cafes',
    ],
    population: 600000,
    businessCount: 90000,
  },
  'chihuahua-mexico': {
    slug: 'chihuahua-mexico',
    name: 'Chihuahua',
    city: 'Chihuahua',
    country: 'Mexico',
    title: 'Crypto Payments in Chihuahua, Mexico | PortalPay',
    metaDescription:
      'Instant settlement for markets, cafés, and repair hubs.',
    localContext:
      'Northern corridor SMEs leverage QR receipts, inventory tags, and split payouts.',
    popularIndustries: [
      'market-stall-vendors',
      'cafes',
      'mobile-phone-repair',
      'hardware-shops',
      'internet-cafes',
    ],
    population: 950000,
    businessCount: 130000,
  },
  'ciudad-juarez-mexico': {
    slug: 'ciudad-juarez-mexico',
    name: 'Ciudad Juárez',
    city: 'Ciudad Juárez',
    country: 'Mexico',
    title: 'Crypto Payments in Ciudad Juárez, Mexico | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for border retail, cafés, and repair hubs.',
    localContext:
      'Border SMEs adopt QR receipts, split payouts, and offline-first reliability.',
    popularIndustries: [
      'retail',
      'cafes',
      'mobile-phone-repair',
      'hardware-shops',
      'street-food-vendors',
    ],
    population: 1600000,
    businessCount: 220000,
  },
  'hermosillo-mexico': {
    slug: 'hermosillo-mexico',
    name: 'Hermosillo',
    city: 'Hermosillo',
    country: 'Mexico',
    title: 'Crypto Payments in Hermosillo, Mexico | PortalPay',
    metaDescription:
      'Instant settlement for markets, cafés, and repair hubs in Hermosillo.',
    localContext:
      'Sonoran SMEs leverage QR receipts, split payouts, and inventory tagging.',
    popularIndustries: [
      'market-stall-vendors',
      'cafes',
      'mobile-phone-repair',
      'hardware-shops',
      'internet-cafes',
    ],
    population: 950000,
    businessCount: 120000,
  },
  'culiacan-mexico': {
    slug: 'culiacan-mexico',
    name: 'Culiacán',
    city: 'Culiacán',
    country: 'Mexico',
    title: 'Crypto Payments in Culiacán, Mexico | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for markets, cafés, and repair shops.',
    localContext:
      'Northwest corridor SMEs adopt QR receipts, split payouts, and offline-first ops.',
    popularIndustries: [
      'market-stall-vendors',
      'cafes',
      'mobile-phone-repair',
      'hardware-shops',
      'street-food-vendors',
    ],
    population: 1000000,
    businessCount: 140000,
  },
  'morelia-mexico': {
    slug: 'morelia-mexico',
    name: 'Morelia',
    city: 'Morelia',
    country: 'Mexico',
    title: 'Crypto Payments in Morelia, Mexico | PortalPay',
    metaDescription:
      'Instant settlement for artisan vendors, cafés, and repair hubs.',
    localContext:
      'Colonial craft SMEs leverage QR receipts, inventory tags, and split payouts.',
    popularIndustries: [
      'artisan-potters',
      'cafes',
      'mobile-phone-repair',
      'internet-cafes',
      'market-stall-vendors',
    ],
    population: 850000,
    businessCount: 110000,
  },
  'aguascalientes-mexico': {
    slug: 'aguascalientes-mexico',
    name: 'Aguascalientes',
    city: 'Aguascalientes',
    country: 'Mexico',
    title: 'Crypto Payments in Aguascalientes, Mexico | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for markets, cafés, and repair hubs.',
    localContext:
      'Central corridor SMEs adopt QR receipts, split payouts, and offline-first reliability.',
    popularIndustries: [
      'market-stall-vendors',
      'cafes',
      'mobile-phone-repair',
      'hardware-shops',
      'street-food-vendors',
    ],
    population: 1000000,
    businessCount: 130000,
  },
  'san-luis-potosi-mexico': {
    slug: 'san-luis-potosi-mexico',
    name: 'San Luis Potosí',
    city: 'San Luis Potosí',
    country: 'Mexico',
    title: 'Crypto Payments in San Luis Potosí, Mexico | PortalPay',
    metaDescription:
      'Instant settlement for industrial corridors, cafés, and repair hubs.',
    localContext:
      'Automotive-adjacent SMEs leverage QR receipts, inventory tagging, and split payouts.',
    popularIndustries: [
      'hardware-shops',
      'cafes',
      'mobile-phone-repair',
      'internet-cafes',
      'retail',
    ],
    population: 1200000,
    businessCount: 160000,
  },

  // Europe - Developed Countries
  'london-uk': {
    slug: 'london-uk',
    name: 'London',
    city: 'London',
    country: 'United Kingdom',
    title: 'Crypto Payments in London, UK | PortalPay',
    metaDescription:
      'Ultra-low fees for London cafés, markets, and repair shops with instant crypto settlement.',
    localContext:
      'From borough markets to high street shops, London SMEs save on fees with QR receipts, split payouts, and instant settlement.',
    popularIndustries: [
      'cafes',
      'bakeries',
      'mobile-phone-repair',
      'market-stall-vendors',
      'artisan-potters',
    ],
    population: 9000000,
    businessCount: 1200000,
  },

  'manchester-uk': {
    slug: 'manchester-uk',
    name: 'Manchester',
    city: 'Manchester',
    country: 'United Kingdom',
    title: 'Crypto Payments in Manchester, UK | PortalPay',
    metaDescription:
      'Low-fee crypto payments for Manchester cafés, repair shops, and markets.',
    localContext:
      'Northern Quarter artisans and neighborhood cafés leverage QR receipts, split payouts, and transparent operations.',
    popularIndustries: [
      'cafes',
      'mobile-phone-repair',
      'artisan-potters',
      'bakeries',
      'hardware-shops',
    ],
    population: 550000,
    businessCount: 95000,
  },

  'berlin-germany': {
    slug: 'berlin-germany',
    name: 'Berlin',
    city: 'Berlin',
    country: 'Germany',
    title: 'Crypto Payments in Berlin, Germany | PortalPay',
    metaDescription:
      'Instant settlement and QR receipts for Berlin cafés, repair shops, and artisan markets.',
    localContext:
      'Kreuzberg artisans and Mitte cafés adopt crypto payments with split payouts, transparent receipts, and offline-first support.',
    popularIndustries: [
      'cafes',
      'artisan-potters',
      'mobile-phone-repair',
      'bakeries',
      'hardware-shops',
    ],
    population: 3700000,
    businessCount: 550000,
  },

  'munich-germany': {
    slug: 'munich-germany',
    name: 'Munich',
    city: 'Munich',
    country: 'Germany',
    title: 'Crypto Payments in Munich, Germany | PortalPay',
    metaDescription:
      'Low-fee crypto payments for Munich cafés, bakeries, and repair shops.',
    localContext:
      'Bavarian markets and tech SMEs benefit from QR receipts, split payouts, and instant settlement.',
    popularIndustries: [
      'cafes',
      'bakeries',
      'mobile-phone-repair',
      'hardware-shops',
      'artisan-potters',
    ],
    population: 1500000,
    businessCount: 280000,
  },

  'paris-france': {
    slug: 'paris-france',
    name: 'Paris',
    city: 'Paris',
    country: 'France',
    title: 'Crypto Payments in Paris, France | PortalPay',
    metaDescription:
      'Ultra-low fees for Parisian cafés, bakeries, and artisan vendors with instant crypto settlement.',
    localContext:
      'From Left Bank cafés to Marais artisans, Paris SMEs adopt QR receipts, split payouts, and transparent operations.',
    popularIndustries: [
      'cafes',
      'bakeries',
      'artisan-potters',
      'mobile-phone-repair',
      'market-stall-vendors',
    ],
    population: 2200000,
    businessCount: 420000,
  },

  'lyon-france': {
    slug: 'lyon-france',
    name: 'Lyon',
    city: 'Lyon',
    country: 'France',
    title: 'Crypto Payments in Lyon, France | PortalPay',
    metaDescription:
      'Instant settlement for Lyon cafés, bakeries, and repair shops.',
    localContext:
      'Gastronomic and artisan districts leverage QR receipts, inventory tagging, and split payouts.',
    popularIndustries: [
      'bakeries',
      'cafes',
      'artisan-potters',
      'mobile-phone-repair',
      'hardware-shops',
    ],
    population: 515000,
    businessCount: 110000,
  },

  'amsterdam-netherlands': {
    slug: 'amsterdam-netherlands',
    name: 'Amsterdam',
    city: 'Amsterdam',
    country: 'Netherlands',
    title: 'Crypto Payments in Amsterdam, Netherlands | PortalPay',
    metaDescription:
      'Low-fee crypto payments for Amsterdam cafés, markets, and repair shops.',
    localContext:
      'Canal-side cafés and market vendors adopt QR receipts, split payouts, and instant settlement.',
    popularIndustries: [
      'cafes',
      'bakeries',
      'mobile-phone-repair',
      'artisan-potters',
      'market-stall-vendors',
    ],
    population: 870000,
    businessCount: 180000,
  },

  'rome-italy': {
    slug: 'rome-italy',
    name: 'Rome',
    city: 'Rome',
    country: 'Italy',
    title: 'Crypto Payments in Rome, Italy | PortalPay',
    metaDescription:
      'Instant settlement and QR receipts for Roman cafés, artisan vendors, and repair shops.',
    localContext:
      'Historic district SMEs and Trastevere artisans leverage split payouts, QR receipts, and transparent operations.',
    popularIndustries: [
      'cafes',
      'artisan-potters',
      'bakeries',
      'mobile-phone-repair',
      'market-stall-vendors',
    ],
    population: 2800000,
    businessCount: 450000,
  },

  'milan-italy': {
    slug: 'milan-italy',
    name: 'Milan',
    city: 'Milan',
    country: 'Italy',
    title: 'Crypto Payments in Milan, Italy | PortalPay',
    metaDescription:
      'Low-fee crypto payments for Milanese cafés, fashion boutiques, and repair shops.',
    localContext:
      'Fashion and design SMEs adopt QR receipts, inventory tagging, and split payouts for transparent operations.',
    popularIndustries: [
      'cafes',
      'artisan-potters',
      'mobile-phone-repair',
      'bakeries',
      'retail',
    ],
    population: 1400000,
    businessCount: 320000,
  },

  'madrid-spain': {
    slug: 'madrid-spain',
    name: 'Madrid',
    city: 'Madrid',
    country: 'Spain',
    title: 'Crypto Payments in Madrid, Spain | PortalPay',
    metaDescription:
      'Instant settlement and QR receipts for Madrid cafés, tapas bars, and repair shops.',
    localContext:
      'Barrio SMEs and café culture leverage split payouts, QR receipts, and offline-first operations.',
    popularIndustries: [
      'cafes',
      'bakeries',
      'mobile-phone-repair',
      'artisan-potters',
      'street-food-vendors',
    ],
    population: 3200000,
    businessCount: 520000,
  },

  'barcelona-spain': {
    slug: 'barcelona-spain',
    name: 'Barcelona',
    city: 'Barcelona',
    country: 'Spain',
    title: 'Crypto Payments in Barcelona, Spain | PortalPay',
    metaDescription:
      'Low-fee crypto payments for Barcelona cafés, markets, and artisan vendors.',
    localContext:
      'Gothic Quarter artisans and beachfront cafés adopt QR receipts, inventory tags, and split payouts.',
    popularIndustries: [
      'cafes',
      'artisan-potters',
      'bakeries',
      'mobile-phone-repair',
      'market-stall-vendors',
    ],
    population: 1600000,
    businessCount: 340000,
  },

  'lisbon-portugal': {
    slug: 'lisbon-portugal',
    name: 'Lisbon',
    city: 'Lisbon',
    country: 'Portugal',
    title: 'Crypto Payments in Lisbon, Portugal | PortalPay',
    metaDescription:
      'Instant settlement for Lisbon cafés, bakeries, and coastal services.',
    localContext:
      'Alfama cafés and coastal ferry operators leverage QR tickets, split payouts, and offline-first receipts.',
    popularIndustries: [
      'cafes',
      'bakeries',
      'small-ferry-operators',
      'mobile-phone-repair',
      'artisan-potters',
    ],
    population: 505000,
    businessCount: 110000,
  },

  'vienna-austria': {
    slug: 'vienna-austria',
    name: 'Vienna',
    city: 'Vienna',
    country: 'Austria',
    title: 'Crypto Payments in Vienna, Austria | PortalPay',
    metaDescription:
      'Low-fee crypto payments for Viennese cafés, bakeries, and repair shops.',
    localContext:
      'Historic café culture and artisan districts adopt QR receipts, split payouts, and instant settlement.',
    popularIndustries: [
      'cafes',
      'bakeries',
      'artisan-potters',
      'mobile-phone-repair',
      'hardware-shops',
    ],
    population: 1900000,
    businessCount: 320000,
  },

  'zurich-switzerland': {
    slug: 'zurich-switzerland',
    name: 'Zürich',
    city: 'Zürich',
    country: 'Switzerland',
    title: 'Crypto Payments in Zürich, Switzerland | PortalPay',
    metaDescription:
      'Instant settlement and QR receipts for Zürich cafés, bakeries, and repair shops.',
    localContext:
      'Financial district SMEs and lakeside cafés leverage split payouts, transparent receipts, and offline-first support.',
    popularIndustries: [
      'cafes',
      'bakeries',
      'mobile-phone-repair',
      'artisan-potters',
      'hardware-shops',
    ],
    population: 420000,
    businessCount: 85000,
  },

  'brussels-belgium': {
    slug: 'brussels-belgium',
    name: 'Brussels',
    city: 'Brussels',
    country: 'Belgium',
    title: 'Crypto Payments in Brussels, Belgium | PortalPay',
    metaDescription:
      'Low-fee crypto payments for Brussels cafés, chocolate shops, and repair hubs.',
    localContext:
      'European quarter SMEs and Grand Place vendors adopt QR receipts, split payouts, and instant settlement.',
    popularIndustries: [
      'cafes',
      'bakeries',
      'mobile-phone-repair',
      'artisan-potters',
      'market-stall-vendors',
    ],
    population: 1200000,
    businessCount: 220000,
  },

  'copenhagen-denmark': {
    slug: 'copenhagen-denmark',
    name: 'Copenhagen',
    city: 'Copenhagen',
    country: 'Denmark',
    title: 'Crypto Payments in Copenhagen, Denmark | PortalPay',
    metaDescription:
      'Instant settlement for Copenhagen cafés, bakeries, and coastal services.',
    localContext:
      'Hygge cafés and harbor services leverage QR receipts, split payouts, and transparent operations.',
    popularIndustries: [
      'cafes',
      'bakeries',
      'small-ferry-operators',
      'mobile-phone-repair',
      'artisan-potters',
    ],
    population: 630000,
    businessCount: 130000,
  },

  'stockholm-sweden': {
    slug: 'stockholm-sweden',
    name: 'Stockholm',
    city: 'Stockholm',
    country: 'Sweden',
    title: 'Crypto Payments in Stockholm, Sweden | PortalPay',
    metaDescription:
      'Low-fee crypto payments for Stockholm cafés, archipelago ferries, and repair shops.',
    localContext:
      'Island-hopping ferries and Gamla Stan SMEs adopt QR tickets, split payouts, and offline-first support.',
    popularIndustries: [
      'small-ferry-operators',
      'cafes',
      'mobile-phone-repair',
      'bakeries',
      'artisan-potters',
    ],
    population: 980000,
    businessCount: 190000,
  },

  'helsinki-finland': {
    slug: 'helsinki-finland',
    name: 'Helsinki',
    city: 'Helsinki',
    country: 'Finland',
    title: 'Crypto Payments in Helsinki, Finland | PortalPay',
    metaDescription:
      'Instant settlement for Helsinki cafés, ferries, and repair shops.',
    localContext:
      'Baltic ferries and design district SMEs leverage QR tickets, split payouts, and transparent receipts.',
    popularIndustries: [
      'small-ferry-operators',
      'cafes',
      'mobile-phone-repair',
      'bakeries',
      'artisan-potters',
    ],
    population: 660000,
    businessCount: 140000,
  },

  'oslo-norway': {
    slug: 'oslo-norway',
    name: 'Oslo',
    city: 'Oslo',
    country: 'Norway',
    title: 'Crypto Payments in Oslo, Norway | PortalPay',
    metaDescription:
      'Low-fee crypto payments for Oslo cafés, fjord ferries, and repair shops.',
    localContext:
      'Fjord services and urban SMEs adopt QR tickets, split payouts, and instant settlement.',
    popularIndustries: [
      'small-ferry-operators',
      'cafes',
      'mobile-phone-repair',
      'bakeries',
      'artisan-potters',
    ],
    population: 690000,
    businessCount: 150000,
  },

  'reykjavik-iceland': {
    slug: 'reykjavik-iceland',
    name: 'Reykjavik',
    city: 'Reykjavik',
    country: 'Iceland',
    title: 'Crypto Payments in Reykjavik, Iceland | PortalPay',
    metaDescription:
      'Instant settlement for Reykjavik cafés, bakeries, and coastal services.',
    localContext:
      'Compact capital SMEs leverage QR receipts, split payouts, and offline-first reliability.',
    popularIndustries: [
      'cafes',
      'bakeries',
      'mobile-phone-repair',
      'small-ferry-operators',
      'artisan-potters',
    ],
    population: 130000,
    businessCount: 28000,
  },

  'dublin-ireland': {
    slug: 'dublin-ireland',
    name: 'Dublin',
    city: 'Dublin',
    country: 'Ireland',
    title: 'Crypto Payments in Dublin, Ireland | PortalPay',
    metaDescription:
      'Low-fee crypto payments for Dublin cafés, pubs, and repair shops.',
    localContext:
      'Temple Bar SMEs and coastal services adopt QR receipts, split payouts, and instant settlement.',
    popularIndustries: [
      'cafes',
      'bakeries',
      'mobile-phone-repair',
      'artisan-potters',
      'small-ferry-operators',
    ],
    population: 550000,
    businessCount: 120000,
  },

  'edinburgh-uk': {
    slug: 'edinburgh-uk',
    name: 'Edinburgh',
    city: 'Edinburgh',
    country: 'United Kingdom',
    title: 'Crypto Payments in Edinburgh, UK | PortalPay',
    metaDescription:
      'Instant settlement for Edinburgh cafés, artisan vendors, and repair shops.',
    localContext:
      'Royal Mile artisans and New Town cafés leverage QR receipts, split payouts, and offline-first support.',
    popularIndustries: [
      'cafes',
      'artisan-potters',
      'bakeries',
      'mobile-phone-repair',
      'market-stall-vendors',
    ],
    population: 530000,
    businessCount: 95000,
  },

  'warsaw-poland': {
    slug: 'warsaw-poland',
    name: 'Warsaw',
    city: 'Warsaw',
    country: 'Poland',
    title: 'Crypto Payments in Warsaw, Poland | PortalPay',
    metaDescription:
      'Low-fee crypto payments for Warsaw cafés, markets, and repair shops.',
    localContext:
      'Old Town vendors and modern districts adopt QR receipts, split payouts, and instant settlement.',
    popularIndustries: [
      'cafes',
      'bakeries',
      'mobile-phone-repair',
      'market-stall-vendors',
      'artisan-potters',
    ],
    population: 1790000,
    businessCount: 310000,
  },

  'prague-czech-republic': {
    slug: 'prague-czech-republic',
    name: 'Prague',
    city: 'Prague',
    country: 'Czech Republic',
    title: 'Crypto Payments in Prague, Czech Republic | PortalPay',
    metaDescription:
      'Instant settlement for Prague cafés, artisan markets, and repair shops.',
    localContext:
      'Old Town SMEs and riverside cafés leverage QR receipts, split payouts, and offline-first support.',
    popularIndustries: [
      'cafes',
      'bakeries',
      'artisan-potters',
      'mobile-phone-repair',
      'market-stall-vendors',
    ],
    population: 1300000,
    businessCount: 240000,
  },

  'athens-greece': {
    slug: 'athens-greece',
    name: 'Athens',
    city: 'Athens',
    country: 'Greece',
    title: 'Crypto Payments in Athens, Greece | PortalPay',
    metaDescription:
      'Low-fee crypto payments for Athens cafés, markets, and coastal services.',
    localContext:
      'Plaka vendors and Piraeus ferries adopt QR tickets, split payouts, and instant settlement.',
    popularIndustries: [
      'cafes',
      'artisan-potters',
      'small-ferry-operators',
      'mobile-phone-repair',
      'bakeries',
    ],
    population: 660000,
    businessCount: 130000,
  },

  // Asia-Pacific - Developed Countries
  'tokyo-japan': {
    slug: 'tokyo-japan',
    name: 'Tokyo',
    city: 'Tokyo',
    country: 'Japan',
    title: 'Crypto Payments in Tokyo, Japan | PortalPay',
    metaDescription:
      'Ultra-low fees for Tokyo cafés, repair shops, and neighborhood stores with instant settlement.',
    localContext:
      "From Shibuya to Shinjuku, Tokyo's dense SME networks adopt QR receipts, split payouts, and offline-first operations.",
    popularIndustries: [
      'cafes',
      'mobile-phone-repair',
      'bakeries',
      'hardware-shops',
      'artisan-potters',
    ],
    population: 14000000,
    businessCount: 1800000,
  },

  'osaka-japan': {
    slug: 'osaka-japan',
    name: 'Osaka',
    city: 'Osaka',
    country: 'Japan',
    title: 'Crypto Payments in Osaka, Japan | PortalPay',
    metaDescription:
      'Low-fee crypto payments for Osaka street food, cafés, and repair shops.',
    localContext:
      'Dotonbori vendors and neighborhood cafés benefit from QR receipts, split payouts, and instant settlement.',
    popularIndustries: [
      'street-food-vendors',
      'cafes',
      'mobile-phone-repair',
      'bakeries',
      'hardware-shops',
    ],
    population: 2700000,
    businessCount: 480000,
  },

  'seoul-south-korea': {
    slug: 'seoul-south-korea',
    name: 'Seoul',
    city: 'Seoul',
    country: 'South Korea',
    title: 'Crypto Payments in Seoul, South Korea | PortalPay',
    metaDescription:
      'Instant settlement and QR receipts for Seoul cafés, repair shops, and street vendors.',
    localContext:
      "Gangnam to Hongdae, Seoul's vibrant SME districts leverage split payouts, QR receipts, and transparent operations.",
    popularIndustries: [
      'cafes',
      'mobile-phone-repair',
      'street-food-vendors',
      'bakeries',
      'hardware-shops',
    ],
    population: 9700000,
    businessCount: 1200000,
  },

  'busan-south-korea': {
    slug: 'busan-south-korea',
    name: 'Busan',
    city: 'Busan',
    country: 'South Korea',
    title: 'Crypto Payments in Busan, South Korea | PortalPay',
    metaDescription:
      'Low-fee crypto payments for Busan coastal services, cafés, and markets.',
    localContext:
      'Beach markets and ferry services adopt QR tickets, split payouts, and instant settlement.',
    popularIndustries: [
      'small-ferry-operators',
      'street-food-vendors',
      'cafes',
      'mobile-phone-repair',
      'market-stall-vendors',
    ],
    population: 3400000,
    businessCount: 480000,
  },

  'singapore-singapore': {
    slug: 'singapore-singapore',
    name: 'Singapore',
    city: 'Singapore',
    country: 'Singapore',
    title: 'Crypto Payments in Singapore | PortalPay',
    metaDescription:
      'Ultra-low fees for Singapore cafés, hawker centers, and repair shops with instant settlement.',
    localContext:
      'From hawker centers to Orchard Road, Singapore SMEs adopt QR receipts, split payouts, and transparent operations.',
    popularIndustries: [
      'cafes',
      'street-food-vendors',
      'mobile-phone-repair',
      'bakeries',
      'hardware-shops',
    ],
    population: 5900000,
    businessCount: 720000,
  },

  'hong-kong-hong-kong': {
    slug: 'hong-kong-hong-kong',
    name: 'Hong Kong',
    city: 'Hong Kong',
    country: 'Hong Kong',
    title: 'Crypto Payments in Hong Kong | PortalPay',
    metaDescription:
      'Low-fee crypto payments for Hong Kong cafés, markets, and ferry services.',
    localContext:
      'From Central to Kowloon, HK SMEs leverage QR receipts, split payouts, and instant settlement.',
    popularIndustries: [
      'cafes',
      'small-ferry-operators',
      'mobile-phone-repair',
      'street-food-vendors',
      'bakeries',
    ],
    population: 7500000,
    businessCount: 850000,
  },

  'sydney-australia': {
    slug: 'sydney-australia',
    name: 'Sydney',
    city: 'Sydney',
    country: 'Australia',
    title: 'Crypto Payments in Sydney, Australia | PortalPay',
    metaDescription:
      'Ultra-low fees for Sydney cafés, ferry services, and repair shops with instant settlement.',
    localContext:
      'Harbour ferries and neighborhood SMEs adopt QR tickets, split payouts, and transparent operations.',
    popularIndustries: [
      'small-ferry-operators',
      'cafes',
      'mobile-phone-repair',
      'bakeries',
      'artisan-potters',
    ],
    population: 5300000,
    businessCount: 680000,
  },

  'melbourne-australia': {
    slug: 'melbourne-australia',
    name: 'Melbourne',
    city: 'Melbourne',
    country: 'Australia',
    title: 'Crypto Payments in Melbourne, Australia | PortalPay',
    metaDescription:
      'Low-fee crypto payments for Melbourne cafés, markets, and repair shops.',
    localContext:
      'Laneway cafés and suburban markets leverage QR receipts, split payouts, and instant settlement.',
    popularIndustries: [
      'cafes',
      'bakeries',
      'mobile-phone-repair',
      'artisan-potters',
      'market-stall-vendors',
    ],
    population: 5100000,
    businessCount: 650000,
  },

  'auckland-new-zealand': {
    slug: 'auckland-new-zealand',
    name: 'Auckland',
    city: 'Auckland',
    country: 'New Zealand',
    title: 'Crypto Payments in Auckland, New Zealand | PortalPay',
    metaDescription:
      'Instant settlement for Auckland cafés, ferry services, and repair shops.',
    localContext:
      'Harbour ferries and neighborhood SMEs adopt QR tickets, split payouts, and offline-first support.',
    popularIndustries: [
      'small-ferry-operators',
      'cafes',
      'mobile-phone-repair',
      'bakeries',
      'artisan-potters',
    ],
    population: 1700000,
    businessCount: 240000,
  },

  'wellington-new-zealand': {
    slug: 'wellington-new-zealand',
    name: 'Wellington',
    city: 'Wellington',
    country: 'New Zealand',
    title: 'Crypto Payments in Wellington, New Zealand | PortalPay',
    metaDescription:
      'Low-fee crypto payments for Wellington cafés, ferries, and repair shops.',
    localContext:
      'Waterfront services and Te Aro cafés leverage QR receipts, split payouts, and instant settlement.',
    popularIndustries: [
      'cafes',
      'small-ferry-operators',
      'mobile-phone-repair',
      'bakeries',
      'artisan-potters',
    ],
    population: 220000,
    businessCount: 42000,
  },

  'beijing-china': {
    slug: 'beijing-china',
    name: 'Beijing',
    city: 'Beijing',
    country: 'China',
    title: 'Crypto Payments in Beijing, China | PortalPay',
    metaDescription:
      'Ultra-low fees for Beijing cafés, markets, and repair shops with instant settlement.',
    localContext:
      'Hutong neighborhoods and tech districts adopt QR receipts, split payouts, and transparent operations.',
    popularIndustries: [
      'cafes',
      'mobile-phone-repair',
      'market-stall-vendors',
      'bakeries',
      'hardware-shops',
    ],
    population: 21500000,
    businessCount: 2400000,
  },

  'shanghai-china': {
    slug: 'shanghai-china',
    name: 'Shanghai',
    city: 'Shanghai',
    country: 'China',
    title: 'Crypto Payments in Shanghai, China | PortalPay',
    metaDescription:
      'Low-fee crypto payments for Shanghai cafés, markets, and repair shops.',
    localContext:
      'From Bund-side to Pudong, Shanghai SMEs leverage QR receipts, split payouts, and instant settlement.',
    popularIndustries: [
      'cafes',
      'mobile-phone-repair',
      'street-food-vendors',
      'bakeries',
      'hardware-shops',
    ],
    population: 27000000,
    businessCount: 3200000,
  },

  'shenzhen-china': {
    slug: 'shenzhen-china',
    name: 'Shenzhen',
    city: 'Shenzhen',
    country: 'China',
    title: 'Crypto Payments in Shenzhen, China | PortalPay',
    metaDescription:
      'Instant settlement for Shenzhen cafés, electronics repair, and hardware shops.',
    localContext:
      'Tech manufacturing and repair districts adopt QR receipts, inventory tagging, and split payouts.',
    popularIndustries: [
      'mobile-phone-repair',
      'hardware-shops',
      'cafes',
      'internet-cafes',
      'market-stall-vendors',
    ],
    population: 13000000,
    businessCount: 1600000,
  },

  'guangzhou-china': {
    slug: 'guangzhou-china',
    name: 'Guangzhou',
    city: 'Guangzhou',
    country: 'China',
    title: 'Crypto Payments in Guangzhou, China | PortalPay',
    metaDescription:
      'Low-fee crypto payments for Guangzhou markets, cafés, and repair shops.',
    localContext:
      'Canton trade corridors leverage QR receipts, split payouts, and transparent operations.',
    popularIndustries: [
      'market-stall-vendors',
      'cafes',
      'mobile-phone-repair',
      'street-food-vendors',
      'hardware-shops',
    ],
    population: 15000000,
    businessCount: 1800000,
  },

  'taipei-taiwan': {
    slug: 'taipei-taiwan',
    name: 'Taipei',
    city: 'Taipei',
    country: 'Taiwan',
    title: 'Crypto Payments in Taipei, Taiwan | PortalPay',
    metaDescription:
      'Instant settlement for Taipei night markets, cafés, and repair shops.',
    localContext:
      'Night markets and tech districts adopt QR receipts, split payouts, and offline-first operations.',
    popularIndustries: [
      'street-food-vendors',
      'cafes',
      'mobile-phone-repair',
      'bakeries',
      'hardware-shops',
    ],
    population: 2600000,
    businessCount: 450000,
  },

  // Russia - Major Missing Country
  'moscow-russia': {
    slug: 'moscow-russia',
    name: 'Moscow',
    city: 'Moscow',
    country: 'Russia',
    title: 'Crypto Payments in Moscow, Russia | PortalPay',
    metaDescription:
      'Low-fee crypto payments for Moscow cafés, markets, and repair shops with instant settlement.',
    localContext:
      'From Red Square vendors to neighborhood cafés, Moscow SMEs adopt QR receipts, split payouts, and transparent operations.',
    popularIndustries: [
      'cafes',
      'mobile-phone-repair',
      'market-stall-vendors',
      'bakeries',
      'hardware-shops',
    ],
    population: 12600000,
    businessCount: 1500000,
  },

  'st-petersburg-russia': {
    slug: 'st-petersburg-russia',
    name: 'St. Petersburg',
    city: 'St. Petersburg',
    country: 'Russia',
    title: 'Crypto Payments in St. Petersburg, Russia | PortalPay',
    metaDescription:
      'Instant settlement for St. Petersburg cafés, canal ferries, and repair shops.',
    localContext:
      'Neva river services and Nevsky Prospekt SMEs leverage QR tickets, split payouts, and offline-first support.',
    popularIndustries: [
      'small-ferry-operators',
      'cafes',
      'mobile-phone-repair',
      'bakeries',
      'artisan-potters',
    ],
    population: 5400000,
    businessCount: 650000,
  },

  // Additional Missing Countries - Caribbean Islands
  'willemstad-curacao': {
    slug: 'willemstad-curacao',
    name: 'Willemstad',
    city: 'Willemstad',
    country: 'Curaçao',
    title: 'Crypto Payments in Willemstad, Curaçao | PortalPay',
    metaDescription:
      'QR ticketing and instant settlement for coastal services, cafés, and repair hubs in Curaçao.',
    localContext:
      'Caribbean island SMEs adopt QR tickets, split payouts, and offline-first operations for tourism services.',
    popularIndustries: [
      'small-ferry-operators',
      'cafes',
      'internet-cafes',
      'mobile-phone-repair',
      'artisan-potters',
    ],
    population: 160000,
    businessCount: 22000,
  },

  'oranjestad-aruba': {
    slug: 'oranjestad-aruba',
    name: 'Oranjestad',
    city: 'Oranjestad',
    country: 'Aruba',
    title: 'Crypto Payments in Oranjestad, Aruba | PortalPay',
    metaDescription:
      'Instant-settlement QR payments for tourism, cafés, and coastal services.',
    localContext:
      'Tourism SMEs use QR receipts, split payouts for guides, and offline-first support.',
    popularIndustries: [
      'small-ferry-operators',
      'cafes',
      'artisan-potters',
      'mobile-phone-repair',
      'internet-cafes',
    ],
    population: 110000,
    businessCount: 15000,
  },

  'roseau-dominica': {
    slug: 'roseau-dominica',
    name: 'Roseau',
    city: 'Roseau',
    country: 'Dominica',
    title: 'Crypto Payments in Roseau, Dominica | PortalPay',
    metaDescription:
      'QR ticketing for coastal services and instant settlement for cafés.',
    localContext:
      'Island SMEs leverage QR tickets, split payouts, and offline-first receipts.',
    popularIndustries: [
      'small-ferry-operators',
      'cafes',
      'internet-cafes',
      'mobile-phone-repair',
      'artisan-potters',
    ],
    population: 15000,
    businessCount: 3000,
  },

  'basseterre-st-kitts': {
    slug: 'basseterre-st-kitts',
    name: 'Basseterre',
    city: 'Basseterre',
    country: 'Saint Kitts and Nevis',
    title: 'Crypto Payments in Basseterre, Saint Kitts and Nevis | PortalPay',
    metaDescription:
      'Instant-settlement QR payments for tourism and coastal services.',
    localContext:
      'Tourism corridors adopt QR receipts, inventory tags, and split payouts.',
    popularIndustries: [
      'small-ferry-operators',
      'cafes',
      'artisan-potters',
      'mobile-phone-repair',
      'internet-cafes',
    ],
    population: 13000,
    businessCount: 2500,
  },

  'st-johns-antigua': {
    slug: 'st-johns-antigua',
    name: "St. John's",
    city: "St. John's",
    country: 'Antigua and Barbuda',
    title: "Crypto Payments in St. John's, Antigua and Barbuda | PortalPay",
    metaDescription:
      'QR ticketing and instant settlement for island ferries and tourism.',
    localContext:
      'Caribbean tourism SMEs use QR tickets, split payouts, and offline-first operations.',
    popularIndustries: [
      'small-ferry-operators',
      'cafes',
      'internet-cafes',
      'mobile-phone-repair',
      'artisan-potters',
    ],
    population: 22000,
    businessCount: 4000,
  },

  'kingstown-st-vincent': {
    slug: 'kingstown-st-vincent',
    name: 'Kingstown',
    city: 'Kingstown',
    country: 'Saint Vincent and the Grenadines',
    title: 'Crypto Payments in Kingstown, Saint Vincent and the Grenadines | PortalPay',
    metaDescription:
      'Instant-settlement QR payments for ferries, markets, and cafés.',
    localContext:
      'Island-hopping ferries and markets adopt QR tickets, split payouts, and offline receipts.',
    popularIndustries: [
      'small-ferry-operators',
      'market-stall-vendors',
      'cafes',
      'mobile-phone-repair',
      'internet-cafes',
    ],
    population: 16000,
    businessCount: 3000,
  },

  // Pacific Islands
  'pago-pago-american-samoa': {
    slug: 'pago-pago-american-samoa',
    name: 'Pago Pago',
    city: 'Pago Pago',
    country: 'American Samoa',
    title: 'Crypto Payments in Pago Pago, American Samoa | PortalPay',
    metaDescription:
      'QR ticketing for coastal services and instant settlement for markets.',
    localContext:
      'Pacific island SMEs leverage QR tickets, split payouts, and offline-first support.',
    popularIndustries: [
      'small-ferry-operators',
      'market-stall-vendors',
      'cafes',
      'mobile-phone-repair',
      'artisan-potters',
    ],
    population: 3700,
    businessCount: 800,
  },

  'noumea-new-caledonia': {
    slug: 'noumea-new-caledonia',
    name: 'Nouméa',
    city: 'Nouméa',
    country: 'New Caledonia',
    title: 'Crypto Payments in Nouméa, New Caledonia | PortalPay',
    metaDescription:
      'Instant-settlement QR payments for coastal services and tourism.',
    localContext:
      'French Pacific territory SMEs adopt QR receipts, split payouts, and offline operations.',
    popularIndustries: [
      'small-ferry-operators',
      'cafes',
      'internet-cafes',
      'mobile-phone-repair',
      'artisan-potters',
    ],
    population: 100000,
    businessCount: 15000,
  },

  'papeete-french-polynesia': {
    slug: 'papeete-french-polynesia',
    name: 'Papeete',
    city: 'Papeete',
    country: 'French Polynesia',
    title: 'Crypto Payments in Papeete, French Polynesia | PortalPay',
    metaDescription:
      'QR ticketing for island ferries and instant settlement for tourism.',
    localContext:
      'Tahiti tourism and inter-island ferries use QR tickets, split payouts, and transparent receipts.',
    popularIndustries: [
      'small-ferry-operators',
      'cafes',
      'artisan-potters',
      'mobile-phone-repair',
      'internet-cafes',
    ],
    population: 27000,
    businessCount: 5000,
  },

  'majuro-marshall-islands': {
    slug: 'majuro-marshall-islands',
    name: 'Majuro',
    city: 'Majuro',
    country: 'Marshall Islands',
    title: 'Crypto Payments in Majuro, Marshall Islands | PortalPay',
    metaDescription:
      'Instant-settlement QR payments for ferries, markets, and cafés.',
    localContext:
      'Atoll communities adopt QR tickets, split payouts, and offline-first operations.',
    popularIndustries: [
      'small-ferry-operators',
      'market-stall-vendors',
      'cafes',
      'mobile-phone-repair',
      'internet-cafes',
    ],
    population: 27000,
    businessCount: 4000,
  },

  'palikir-micronesia': {
    slug: 'palikir-micronesia',
    name: 'Palikir',
    city: 'Palikir',
    country: 'Micronesia',
    title: 'Crypto Payments in Palikir, Micronesia | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for island markets and cafés.',
    localContext:
      'Pacific island SMEs use QR receipts, split payouts, and offline-first support.',
    popularIndustries: [
      'small-ferry-operators',
      'market-stall-vendors',
      'cafes',
      'mobile-phone-repair',
      'internet-cafes',
    ],
    population: 7000,
    businessCount: 1500,
  },

  'ngerulmud-palau': {
    slug: 'ngerulmud-palau',
    name: 'Ngerulmud',
    city: 'Ngerulmud',
    country: 'Palau',
    title: 'Crypto Payments in Ngerulmud, Palau | PortalPay',
    metaDescription:
      'Instant-settlement QR payments for tourism and coastal services.',
    localContext:
      'Diving tourism and ferries adopt QR tickets, split payouts, and offline receipts.',
    popularIndustries: [
      'small-ferry-operators',
      'cafes',
      'artisan-potters',
      'mobile-phone-repair',
      'internet-cafes',
    ],
    population: 400,
    businessCount: 100,
  },

  // European Micro-States
  'andorra-la-vella-andorra': {
    slug: 'andorra-la-vella-andorra',
    name: 'Andorra la Vella',
    city: 'Andorra la Vella',
    country: 'Andorra',
    title: 'Crypto Payments in Andorra la Vella, Andorra | PortalPay',
    metaDescription:
      'Low-fee crypto payments for mountain resort cafés and repair shops.',
    localContext:
      'Alpine SMEs leverage QR receipts, split payouts, and instant settlement.',
    popularIndustries: [
      'cafes',
      'mobile-phone-repair',
      'artisan-potters',
      'bakeries',
      'hardware-shops',
    ],
    population: 23000,
    businessCount: 5000,
  },

  'vaduz-liechtenstein': {
    slug: 'vaduz-liechtenstein',
    name: 'Vaduz',
    city: 'Vaduz',
    country: 'Liechtenstein',
    title: 'Crypto Payments in Vaduz, Liechtenstein | PortalPay',
    metaDescription:
      'Instant settlement for boutique cafés, artisan vendors, and repair shops.',
    localContext:
      'Alpine microstate SMEs adopt QR receipts, split payouts, and transparent operations.',
    popularIndustries: [
      'cafes',
      'artisan-potters',
      'mobile-phone-repair',
      'bakeries',
      'hardware-shops',
    ],
    population: 5700,
    businessCount: 1200,
  },

  'monaco-monaco': {
    slug: 'monaco-monaco',
    name: 'Monaco',
    city: 'Monaco',
    country: 'Monaco',
    title: 'Crypto Payments in Monaco | PortalPay',
    metaDescription:
      'Ultra-low fees for Monaco cafés, luxury boutiques, and repair shops.',
    localContext:
      'Luxury retail and cafés leverage QR receipts, split payouts, and instant settlement.',
    popularIndustries: [
      'cafes',
      'bakeries',
      'mobile-phone-repair',
      'artisan-potters',
      'retail',
    ],
    population: 39000,
    businessCount: 8000,
  },

  'valletta-malta': {
    slug: 'valletta-malta',
    name: 'Valletta',
    city: 'Valletta',
    country: 'Malta',
    title: 'Crypto Payments in Valletta, Malta | PortalPay',
    metaDescription:
      'QR ticketing for harbor ferries and instant settlement for cafés.',
    localContext:
      'Historic port SMEs and cafés adopt QR tickets, split payouts, and offline-first support.',
    popularIndustries: [
      'small-ferry-operators',
      'cafes',
      'artisan-potters',
      'mobile-phone-repair',
      'bakeries',
    ],
    population: 6000,
    businessCount: 1500,
  },

  'san-marino-san-marino': {
    slug: 'san-marino-san-marino',
    name: 'San Marino',
    city: 'San Marino',
    country: 'San Marino',
    title: 'Crypto Payments in San Marino | PortalPay',
    metaDescription:
      'Instant settlement for mountain cafés, artisan vendors, and repair shops.',
    localContext:
      'Hilltop republic SMEs leverage QR receipts, split payouts, and transparent operations.',
    popularIndustries: [
      'cafes',
      'artisan-potters',
      'bakeries',
      'mobile-phone-repair',
      'internet-cafes',
    ],
    population: 34000,
    businessCount: 6000,
  },

  'vatican-city-vatican': {
    slug: 'vatican-city-vatican',
    name: 'Vatican City',
    city: 'Vatican City',
    country: 'Vatican City',
    title: 'Crypto Payments in Vatican City | PortalPay',
    metaDescription:
      'QR receipts for artisan vendors and gift shops serving pilgrims.',
    localContext:
      'Religious tourism vendors adopt QR receipts, inventory tagging, and instant settlement.',
    popularIndustries: [
      'artisan-potters',
      'cafes',
      'mobile-phone-repair',
      'bakeries',
      'market-stall-vendors',
    ],
    population: 800,
    businessCount: 150,
  },

  // Additional African Countries
  'moroni-comoros': {
    slug: 'moroni-comoros',
    name: 'Moroni',
    city: 'Moroni',
    country: 'Comoros',
    title: 'Crypto Payments in Moroni, Comoros | PortalPay',
    metaDescription:
      'QR ticketing for island ferries and instant settlement for markets.',
    localContext:
      'Island nation SMEs adopt QR tickets, split payouts, and offline-first operations.',
    popularIndustries: [
      'small-ferry-operators',
      'market-stall-vendors',
      'mobile-phone-repair',
      'internet-cafes',
      'cafes',
    ],
    population: 60000,
    businessCount: 8000,
  },

  'djibouti-city-djibouti': {
    slug: 'djibouti-city-djibouti',
    name: 'Djibouti City',
    city: 'Djibouti City',
    country: 'Djibouti',
    title: 'Crypto Payments in Djibouti City, Djibouti | PortalPay',
    metaDescription:
      'Instant-settlement QR payments for ports, markets, and cafés.',
    localContext:
      'Strategic port SMEs leverage QR receipts, split payouts, and offline-first support.',
    popularIndustries: [
      'small-ferry-operators',
      'market-stall-vendors',
      'internet-cafes',
      'mobile-phone-repair',
      'cafes',
    ],
    population: 600000,
    businessCount: 70000,
  },

  'malabo-equatorial-guinea': {
    slug: 'malabo-equatorial-guinea',
    name: 'Malabo',
    city: 'Malabo',
    country: 'Equatorial Guinea',
    title: 'Crypto Payments in Malabo, Equatorial Guinea | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for island markets and cafés.',
    localContext:
      'Island capital SMEs adopt QR receipts, split payouts, and transparent operations.',
    popularIndustries: [
      'market-stall-vendors',
      'small-ferry-operators',
      'mobile-phone-repair',
      'internet-cafes',
      'cafes',
    ],
    population: 300000,
    businessCount: 35000,
  },

  'asmara-eritrea': {
    slug: 'asmara-eritrea',
    name: 'Asmara',
    city: 'Asmara',
    country: 'Eritrea',
    title: 'Crypto Payments in Asmara, Eritrea | PortalPay',
    metaDescription:
      'Instant-settlement QR payments for markets, cafés, and repair hubs.',
    localContext:
      'Highland capital SMEs leverage QR receipts, split payouts, and offline-first operations.',
    popularIndustries: [
      'market-stall-vendors',
      'cafes',
      'mobile-phone-repair',
      'internet-cafes',
      'artisan-potters',
    ],
    population: 900000,
    businessCount: 80000,
  },

  'banjul-gambia': {
    slug: 'banjul-gambia',
    name: 'Banjul',
    city: 'Banjul',
    country: 'Gambia',
    title: 'Crypto Payments in Banjul, Gambia | PortalPay',
    metaDescription:
      'QR ticketing for river ferries and instant settlement for markets.',
    localContext:
      'Gambia River SMEs adopt QR tickets, split payouts, and offline-first receipts.',
    popularIndustries: [
      'small-ferry-operators',
      'market-stall-vendors',
      'mobile-phone-repair',
      'internet-cafes',
      'street-food-vendors',
    ],
    population: 35000,
    businessCount: 6000,
  },

  'victoria-seychelles': {
    slug: 'victoria-seychelles',
    name: 'Victoria',
    city: 'Victoria',
    country: 'Seychelles',
    title: 'Crypto Payments in Victoria, Seychelles | PortalPay',
    metaDescription:
      'Instant-settlement QR payments for island ferries, tourism, and cafés.',
    localContext:
      'Island paradise SMEs leverage QR tickets, split payouts, and transparent operations.',
    popularIndustries: [
      'small-ferry-operators',
      'cafes',
      'artisan-potters',
      'mobile-phone-repair',
      'internet-cafes',
    ],
    population: 26000,
    businessCount: 4500,
  },

  'sao-tome-sao-tome': {
    slug: 'sao-tome-sao-tome',
    name: 'São Tomé',
    city: 'São Tomé',
    country: 'Sao Tome and Principe',
    title: 'Crypto Payments in São Tomé, Sao Tome and Principe | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for island markets and cafés.',
    localContext:
      'Equatorial island SMEs adopt QR receipts, split payouts, and offline-first support.',
    popularIndustries: [
      'market-stall-vendors',
      'small-ferry-operators',
      'cafes',
      'mobile-phone-repair',
      'internet-cafes',
    ],
    population: 80000,
    businessCount: 10000,
  },

  'mogadishu-somalia': {
    slug: 'mogadishu-somalia',
    name: 'Mogadishu',
    city: 'Mogadishu',
    country: 'Somalia',
    title: 'Crypto Payments in Mogadishu, Somalia | PortalPay',
    metaDescription:
      'Instant-settlement QR payments for markets, cafés, and repair hubs.',
    localContext:
      'Resilient coastal SMEs leverage QR receipts, split payouts, and offline-first operations.',
    popularIndustries: [
      'market-stall-vendors',
      'small-ferry-operators',
      'mobile-phone-repair',
      'internet-cafes',
      'street-food-vendors',
    ],
    population: 2600000,
    businessCount: 180000,
  },

  'juba-south-sudan': {
    slug: 'juba-south-sudan',
    name: 'Juba',
    city: 'Juba',
    country: 'South Sudan',
    title: 'Crypto Payments in Juba, South Sudan | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for markets, cafés, and repair hubs.',
    localContext:
      'New nation SMEs adopt QR receipts, split payouts, and offline-first reliability.',
    popularIndustries: [
      'market-stall-vendors',
      'mobile-phone-repair',
      'internet-cafes',
      'street-food-vendors',
      'village-savings-groups',
    ],
    population: 400000,
    businessCount: 45000,
  },

  // Middle East
  'tehran-iran': {
    slug: 'tehran-iran',
    name: 'Tehran',
    city: 'Tehran',
    country: 'Iran',
    title: 'Crypto Payments in Tehran, Iran | PortalPay',
    metaDescription:
      'Low-fee crypto payments for Tehran bazaars, cafés, and repair hubs.',
    localContext:
      'Historic bazaars and modern cafés leverage QR receipts, split payouts, and transparent operations.',
    popularIndustries: [
      'market-stall-vendors',
      'cafes',
      'mobile-phone-repair',
      'internet-cafes',
      'artisan-potters',
    ],
    population: 9000000,
    businessCount: 1100000,
  },

  'tel-aviv-israel': {
    slug: 'tel-aviv-israel',
    name: 'Tel Aviv',
    city: 'Tel Aviv',
    country: 'Israel',
    title: 'Crypto Payments in Tel Aviv, Israel | PortalPay',
    metaDescription:
      'Instant settlement for Tel Aviv cafés, tech startups, and repair shops.',
    localContext:
      'Startup nation SMEs adopt QR receipts, split payouts, and offline-first support.',
    popularIndustries: [
      'cafes',
      'internet-cafes',
      'mobile-phone-repair',
      'bakeries',
      'artisan-potters',
    ],
    population: 460000,
    businessCount: 85000,
  },

  'jerusalem-israel': {
    slug: 'jerusalem-israel',
    name: 'Jerusalem',
    city: 'Jerusalem',
    country: 'Israel',
    title: 'Crypto Payments in Jerusalem, Israel | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for Old City vendors and cafés.',
    localContext:
      'Historic quarters adopt QR receipts, inventory tagging, and split payouts for pilgrimage tourism.',
    popularIndustries: [
      'artisan-potters',
      'cafes',
      'mobile-phone-repair',
      'market-stall-vendors',
      'internet-cafes',
    ],
    population: 950000,
    businessCount: 120000,
  },

  'damascus-syria': {
    slug: 'damascus-syria',
    name: 'Damascus',
    city: 'Damascus',
    country: 'Syria',
    title: 'Crypto Payments in Damascus, Syria | PortalPay',
    metaDescription:
      'Instant-settlement QR payments for markets, cafés, and repair hubs.',
    localContext:
      'Ancient city SMEs leverage QR receipts, split payouts, and offline-first operations.',
    popularIndustries: [
      'market-stall-vendors',
      'cafes',
      'mobile-phone-repair',
      'artisan-potters',
      'internet-cafes',
    ],
    population: 2100000,
    businessCount: 180000,
  },

  'ankara-turkey': {
    slug: 'ankara-turkey',
    name: 'Ankara',
    city: 'Ankara',
    country: 'Turkey',
    title: 'Crypto Payments in Ankara, Turkey | PortalPay',
    metaDescription:
      'Low-fee crypto payments for Ankara cafés, markets, and repair shops.',
    localContext:
      'Capital district SMEs adopt QR receipts, split payouts, and instant settlement.',
    popularIndustries: [
      'cafes',
      'internet-cafes',
      'mobile-phone-repair',
      'market-stall-vendors',
      'bakeries',
    ],
    population: 5700000,
    businessCount: 720000,
  },

  // Asia
  'kabul-afghanistan': {
    slug: 'kabul-afghanistan',
    name: 'Kabul',
    city: 'Kabul',
    country: 'Afghanistan',
    title: 'Crypto Payments in Kabul, Afghanistan | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for markets, cafés, and repair hubs.',
    localContext:
      'Resilient bazaars adopt QR receipts, split payouts, and offline-first operations.',
    popularIndustries: [
      'market-stall-vendors',
      'mobile-phone-repair',
      'internet-cafes',
      'street-food-vendors',
      'artisan-potters',
    ],
    population: 4600000,
    businessCount: 350000,
  },

  'thimphu-bhutan': {
    slug: 'thimphu-bhutan',
    name: 'Thimphu',
    city: 'Thimphu',
    country: 'Bhutan',
    title: 'Crypto Payments in Thimphu, Bhutan | PortalPay',
    metaDescription:
      'Instant-settlement QR payments for mountain cafés and artisan vendors.',
    localContext:
      'Himalayan kingdom SMEs leverage QR receipts, split payouts, and offline-first support.',
    popularIndustries: [
      'artisan-potters',
      'cafes',
      'internet-cafes',
      'mobile-phone-repair',
      'village-savings-groups',
    ],
    population: 115000,
    businessCount: 15000,
  },

  'macau-macau': {
    slug: 'macau-macau',
    name: 'Macau',
    city: 'Macau',
    country: 'Macau',
    title: 'Crypto Payments in Macau | PortalPay',
    metaDescription:
      'Low-fee crypto payments for Macau cafés, markets, and repair shops.',
    localContext:
      'Casino-adjacent SMEs and Portuguese districts adopt QR receipts, split payouts, and instant settlement.',
    popularIndustries: [
      'cafes',
      'bakeries',
      'mobile-phone-repair',
      'artisan-potters',
      'street-food-vendors',
    ],
    population: 680000,
    businessCount: 95000,
  },

  // South America
  'cayenne-french-guiana': {
    slug: 'cayenne-french-guiana',
    name: 'Cayenne',
    city: 'Cayenne',
    country: 'French Guiana',
    title: 'Crypto Payments in Cayenne, French Guiana | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for markets, cafés, and coastal services.',
    localContext:
      'French overseas territory SMEs adopt QR receipts, split payouts, and offline-first operations.',
    popularIndustries: [
      'small-ferry-operators',
      'market-stall-vendors',
      'cafes',
      'mobile-phone-repair',
      'internet-cafes',
    ],
    population: 60000,
    businessCount: 9000,
  },

  // Additional European Countries
  'riga-latvia': {
    slug: 'riga-latvia',
    name: 'Riga',
    city: 'Riga',
    country: 'Latvia',
    title: 'Crypto Payments in Riga, Latvia | PortalPay',
    metaDescription:
      'Low-fee crypto payments for Riga cafés, markets, and coastal services.',
    localContext:
      'Baltic port SMEs and Old Town cafés adopt QR receipts, split payouts, and instant settlement.',
    popularIndustries: [
      'cafes',
      'small-ferry-operators',
      'mobile-phone-repair',
      'bakeries',
      'artisan-potters',
    ],
    population: 630000,
    businessCount: 120000,
  },

  'vilnius-lithuania': {
    slug: 'vilnius-lithuania',
    name: 'Vilnius',
    city: 'Vilnius',
    country: 'Lithuania',
    title: 'Crypto Payments in Vilnius, Lithuania | PortalPay',
    metaDescription:
      'Instant settlement for Vilnius cafés, artisan vendors, and repair shops.',
    localContext:
      'Old Town craft vendors and cafés leverage QR receipts, split payouts, and offline-first support.',
    popularIndustries: [
      'cafes',
      'artisan-potters',
      'mobile-phone-repair',
      'bakeries',
      'internet-cafes',
    ],
    population: 580000,
    businessCount: 110000,
  },

  'tallinn-estonia': {
    slug: 'tallinn-estonia',
    name: 'Tallinn',
    city: 'Tallinn',
    country: 'Estonia',
    title: 'Crypto Payments in Tallinn, Estonia | PortalPay',
    metaDescription:
      'Low-fee crypto payments for Tallinn cafés, ferry services, and repair shops.',
    localContext:
      'Digital-first Baltic capital adopts QR receipts, split payouts, and transparent operations.',
    popularIndustries: [
      'cafes',
      'small-ferry-operators',
      'mobile-phone-repair',
      'internet-cafes',
      'bakeries',
    ],
    population: 440000,
    businessCount: 95000,
  },

  'ljubljana-slovenia': {
    slug: 'ljubljana-slovenia',
    name: 'Ljubljana',
    city: 'Ljubljana',
    country: 'Slovenia',
    title: 'Crypto Payments in Ljubljana, Slovenia | PortalPay',
    metaDescription:
      'Instant settlement for Ljubljana cafés, artisan markets, and repair shops.',
    localContext:
      'Green capital SMEs leverage QR receipts, split payouts, and offline-first operations.',
    popularIndustries: [
      'cafes',
      'artisan-potters',
      'mobile-phone-repair',
      'bakeries',
      'internet-cafes',
    ],
    population: 295000,
    businessCount: 65000,
  },

  'zagreb-croatia': {
    slug: 'zagreb-croatia',
    name: 'Zagreb',
    city: 'Zagreb',
    country: 'Croatia',
    title: 'Crypto Payments in Zagreb, Croatia | PortalPay',
    metaDescription:
      'Low-fee crypto payments for Zagreb cafés, markets, and repair shops.',
    localContext:
      'Upper Town artisans and café culture adopt QR receipts, split payouts, and instant settlement.',
    popularIndustries: [
      'cafes',
      'artisan-potters',
      'mobile-phone-repair',
      'bakeries',
      'market-stall-vendors',
    ],
    population: 790000,
    businessCount: 140000,
  },

  'bratislava-slovakia': {
    slug: 'bratislava-slovakia',
    name: 'Bratislava',
    city: 'Bratislava',
    country: 'Slovakia',
    title: 'Crypto Payments in Bratislava, Slovakia | PortalPay',
    metaDescription:
      'Instant settlement for Bratislava cafés, markets, and repair hubs.',
    localContext:
      'Danube-side SMEs leverage QR receipts, split payouts, and offline-first support.',
    popularIndustries: [
      'cafes',
      'mobile-phone-repair',
      'bakeries',
      'artisan-potters',
      'internet-cafes',
    ],
    population: 440000,
    businessCount: 85000,
  },

  'budapest-hungary': {
    slug: 'budapest-hungary',
    name: 'Budapest',
    city: 'Budapest',
    country: 'Hungary',
    title: 'Crypto Payments in Budapest, Hungary | PortalPay',
    metaDescription:
      'Low-fee crypto payments for Budapest cafés, thermal baths, and repair shops.',
    localContext:
      'Danube bridges and ruin bars adopt QR receipts, split payouts, and instant settlement.',
    popularIndustries: [
      'cafes',
      'bakeries',
      'mobile-phone-repair',
      'artisan-potters',
      'market-stall-vendors',
    ],
    population: 1750000,
    businessCount: 300000,
  },

  'minsk-belarus': {
    slug: 'minsk-belarus',
    name: 'Minsk',
    city: 'Minsk',
    country: 'Belarus',
    title: 'Crypto Payments in Minsk, Belarus | PortalPay',
    metaDescription:
      'Instant settlement for Minsk cafés, markets, and repair hubs.',
    localContext:
      'Urban SMEs adopt QR receipts, split payouts, and offline-first operations.',
    popularIndustries: [
      'cafes',
      'internet-cafes',
      'mobile-phone-repair',
      'market-stall-vendors',
      'bakeries',
    ],
    population: 2000000,
    businessCount: 280000,
  },

  'nicosia-cyprus': {
    slug: 'nicosia-cyprus',
    name: 'Nicosia',
    city: 'Nicosia',
    country: 'Cyprus',
    title: 'Crypto Payments in Nicosia, Cyprus | PortalPay',
    metaDescription:
      'Low-fee crypto payments for Nicosia cafés, markets, and repair shops.',
    localContext:
      'Mediterranean island capital SMEs leverage QR receipts, split payouts, and transparent operations.',
    popularIndustries: [
      'cafes',
      'artisan-potters',
      'mobile-phone-repair',
      'bakeries',
      'internet-cafes',
    ],
    population: 120000,
    businessCount: 22000,
  },

  // More Pacific Islands
  'rarotonga-cook-islands': {
    slug: 'rarotonga-cook-islands',
    name: 'Rarotonga',
    city: 'Rarotonga',
    country: 'Cook Islands',
    title: 'Crypto Payments in Rarotonga, Cook Islands | PortalPay',
    metaDescription:
      'QR ticketing for island ferries and instant settlement for tourism.',
    localContext:
      'Island paradise SMEs adopt QR tickets, split payouts, and offline-first receipts.',
    popularIndustries: [
      'small-ferry-operators',
      'cafes',
      'artisan-potters',
      'mobile-phone-repair',
      'internet-cafes',
    ],
    population: 10000,
    businessCount: 2000,
  },

  'tarawa-kiribati': {
    slug: 'tarawa-kiribati',
    name: 'Tarawa',
    city: 'Tarawa',
    country: 'Kiribati',
    title: 'Crypto Payments in Tarawa, Kiribati | PortalPay',
    metaDescription:
      'Instant-settlement QR payments for island markets and coastal services.',
    localContext:
      'Atoll SMEs adopt QR receipts, split payouts, and offline-first operations.',
    popularIndustries: [
      'small-ferry-operators',
      'market-stall-vendors',
      'cafes',
      'mobile-phone-repair',
      'internet-cafes',
    ],
    population: 64000,
    businessCount: 8000,
  },

  'yaren-nauru': {
    slug: 'yaren-nauru',
    name: 'Yaren',
    city: 'Yaren',
    country: 'Nauru',
    title: 'Crypto Payments in Yaren, Nauru | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for island markets and cafés.',
    localContext:
      'Tiny island nation SMEs leverage QR receipts, split payouts, and offline-first support.',
    popularIndustries: [
      'market-stall-vendors',
      'cafes',
      'mobile-phone-repair',
      'small-ferry-operators',
      'internet-cafes',
    ],
    population: 11000,
    businessCount: 1500,
  },

  'funafuti-tuvalu': {
    slug: 'funafuti-tuvalu',
    name: 'Funafuti',
    city: 'Funafuti',
    country: 'Tuvalu',
    title: 'Crypto Payments in Funafuti, Tuvalu | PortalPay',
    metaDescription:
      'Instant-settlement QR payments for atoll markets and cafés.',
    localContext:
      'Remote atoll SMEs adopt QR receipts, split payouts, and offline-first operations.',
    popularIndustries: [
      'small-ferry-operators',
      'market-stall-vendors',
      'cafes',
      'mobile-phone-repair',
      'internet-cafes',
    ],
    population: 6300,
    businessCount: 1000,
  },

  'hagatna-guam': {
    slug: 'hagatna-guam',
    name: 'Hagåtña',
    city: 'Hagåtña',
    country: 'Guam',
    title: 'Crypto Payments in Hagåtña, Guam | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for tourism, cafés, and repair hubs.',
    localContext:
      'Pacific territory SMEs adopt QR receipts, split payouts, and transparent operations.',
    popularIndustries: [
      'cafes',
      'small-ferry-operators',
      'mobile-phone-repair',
      'artisan-potters',
      'internet-cafes',
    ],
    population: 1100,
    businessCount: 250,
  },

  'saipan-northern-mariana-islands': {
    slug: 'saipan-northern-mariana-islands',
    name: 'Saipan',
    city: 'Saipan',
    country: 'Northern Mariana Islands',
    title: 'Crypto Payments in Saipan, Northern Mariana Islands | PortalPay',
    metaDescription:
      'Instant-settlement QR payments for tourism and coastal services.',
    localContext:
      'Island tourism SMEs leverage QR tickets, split payouts, and offline-first receipts.',
    popularIndustries: [
      'small-ferry-operators',
      'cafes',
      'artisan-potters',
      'mobile-phone-repair',
      'internet-cafes',
    ],
    population: 48000,
    businessCount: 7000,
  },

  // Additional African Countries
  'ndjamena-chad': {
    slug: 'ndjamena-chad',
    name: "N'Djamena",
    city: "N'Djamena",
    country: 'Chad',
    title: "Crypto Payments in N'Djamena, Chad | PortalPay",
    metaDescription:
      'QR receipts and instant settlement for markets, cafés, and repair hubs.',
    localContext:
      'Sahel capital SMEs leverage QR receipts, split payouts, and offline-first operations.',
    popularIndustries: [
      'market-stall-vendors',
      'mobile-phone-repair',
      'internet-cafes',
      'street-food-vendors',
      'village-savings-groups',
    ],
    population: 1500000,
    businessCount: 120000,
  },

  'bujumbura-burundi': {
    slug: 'bujumbura-burundi',
    name: 'Bujumbura',
    city: 'Bujumbura',
    country: 'Burundi',
    title: 'Crypto Payments in Bujumbura, Burundi | PortalPay',
    metaDescription:
      'Instant-settlement QR payments for lakeside markets and cafés.',
    localContext:
      'Lake Tanganyika SMEs adopt QR receipts, split payouts, and offline-first support.',
    popularIndustries: [
      'small-ferry-operators',
      'market-stall-vendors',
      'mobile-phone-repair',
      'internet-cafes',
      'village-savings-groups',
    ],
    population: 1000000,
    businessCount: 85000,
  },

  // North America - Additional Islands & Territories
  'nuuk-greenland': {
    slug: 'nuuk-greenland',
    name: 'Nuuk',
    city: 'Nuuk',
    country: 'Greenland',
    title: 'Crypto Payments in Nuuk, Greenland | PortalPay',
    metaDescription:
      'QR ticketing for Arctic ferries and instant settlement for cafés.',
    localContext:
      'Arctic capital SMEs leverage QR tickets, split payouts, and offline-first operations.',
    popularIndustries: [
      'small-ferry-operators',
      'cafes',
      'mobile-phone-repair',
      'artisan-potters',
      'hardware-shops',
    ],
    population: 19000,
    businessCount: 3000,
  },

  'hamilton-bermuda': {
    slug: 'hamilton-bermuda',
    name: 'Hamilton',
    city: 'Hamilton',
    country: 'Bermuda',
    title: 'Crypto Payments in Hamilton, Bermuda | PortalPay',
    metaDescription:
      'Instant-settlement QR payments for ferries, cafés, and repair shops.',
    localContext:
      'Atlantic island SMEs adopt QR tickets, split payouts, and transparent operations.',
    popularIndustries: [
      'small-ferry-operators',
      'cafes',
      'mobile-phone-repair',
      'artisan-potters',
      'bakeries',
    ],
    population: 1000,
    businessCount: 250,
  },

  'road-town-british-virgin-islands': {
    slug: 'road-town-british-virgin-islands',
    name: 'Road Town',
    city: 'Road Town',
    country: 'British Virgin Islands',
    title: 'Crypto Payments in Road Town, British Virgin Islands | PortalPay',
    metaDescription:
      'QR ticketing for yacht charters and instant settlement for tourism.',
    localContext:
      'Sailing hub SMEs adopt QR tickets, split payouts, and offline-first receipts.',
    popularIndustries: [
      'small-ferry-operators',
      'cafes',
      'artisan-potters',
      'mobile-phone-repair',
      'internet-cafes',
    ],
    population: 9000,
    businessCount: 2000,
  },

  'charlotte-amalie-us-virgin-islands': {
    slug: 'charlotte-amalie-us-virgin-islands',
    name: 'Charlotte Amalie',
    city: 'Charlotte Amalie',
    country: 'U.S. Virgin Islands',
    title: 'Crypto Payments in Charlotte Amalie, U.S. Virgin Islands | PortalPay',
    metaDescription:
      'Instant-settlement QR payments for cruise ports, cafés, and artisan vendors.',
    localContext:
      'Caribbean tourism SMEs leverage QR receipts, inventory tags, and split payouts.',
    popularIndustries: [
      'small-ferry-operators',
      'cafes',
      'artisan-potters',
      'mobile-phone-repair',
      'market-stall-vendors',
    ],
    population: 14000,
    businessCount: 3000,
  },

  'george-town-cayman-islands': {
    slug: 'george-town-cayman-islands',
    name: 'George Town',
    city: 'George Town',
    country: 'Cayman Islands',
    title: 'Crypto Payments in George Town, Cayman Islands | PortalPay',
    metaDescription:
      'Low-fee crypto payments for Grand Cayman cafés and tourism services.',
    localContext:
      'Financial hub SMEs adopt QR receipts, split payouts, and instant settlement.',
    popularIndustries: [
      'cafes',
      'small-ferry-operators',
      'mobile-phone-repair',
      'artisan-potters',
      'bakeries',
    ],
    population: 35000,
    businessCount: 7000,
  },

  'philipsburg-sint-maarten': {
    slug: 'philipsburg-sint-maarten',
    name: 'Philipsburg',
    city: 'Philipsburg',
    country: 'Sint Maarten',
    title: 'Crypto Payments in Philipsburg, Sint Maarten | PortalPay',
    metaDescription:
      'Instant-settlement QR payments for cruise tourism and coastal services.',
    localContext:
      'Duty-free vendors and tourism SMEs leverage QR receipts, split payouts, and transparent operations.',
    popularIndustries: [
      'small-ferry-operators',
      'cafes',
      'mobile-phone-repair',
      'market-stall-vendors',
      'artisan-potters',
    ],
    population: 42000,
    businessCount: 8000,
  },

  'marigot-saint-martin': {
    slug: 'marigot-saint-martin',
    name: 'Marigot',
    city: 'Marigot',
    country: 'Saint Martin',
    title: 'Crypto Payments in Marigot, Saint Martin | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for French side tourism and cafés.',
    localContext:
      'Island tourism SMEs adopt QR receipts, inventory tags, and split payouts.',
    popularIndustries: [
      'cafes',
      'small-ferry-operators',
      'artisan-potters',
      'mobile-phone-repair',
      'bakeries',
    ],
    population: 5700,
    businessCount: 1200,
  },

  'gustavia-saint-barthelemy': {
    slug: 'gustavia-saint-barthelemy',
    name: 'Gustavia',
    city: 'Gustavia',
    country: 'Saint Barthélemy',
    title: 'Crypto Payments in Gustavia, Saint Barthélemy | PortalPay',
    metaDescription:
      'Instant-settlement QR payments for luxury tourism and coastal services.',
    localContext:
      'Exclusive island SMEs leverage QR receipts, split payouts, and transparent operations.',
    popularIndustries: [
      'cafes',
      'small-ferry-operators',
      'artisan-potters',
      'mobile-phone-repair',
      'bakeries',
    ],
    population: 10000,
    businessCount: 2000,
  },

  'plymouth-montserrat': {
    slug: 'plymouth-montserrat',
    name: 'Plymouth',
    city: 'Plymouth',
    country: 'Montserrat',
    title: 'Crypto Payments in Plymouth, Montserrat | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for island markets and cafés.',
    localContext:
      'Volcanic island SMEs adopt QR receipts, split payouts, and offline-first support.',
    popularIndustries: [
      'small-ferry-operators',
      'market-stall-vendors',
      'cafes',
      'mobile-phone-repair',
      'artisan-potters',
    ],
    population: 5000,
    businessCount: 1000,
  },

  'the-valley-anguilla': {
    slug: 'the-valley-anguilla',
    name: 'The Valley',
    city: 'The Valley',
    country: 'Anguilla',
    title: 'Crypto Payments in The Valley, Anguilla | PortalPay',
    metaDescription:
      'Instant-settlement QR payments for island tourism and coastal services.',
    localContext:
      'Beach resort SMEs leverage QR tickets, split payouts, and offline-first receipts.',
    popularIndustries: [
      'small-ferry-operators',
      'cafes',
      'artisan-potters',
      'mobile-phone-repair',
      'internet-cafes',
    ],
    population: 1600,
    businessCount: 400,
  },

  'kralendijk-caribbean-netherlands': {
    slug: 'kralendijk-caribbean-netherlands',
    name: 'Kralendijk',
    city: 'Kralendijk',
    country: 'Caribbean Netherlands',
    title: 'Crypto Payments in Kralendijk, Caribbean Netherlands | PortalPay',
    metaDescription:
      'QR ticketing for diving tours and instant settlement for cafés.',
    localContext:
      'Bonaire diving tourism SMEs adopt QR tickets, split payouts, and transparent operations.',
    popularIndustries: [
      'small-ferry-operators',
      'cafes',
      'artisan-potters',
      'mobile-phone-repair',
      'internet-cafes',
    ],
    population: 20000,
    businessCount: 3500,
  },

  'fort-de-france-martinique': {
    slug: 'fort-de-france-martinique',
    name: 'Fort-de-France',
    city: 'Fort-de-France',
    country: 'Martinique',
    title: 'Crypto Payments in Fort-de-France, Martinique | PortalPay',
    metaDescription:
      'Instant-settlement QR payments for coastal services, cafés, and markets.',
    localContext:
      'French Caribbean territory SMEs adopt QR receipts, split payouts, and offline-first operations.',
    popularIndustries: [
      'small-ferry-operators',
      'cafes',
      'market-stall-vendors',
      'mobile-phone-repair',
      'bakeries',
    ],
    population: 85000,
    businessCount: 12000,
  },

  'basse-terre-guadeloupe': {
    slug: 'basse-terre-guadeloupe',
    name: 'Basse-Terre',
    city: 'Basse-Terre',
    country: 'Guadeloupe',
    title: 'Crypto Payments in Basse-Terre, Guadeloupe | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for island markets and cafés.',
    localContext:
      'Volcanic island SMEs leverage QR receipts, split payouts, and offline-first support.',
    popularIndustries: [
      'small-ferry-operators',
      'cafes',
      'market-stall-vendors',
      'mobile-phone-repair',
      'artisan-potters',
    ],
    population: 10000,
    businessCount: 2000,
  },

  // Remaining European Territories
  'torshavn-faroe-islands': {
    slug: 'torshavn-faroe-islands',
    name: 'Tórshavn',
    city: 'Tórshavn',
    country: 'Faroe Islands',
    title: 'Crypto Payments in Tórshavn, Faroe Islands | PortalPay',
    metaDescription:
      'QR ticketing for island ferries and instant settlement for cafés.',
    localContext:
      'North Atlantic island SMEs adopt QR tickets, split payouts, and offline-first operations.',
    popularIndustries: [
      'small-ferry-operators',
      'cafes',
      'mobile-phone-repair',
      'artisan-potters',
      'bakeries',
    ],
    population: 13000,
    businessCount: 2500,
  },

  'longyearbyen-svalbard': {
    slug: 'longyearbyen-svalbard',
    name: 'Longyearbyen',
    city: 'Longyearbyen',
    country: 'Svalbard and Jan Mayen',
    title: 'Crypto Payments in Longyearbyen, Svalbard | PortalPay',
    metaDescription:
      'Instant-settlement QR payments for Arctic tourism and cafés.',
    localContext:
      'Northernmost settlement SMEs leverage QR receipts, split payouts, and offline-first support.',
    popularIndustries: [
      'cafes',
      'mobile-phone-repair',
      'artisan-potters',
      'hardware-shops',
      'internet-cafes',
    ],
    population: 2400,
    businessCount: 500,
  },

  'douglas-isle-of-man': {
    slug: 'douglas-isle-of-man',
    name: 'Douglas',
    city: 'Douglas',
    country: 'Isle of Man',
    title: 'Crypto Payments in Douglas, Isle of Man | PortalPay',
    metaDescription:
      'Low-fee crypto payments for Douglas cafés, ferries, and repair shops.',
    localContext:
      'Irish Sea island SMEs adopt QR tickets, split payouts, and instant settlement.',
    popularIndustries: [
      'small-ferry-operators',
      'cafes',
      'mobile-phone-repair',
      'bakeries',
      'artisan-potters',
    ],
    population: 28000,
    businessCount: 6000,
  },

  'st-helier-jersey': {
    slug: 'st-helier-jersey',
    name: 'St. Helier',
    city: 'St. Helier',
    country: 'Jersey',
    title: 'Crypto Payments in St. Helier, Jersey | PortalPay',
    metaDescription:
      'Instant settlement for Jersey cafés, markets, and coastal services.',
    localContext:
      'Channel Island financial hub SMEs leverage QR receipts, split payouts, and transparent operations.',
    popularIndustries: [
      'cafes',
      'small-ferry-operators',
      'mobile-phone-repair',
      'bakeries',
      'artisan-potters',
    ],
    population: 34000,
    businessCount: 7000,
  },

  'st-peter-port-guernsey': {
    slug: 'st-peter-port-guernsey',
    name: 'St. Peter Port',
    city: 'St. Peter Port',
    country: 'Guernsey',
    title: 'Crypto Payments in St. Peter Port, Guernsey | PortalPay',
    metaDescription:
      'Low-fee crypto payments for Guernsey cafés, ferries, and repair shops.',
    localContext:
      'Channel Island SMEs adopt QR tickets, split payouts, and instant settlement.',
    popularIndustries: [
      'small-ferry-operators',
      'cafes',
      'mobile-phone-repair',
      'bakeries',
      'artisan-potters',
    ],
    population: 18000,
    businessCount: 4000,
  },

  'gibraltar-gibraltar': {
    slug: 'gibraltar-gibraltar',
    name: 'Gibraltar',
    city: 'Gibraltar',
    country: 'Gibraltar',
    title: 'Crypto Payments in Gibraltar | PortalPay',
    metaDescription:
      'Instant settlement for Gibraltar cafés, markets, and ferry services.',
    localContext:
      'Rock territory SMEs leverage QR receipts, split payouts, and offline-first operations.',
    popularIndustries: [
      'cafes',
      'small-ferry-operators',
      'mobile-phone-repair',
      'bakeries',
      'market-stall-vendors',
    ],
    population: 34000,
    businessCount: 7000,
  },

  'mariehamn-aland-islands': {
    slug: 'mariehamn-aland-islands',
    name: 'Mariehamn',
    city: 'Mariehamn',
    country: 'Åland Islands',
    title: 'Crypto Payments in Mariehamn, Åland Islands | PortalPay',
    metaDescription:
      'QR ticketing for Baltic ferries and instant settlement for cafés.',
    localContext:
      'Autonomous island territory SMEs adopt QR tickets, split payouts, and offline-first support.',
    popularIndustries: [
      'small-ferry-operators',
      'cafes',
      'mobile-phone-repair',
      'artisan-potters',
      'bakeries',
    ],
    population: 11500,
    businessCount: 2500,
  },

  // Remaining Oceania Territories
  'alofi-niue': {
    slug: 'alofi-niue',
    name: 'Alofi',
    city: 'Alofi',
    country: 'Niue',
    title: 'Crypto Payments in Alofi, Niue | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for island markets and cafés.',
    localContext:
      'Pacific microstate SMEs leverage QR receipts, split payouts, and offline-first operations.',
    popularIndustries: [
      'small-ferry-operators',
      'market-stall-vendors',
      'cafes',
      'mobile-phone-repair',
      'artisan-potters',
    ],
    population: 1600,
    businessCount: 400,
  },

  'fakaofo-tokelau': {
    slug: 'fakaofo-tokelau',
    name: 'Fakaofo',
    city: 'Fakaofo',
    country: 'Tokelau',
    title: 'Crypto Payments in Fakaofo, Tokelau | PortalPay',
    metaDescription:
      'Instant-settlement QR payments for atoll markets and cafés.',
    localContext:
      'Remote atoll SMEs adopt QR receipts, split payouts, and offline-first support.',
    popularIndustries: [
      'small-ferry-operators',
      'market-stall-vendors',
      'cafes',
      'mobile-phone-repair',
      'internet-cafes',
    ],
    population: 1500,
    businessCount: 300,
  },

  'mata-utu-wallis-and-futuna': {
    slug: 'mata-utu-wallis-and-futuna',
    name: 'Mata-Utu',
    city: 'Mata-Utu',
    country: 'Wallis and Futuna',
    title: 'Crypto Payments in Mata-Utu, Wallis and Futuna | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for island markets and cafés.',
    localContext:
      'French Pacific territory SMEs adopt QR receipts, split payouts, and offline-first operations.',
    popularIndustries: [
      'small-ferry-operators',
      'market-stall-vendors',
      'cafes',
      'mobile-phone-repair',
      'artisan-potters',
    ],
    population: 1100,
    businessCount: 250,
  },

  'kingston-norfolk-island': {
    slug: 'kingston-norfolk-island',
    name: 'Kingston',
    city: 'Kingston',
    country: 'Norfolk Island',
    title: 'Crypto Payments in Kingston, Norfolk Island | PortalPay',
    metaDescription:
      'Instant-settlement QR payments for island tourism and cafés.',
    localContext:
      'Remote Australian territory SMEs leverage QR receipts, split payouts, and offline-first support.',
    popularIndustries: [
      'cafes',
      'small-ferry-operators',
      'artisan-potters',
      'mobile-phone-repair',
      'internet-cafes',
    ],
    population: 1750,
    businessCount: 400,
  },

  'adamstown-pitcairn': {
    slug: 'adamstown-pitcairn',
    name: 'Adamstown',
    city: 'Adamstown',
    country: 'Pitcairn Islands',
    title: 'Crypto Payments in Adamstown, Pitcairn Islands | PortalPay',
    metaDescription:
      'QR receipts for the world\'s most remote island community.',
    localContext:
      'World\'s smallest territory adopts QR receipts and offline-first operations for tourism.',
    popularIndustries: [
      'small-ferry-operators',
      'artisan-potters',
      'cafes',
      'mobile-phone-repair',
      'market-stall-vendors',
    ],
    population: 50,
    businessCount: 10,
  },

  'jamestown-saint-helena': {
    slug: 'jamestown-saint-helena',
    name: 'Jamestown',
    city: 'Jamestown',
    country: 'Saint Helena',
    title: 'Crypto Payments in Jamestown, Saint Helena | PortalPay',
    metaDescription:
      'Instant-settlement QR payments for Atlantic island tourism and cafés.',
    localContext:
      'Remote island SMEs leverage QR receipts, split payouts, and offline-first operations.',
    popularIndustries: [
      'small-ferry-operators',
      'cafes',
      'artisan-potters',
      'mobile-phone-repair',
      'internet-cafes',
    ],
    population: 4500,
    businessCount: 900,
  },

  'el-aaiun-western-sahara': {
    slug: 'el-aaiun-western-sahara',
    name: 'El Aaiún',
    city: 'El Aaiún',
    country: 'Western Sahara',
    title: 'Crypto Payments in El Aaiún, Western Sahara | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for desert markets and repair hubs.',
    localContext:
      'Desert territory SMEs adopt QR receipts, split payouts, and offline-first support.',
    popularIndustries: [
      'market-stall-vendors',
      'mobile-phone-repair',
      'cafes',
      'internet-cafes',
      'street-food-vendors',
    ],
    population: 220000,
    businessCount: 25000,
  },

  'mamoudzou-mayotte': {
    slug: 'mamoudzou-mayotte',
    name: 'Mamoudzou',
    city: 'Mamoudzou',
    country: 'Mayotte',
    title: 'Crypto Payments in Mamoudzou, Mayotte | PortalPay',
    metaDescription:
      'Instant-settlement QR payments for island ferries, markets, and cafés.',
    localContext:
      'French Indian Ocean territory SMEs adopt QR tickets, split payouts, and offline-first operations.',
    popularIndustries: [
      'small-ferry-operators',
      'market-stall-vendors',
      'cafes',
      'mobile-phone-repair',
      'internet-cafes',
    ],
    population: 71000,
    businessCount: 10000,
  },

  'saint-denis-reunion': {
    slug: 'saint-denis-reunion',
    name: 'Saint-Denis',
    city: 'Saint-Denis',
    country: 'Réunion',
    title: 'Crypto Payments in Saint-Denis, Réunion | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for volcanic island cafés and markets.',
    localContext:
      'French Indian Ocean territory SMEs leverage QR receipts, split payouts, and offline-first support.',
    popularIndustries: [
      'cafes',
      'market-stall-vendors',
      'mobile-phone-repair',
      'small-ferry-operators',
      'bakeries',
    ],
    population: 150000,
    businessCount: 22000,
  },

  // Satirical Dictatorship Locations
  'pyongyang-north-korea': {
    slug: 'pyongyang-north-korea',
    name: 'Pyongyang',
    city: 'Pyongyang',
    country: 'North Korea',
    title: 'Crypto Payments in Pyongyang, North Korea | PortalPay',
    metaDescription:
      'Decentralized payments for the day the people take control. QR receipts for underground markets and secret cafés.',
    localContext:
      'When freedom arrives, Pyongyang\'s brave entrepreneurs will adopt QR receipts, transparent split payouts (so the Supreme Leader can\'t take a cut), and offline-first operations (because surveillance can\'t track what\'s not online). Underground markets await liberation.',
    popularIndustries: [
      'internet-cafes',
      'mobile-phone-repair',
      'community-radio-stations',
      'market-stall-vendors',
      'street-food-vendors',
    ],
    population: 3100000,
    businessCount: 50000,
  },
  // Major Global Economies Expansion
  // Japan
  'yokohama-japan': {
    slug: 'yokohama-japan',
    name: 'Yokohama',
    city: 'Yokohama',
    country: 'Japan',
    title: 'Crypto Payments in Yokohama, Japan | PortalPay',
    metaDescription:
      'Instant settlement and QR receipts for Yokohama cafés, bakeries, and repair hubs.',
    localContext:
      'Portside SMEs and bayside districts adopt QR receipts, split payouts, and offline-first operations.',
    popularIndustries: [
      'cafes',
      'bakeries',
      'mobile-phone-repair',
      'hardware-shops',
      'artisan-potters',
    ],
    population: 3700000,
    businessCount: 400000,
  },
  'nagoya-japan': {
    slug: 'nagoya-japan',
    name: 'Nagoya',
    city: 'Nagoya',
    country: 'Japan',
    title: 'Crypto Payments in Nagoya, Japan | PortalPay',
    metaDescription:
      'Low-fee crypto payments for Nagoya cafés, repair shops, and hardware vendors.',
    localContext:
      'Automotive-adjacent corridors adopt QR receipts, inventory tagging, and split payouts.',
    popularIndustries: [
      'hardware-shops',
      'cafes',
      'mobile-phone-repair',
      'bakeries',
      'retail',
    ],
    population: 2300000,
    businessCount: 350000,
  },
  'sapporo-japan': {
    slug: 'sapporo-japan',
    name: 'Sapporo',
    city: 'Sapporo',
    country: 'Japan',
    title: 'Crypto Payments in Sapporo, Japan | PortalPay',
    metaDescription:
      'Instant settlement and offline-first QR receipts for cafés, bakeries, and repair hubs.',
    localContext:
      'Winter tourism and neighborhood SMEs leverage QR receipts, split payouts, and transparent operations.',
    popularIndustries: [
      'cafes',
      'bakeries',
      'mobile-phone-repair',
      'hardware-shops',
      'artisan-potters',
    ],
    population: 1950000,
    businessCount: 250000,
  },
  'fukuoka-japan': {
    slug: 'fukuoka-japan',
    name: 'Fukuoka',
    city: 'Fukuoka',
    country: 'Japan',
    title: 'Crypto Payments in Fukuoka, Japan | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for street food, cafés, and repair hubs in Fukuoka.',
    localContext:
      'Yatai stalls and café corridors adopt QR receipts, split payouts, and offline-first workflows.',
    popularIndustries: [
      'street-food-vendors',
      'cafes',
      'mobile-phone-repair',
      'bakeries',
      'hardware-shops',
    ],
    population: 1600000,
    businessCount: 220000,
  },
  'kobe-japan': {
    slug: 'kobe-japan',
    name: 'Kobe',
    city: 'Kobe',
    country: 'Japan',
    title: 'Crypto Payments in Kobe, Japan | PortalPay',
    metaDescription:
      'Instant settlement for Kobe cafés, bakeries, and coastal services.',
    localContext:
      'Harbor districts leverage QR receipts, split payouts, and transparent inventory tagging.',
    popularIndustries: [
      'cafes',
      'bakeries',
      'mobile-phone-repair',
      'small-ferry-operators',
      'artisan-potters',
    ],
    population: 1500000,
    businessCount: 210000,
  },
  'kyoto-japan': {
    slug: 'kyoto-japan',
    name: 'Kyoto',
    city: 'Kyoto',
    country: 'Japan',
    title: 'Crypto Payments in Kyoto, Japan | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for artisan markets, cafés, and repair hubs in Kyoto.',
    localContext:
      'Historic artisan districts adopt QR receipts, inventory tagging, and split payouts.',
    popularIndustries: [
      'artisan-potters',
      'cafes',
      'bakeries',
      'mobile-phone-repair',
      'market-stall-vendors',
    ],
    population: 1500000,
    businessCount: 200000,
  },

  // Germany
  'hamburg-germany': {
    slug: 'hamburg-germany',
    name: 'Hamburg',
    city: 'Hamburg',
    country: 'Germany',
    title: 'Crypto Payments in Hamburg, Germany | PortalPay',
    metaDescription:
      'Instant settlement and QR tickets for harbor ferries, cafés, and repair hubs in Hamburg.',
    localContext:
      'Port SMEs adopt QR tickets, split payouts, and offline-first receipts; neighborhoods leverage transparent QR receipts.',
    popularIndustries: [
      'small-ferry-operators',
      'cafes',
      'mobile-phone-repair',
      'bakeries',
      'hardware-shops',
    ],
    population: 1900000,
    businessCount: 300000,
  },
  'cologne-germany': {
    slug: 'cologne-germany',
    name: 'Cologne',
    city: 'Cologne',
    country: 'Germany',
    title: 'Crypto Payments in Cologne, Germany | PortalPay',
    metaDescription:
      'Low-fee crypto payments for Cologne cafés, bakeries, and repair shops.',
    localContext:
      'Cathedral district SMEs leverage QR receipts, split payouts, and offline-first operations.',
    popularIndustries: [
      'cafes',
      'bakeries',
      'mobile-phone-repair',
      'artisan-potters',
      'hardware-shops',
    ],
    population: 1100000,
    businessCount: 200000,
  },
  'frankfurt-germany': {
    slug: 'frankfurt-germany',
    name: 'Frankfurt',
    city: 'Frankfurt',
    country: 'Germany',
    title: 'Crypto Payments in Frankfurt, Germany | PortalPay',
    metaDescription:
      'Instant settlement for Frankfurt cafés, retail, and repair hubs.',
    localContext:
      'Financial district and neighborhoods adopt QR receipts, split payouts, and transparent inventory.',
    popularIndustries: [
      'cafes',
      'retail',
      'mobile-phone-repair',
      'bakeries',
      'hardware-shops',
    ],
    population: 770000,
    businessCount: 180000,
  },
  'stuttgart-germany': {
    slug: 'stuttgart-germany',
    name: 'Stuttgart',
    city: 'Stuttgart',
    country: 'Germany',
    title: 'Crypto Payments in Stuttgart, Germany | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for hardware, cafés, and auto repair.',
    localContext:
      'Manufacturing-adjacent SMEs adopt QR receipts, inventory tags, and split payouts.',
    popularIndustries: [
      'hardware-shops',
      'auto-repair',
      'cafes',
      'mobile-phone-repair',
      'bakeries',
    ],
    population: 630000,
    businessCount: 150000,
  },
  'dusseldorf-germany': {
    slug: 'dusseldorf-germany',
    name: 'Düsseldorf',
    city: 'Düsseldorf',
    country: 'Germany',
    title: 'Crypto Payments in Düsseldorf, Germany | PortalPay',
    metaDescription:
      'Low-fee crypto payments for Düsseldorf cafés, retail, and repair hubs.',
    localContext:
      'Königsallee boutiques and cafés adopt QR receipts, split payouts, and offline-first workflows.',
    popularIndustries: [
      'retail',
      'cafes',
      'mobile-phone-repair',
      'bakeries',
      'artisan-potters',
    ],
    population: 620000,
    businessCount: 140000,
  },
  'leipzig-germany': {
    slug: 'leipzig-germany',
    name: 'Leipzig',
    city: 'Leipzig',
    country: 'Germany',
    title: 'Crypto Payments in Leipzig, Germany | PortalPay',
    metaDescription:
      'Instant settlement for Leipzig cafés, artisan vendors, and repair shops.',
    localContext:
      'Creative corridors leverage QR receipts, split payouts, and transparent inventory tagging.',
    popularIndustries: [
      'cafes',
      'artisan-potters',
      'mobile-phone-repair',
      'bakeries',
      'hardware-shops',
    ],
    population: 610000,
    businessCount: 120000,
  },

  // United Kingdom
  'birmingham-uk': {
    slug: 'birmingham-uk',
    name: 'Birmingham',
    city: 'Birmingham',
    country: 'United Kingdom',
    title: 'Crypto Payments in Birmingham, UK | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for Birmingham cafés, markets, and repair hubs.',
    localContext:
      'Bullring and neighborhood SMEs adopt split payouts, QR receipts, and offline-first operations.',
    popularIndustries: [
      'cafes',
      'market-stall-vendors',
      'mobile-phone-repair',
      'bakeries',
      'hardware-shops',
    ],
    population: 1100000,
    businessCount: 200000,
  },
  'leeds-uk': {
    slug: 'leeds-uk',
    name: 'Leeds',
    city: 'Leeds',
    country: 'United Kingdom',
    title: 'Crypto Payments in Leeds, UK | PortalPay',
    metaDescription:
      'Instant settlement for Leeds cafés, bakeries, and repair shops.',
    localContext:
      'Arcade markets and SME corridors leverage QR receipts, split payouts, and transparent inventory tagging.',
    popularIndustries: [
      'cafes',
      'bakeries',
      'mobile-phone-repair',
      'artisan-potters',
      'market-stall-vendors',
    ],
    population: 800000,
    businessCount: 140000,
  },
  'glasgow-uk': {
    slug: 'glasgow-uk',
    name: 'Glasgow',
    city: 'Glasgow',
    country: 'United Kingdom',
    title: 'Crypto Payments in Glasgow, UK | PortalPay',
    metaDescription:
      'Low-fee crypto payments for Glasgow cafés, markets, and repair hubs.',
    localContext:
      'Merchant City vendors and neighborhoods adopt QR receipts, split payouts, and offline-first reliability.',
    popularIndustries: [
      'cafes',
      'market-stall-vendors',
      'mobile-phone-repair',
      'bakeries',
      'hardware-shops',
    ],
    population: 630000,
    businessCount: 120000,
  },
  'bristol-uk': {
    slug: 'bristol-uk',
    name: 'Bristol',
    city: 'Bristol',
    country: 'United Kingdom',
    title: 'Crypto Payments in Bristol, UK | PortalPay',
    metaDescription:
      'Instant settlement and QR receipts for Bristol cafés, markets, and repair shops.',
    localContext:
      'Harborside SMEs leverage QR receipts, split payouts, and transparent inventory tagging.',
    popularIndustries: [
      'cafes',
      'market-stall-vendors',
      'mobile-phone-repair',
      'bakeries',
      'artisan-potters',
    ],
    population: 470000,
    businessCount: 90000,
  },
  'liverpool-uk': {
    slug: 'liverpool-uk',
    name: 'Liverpool',
    city: 'Liverpool',
    country: 'United Kingdom',
    title: 'Crypto Payments in Liverpool, UK | PortalPay',
    metaDescription:
      'Low-fee crypto payments for Liverpool cafés, markets, and coastal services.',
    localContext:
      'Waterfront SMEs adopt QR receipts, split payouts, and offline-first operations.',
    popularIndustries: [
      'cafes',
      'small-ferry-operators',
      'mobile-phone-repair',
      'bakeries',
      'market-stall-vendors',
    ],
    population: 490000,
    businessCount: 95000,
  },

  // France
  'marseille-france': {
    slug: 'marseille-france',
    name: 'Marseille',
    city: 'Marseille',
    country: 'France',
    title: 'Crypto Payments in Marseille, France | PortalPay',
    metaDescription:
      'Instant settlement and QR tickets for Marseille coastal services, cafés, and repair hubs.',
    localContext:
      'Vieux-Port SMEs adopt QR tickets, split payouts, and offline-first receipts.',
    popularIndustries: [
      'small-ferry-operators',
      'cafes',
      'mobile-phone-repair',
      'bakeries',
      'artisan-potters',
    ],
    population: 870000,
    businessCount: 150000,
  },
  'toulouse-france': {
    slug: 'toulouse-france',
    name: 'Toulouse',
    city: 'Toulouse',
    country: 'France',
    title: 'Crypto Payments in Toulouse, France | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for cafés, bakeries, and hardware corridors.',
    localContext:
      'Aerospace-adjacent SMEs leverage QR receipts, inventory tagging, and split payouts.',
    popularIndustries: [
      'hardware-shops',
      'cafes',
      'bakeries',
      'mobile-phone-repair',
      'artisan-potters',
    ],
    population: 500000,
    businessCount: 110000,
  },
  'nice-france': {
    slug: 'nice-france',
    name: 'Nice',
    city: 'Nice',
    country: 'France',
    title: 'Crypto Payments in Nice, France | PortalPay',
    metaDescription:
      'Instant settlement for Nice cafés, tourism, and coastal services.',
    localContext:
      'Promenade des Anglais SMEs adopt QR receipts, split payouts, and transparent operations.',
    popularIndustries: [
      'cafes',
      'small-ferry-operators',
      'mobile-phone-repair',
      'bakeries',
      'artisan-potters',
    ],
    population: 340000,
    businessCount: 80000,
  },
  'bordeaux-france': {
    slug: 'bordeaux-france',
    name: 'Bordeaux',
    city: 'Bordeaux',
    country: 'France',
    title: 'Crypto Payments in Bordeaux, France | PortalPay',
    metaDescription:
      'Low-fee crypto payments for Bordeaux cafés, artisan vendors, and repair shops.',
    localContext:
      'Historic center SMEs leverage QR receipts, split payouts, and offline-first operations.',
    popularIndustries: [
      'cafes',
      'artisan-potters',
      'mobile-phone-repair',
      'bakeries',
      'market-stall-vendors',
    ],
    population: 260000,
    businessCount: 70000,
  },
  'lille-france': {
    slug: 'lille-france',
    name: 'Lille',
    city: 'Lille',
    country: 'France',
    title: 'Crypto Payments in Lille, France | PortalPay',
    metaDescription:
      'Instant settlement for Lille cafés, markets, and repair hubs.',
    localContext:
      'Euro-district SMEs adopt QR receipts, split payouts, and transparent inventory tagging.',
    popularIndustries: [
      'market-stall-vendors',
      'cafes',
      'mobile-phone-repair',
      'bakeries',
      'artisan-potters',
    ],
    population: 230000,
    businessCount: 65000,
  },

  // Italy
  'naples-italy': {
    slug: 'naples-italy',
    name: 'Naples',
    city: 'Naples',
    country: 'Italy',
    title: 'Crypto Payments in Naples, Italy | PortalPay',
    metaDescription:
      'QR tickets and instant settlement for coastal services, cafés, and repair hubs in Naples.',
    localContext:
      'Bay of Naples SMEs adopt QR tickets, split payouts, and offline-first receipts.',
    popularIndustries: [
      'small-ferry-operators',
      'cafes',
      'bakeries',
      'mobile-phone-repair',
      'artisan-potters',
    ],
    population: 950000,
    businessCount: 160000,
  },
  'turin-italy': {
    slug: 'turin-italy',
    name: 'Turin',
    city: 'Turin',
    country: 'Italy',
    title: 'Crypto Payments in Turin, Italy | PortalPay',
    metaDescription:
      'Instant settlement for Turin hardware, cafés, and repair hubs.',
    localContext:
      'Manufacturing-adjacent SMEs leverage QR receipts, inventory tags, and split payouts.',
    popularIndustries: [
      'hardware-shops',
      'auto-repair',
      'cafes',
      'mobile-phone-repair',
      'bakeries',
    ],
    population: 850000,
    businessCount: 150000,
  },
  'palermo-italy': {
    slug: 'palermo-italy',
    name: 'Palermo',
    city: 'Palermo',
    country: 'Italy',
    title: 'Crypto Payments in Palermo, Italy | PortalPay',
    metaDescription:
      'Low-fee crypto payments for Palermo cafés, coastal services, and repair shops.',
    localContext:
      'Sicilian SMEs adopt QR receipts, split payouts, and offline-first operations.',
    popularIndustries: [
      'small-ferry-operators',
      'cafes',
      'mobile-phone-repair',
      'bakeries',
      'artisan-potters',
    ],
    population: 650000,
    businessCount: 100000,
  },
  'bologna-italy': {
    slug: 'bologna-italy',
    name: 'Bologna',
    city: 'Bologna',
    country: 'Italy',
    title: 'Crypto Payments in Bologna, Italy | PortalPay',
    metaDescription:
      'Instant settlement for Bologna cafés, markets, and repair hubs.',
    localContext:
      'University and market districts leverage QR receipts, split payouts, and transparent inventory tagging.',
    popularIndustries: [
      'cafes',
      'market-stall-vendors',
      'mobile-phone-repair',
      'bakeries',
      'artisan-potters',
    ],
    population: 390000,
    businessCount: 90000,
  },
  'florence-italy': {
    slug: 'florence-italy',
    name: 'Florence',
    city: 'Florence',
    country: 'Italy',
    title: 'Crypto Payments in Florence, Italy | PortalPay',
    metaDescription:
      'Low-fee crypto payments for Florence artisan vendors, cafés, and repair shops.',
    localContext:
      'Historic artisan corridors adopt QR receipts, inventory tagging, and split payouts.',
    popularIndustries: [
      'artisan-potters',
      'cafes',
      'mobile-phone-repair',
      'bakeries',
      'market-stall-vendors',
    ],
    population: 380000,
    businessCount: 85000,
  },
  'genoa-italy': {
    slug: 'genoa-italy',
    name: 'Genoa',
    city: 'Genoa',
    country: 'Italy',
    title: 'Crypto Payments in Genoa, Italy | PortalPay',
    metaDescription:
      'Instant settlement and QR receipts for Genoa coastal services, cafés, and repair hubs.',
    localContext:
      'Port SMEs leverage QR receipts, split payouts, and transparent operations.',
    popularIndustries: [
      'small-ferry-operators',
      'cafes',
      'mobile-phone-repair',
      'bakeries',
      'hardware-shops',
    ],
    population: 580000,
    businessCount: 110000,
  },

  // South Korea
  'incheon-south-korea': {
    slug: 'incheon-south-korea',
    name: 'Incheon',
    city: 'Incheon',
    country: 'South Korea',
    title: 'Crypto Payments in Incheon, South Korea | PortalPay',
    metaDescription:
      'Low-fee crypto payments for Incheon ports, cafés, and repair shops.',
    localContext:
      'Coastal SMEs adopt QR receipts, split payouts, and offline-first support.',
    popularIndustries: [
      'small-ferry-operators',
      'cafes',
      'mobile-phone-repair',
      'bakeries',
      'hardware-shops',
    ],
    population: 3000000,
    businessCount: 400000,
  },
  'daegu-south-korea': {
    slug: 'daegu-south-korea',
    name: 'Daegu',
    city: 'Daegu',
    country: 'South Korea',
    title: 'Crypto Payments in Daegu, South Korea | PortalPay',
    metaDescription:
      'Instant settlement for Daegu street food, cafés, and hardware corridors.',
    localContext:
      'Traditional markets and industrial SMEs leverage QR receipts, inventory tags, and split payouts.',
    popularIndustries: [
      'street-food-vendors',
      'hardware-shops',
      'cafes',
      'mobile-phone-repair',
      'bakeries',
    ],
    population: 2400000,
    businessCount: 320000,
  },
  'daejeon-south-korea': {
    slug: 'daejeon-south-korea',
    name: 'Daejeon',
    city: 'Daejeon',
    country: 'South Korea',
    title: 'Crypto Payments in Daejeon, South Korea | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for cafés, repair hubs, and labs.',
    localContext:
      'Research corridor SMEs adopt split payouts, QR receipts, and offline-first operations.',
    popularIndustries: [
      'internet-cafes',
      'cafes',
      'mobile-phone-repair',
      'bakeries',
      'hardware-shops',
    ],
    population: 1500000,
    businessCount: 250000,
  },
  'gwangju-south-korea': {
    slug: 'gwangju-south-korea',
    name: 'Gwangju',
    city: 'Gwangju',
    country: 'South Korea',
    title: 'Crypto Payments in Gwangju, South Korea | PortalPay',
    metaDescription:
      'Instant settlement for Gwangju cafés, street vendors, and repair hubs.',
    localContext:
      'Cultural districts and markets leverage QR receipts, split payouts, and transparent inventory.',
    popularIndustries: [
      'street-food-vendors',
      'cafes',
      'mobile-phone-repair',
      'bakeries',
      'hardware-shops',
    ],
    population: 1500000,
    businessCount: 220000,
  },
  'ulsan-south-korea': {
    slug: 'ulsan-south-korea',
    name: 'Ulsan',
    city: 'Ulsan',
    country: 'South Korea',
    title: 'Crypto Payments in Ulsan, South Korea | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for hardware, auto repair, and cafés.',
    localContext:
      'Industrial SMEs adopt QR receipts, inventory tags, and split payouts.',
    popularIndustries: [
      'hardware-shops',
      'auto-repair',
      'cafes',
      'mobile-phone-repair',
      'bakeries',
    ],
    population: 1100000,
    businessCount: 180000,
  },

  // China
  'chengdu-china': {
    slug: 'chengdu-china',
    name: 'Chengdu',
    city: 'Chengdu',
    country: 'China',
    title: 'Crypto Payments in Chengdu, China | PortalPay',
    metaDescription:
      'Instant settlement for Chengdu street food, cafés, and repair hubs.',
    localContext:
      'Tea houses and markets adopt QR receipts, split payouts, and offline-first operations.',
    popularIndustries: [
      'street-food-vendors',
      'cafes',
      'mobile-phone-repair',
      'hardware-shops',
      'bakeries',
    ],
    population: 16000000,
    businessCount: 1800000,
  },
  'chongqing-china': {
    slug: 'chongqing-china',
    name: 'Chongqing',
    city: 'Chongqing',
    country: 'China',
    title: 'Crypto Payments in Chongqing, China | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for Chongqing markets, cafés, and repair shops.',
    localContext:
      'Mountain metropolis SMEs leverage QR receipts, inventory tagging, and split payouts.',
    popularIndustries: [
      'market-stall-vendors',
      'street-food-vendors',
      'cafes',
      'mobile-phone-repair',
      'hardware-shops',
    ],
    population: 31000000,
    businessCount: 2500000,
  },
  'wuhan-china': {
    slug: 'wuhan-china',
    name: 'Wuhan',
    city: 'Wuhan',
    country: 'China',
    title: 'Crypto Payments in Wuhan, China | PortalPay',
    metaDescription:
      'Instant settlement for Wuhan hardware, cafés, and repair hubs.',
    localContext:
      'River city SMEs adopt QR receipts, inventory tags, and split payouts.',
    popularIndustries: [
      'hardware-shops',
      'cafes',
      'mobile-phone-repair',
      'bakeries',
      'market-stall-vendors',
    ],
    population: 12000000,
    businessCount: 1500000,
  },
  'xian-china': {
    slug: 'xian-china',
    name: "Xi'an",
    city: "Xi'an",
    country: 'China',
    title: "Crypto Payments in Xi'an, China | PortalPay",
    metaDescription:
      'QR receipts and instant settlement for artisan vendors, cafés, and street food.',
    localContext:
      'Historic craft districts and night markets leverage QR receipts, split payouts, and offline-first support.',
    popularIndustries: [
      'artisan-potters',
      'market-stall-vendors',
      'street-food-vendors',
      'cafes',
      'mobile-phone-repair',
    ],
    population: 9000000,
    businessCount: 1100000,
  },
  'hangzhou-china': {
    slug: 'hangzhou-china',
    name: 'Hangzhou',
    city: 'Hangzhou',
    country: 'China',
    title: 'Crypto Payments in Hangzhou, China | PortalPay',
    metaDescription:
      'Instant settlement for Hangzhou cafés, tech repair, and bakeries.',
    localContext:
      'West Lake and tech corridors adopt QR receipts, split payouts, and offline-first operations.',
    popularIndustries: [
      'cafes',
      'mobile-phone-repair',
      'internet-cafes',
      'bakeries',
      'hardware-shops',
    ],
    population: 10000000,
    businessCount: 1300000,
  },
  'nanjing-china': {
    slug: 'nanjing-china',
    name: 'Nanjing',
    city: 'Nanjing',
    country: 'China',
    title: 'Crypto Payments in Nanjing, China | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for Nanjing cafés, markets, and repair hubs.',
    localContext:
      'Historic capital SMEs leverage QR receipts, inventory tagging, and split payouts.',
    popularIndustries: [
      'cafes',
      'mobile-phone-repair',
      'bakeries',
      'hardware-shops',
      'market-stall-vendors',
    ],
    population: 9300000,
    businessCount: 1200000,
  },
  'tianjin-china': {
    slug: 'tianjin-china',
    name: 'Tianjin',
    city: 'Tianjin',
    country: 'China',
    title: 'Crypto Payments in Tianjin, China | PortalPay',
    metaDescription:
      'Instant settlement and QR tickets for Tianjin coastal services, cafés, and repair hubs.',
    localContext:
      'Port-city SMEs adopt QR tickets, split payouts, and offline-first receipts.',
    popularIndustries: [
      'small-ferry-operators',
      'hardware-shops',
      'cafes',
      'mobile-phone-repair',
      'bakeries',
    ],
    population: 13000000,
    businessCount: 1500000,
  },
  'suzhou-china': {
    slug: 'suzhou-china',
    name: 'Suzhou',
    city: 'Suzhou',
    country: 'China',
    title: 'Crypto Payments in Suzhou, China | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for Suzhou hardware, cafés, and repair hubs.',
    localContext:
      'Manufacturing corridors adopt QR receipts, inventory tagging, and split payouts.',
    popularIndustries: [
      'hardware-shops',
      'cafes',
      'mobile-phone-repair',
      'bakeries',
      'retail',
    ],
    population: 12700000,
    businessCount: 1400000,
  },

  // Australia
  'brisbane-australia': {
    slug: 'brisbane-australia',
    name: 'Brisbane',
    city: 'Brisbane',
    country: 'Australia',
    title: 'Crypto Payments in Brisbane, Australia | PortalPay',
    metaDescription:
      'Instant settlement and QR tickets for Brisbane ferries, cafés, and repair hubs.',
    localContext:
      'River City SMEs adopt QR tickets, split payouts, and offline-first receipts.',
    popularIndustries: [
      'small-ferry-operators',
      'cafes',
      'bakeries',
      'mobile-phone-repair',
      'hardware-shops',
    ],
    population: 2600000,
    businessCount: 350000,
  },
  'perth-australia': {
    slug: 'perth-australia',
    name: 'Perth',
    city: 'Perth',
    country: 'Australia',
    title: 'Crypto Payments in Perth, Australia | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for Perth cafés, coastal services, and repair hubs.',
    localContext:
      'Western Australia SMEs leverage QR receipts, split payouts, and transparent operations.',
    popularIndustries: [
      'cafes',
      'mobile-phone-repair',
      'bakeries',
      'hardware-shops',
      'small-ferry-operators',
    ],
    population: 2100000,
    businessCount: 300000,
  },
  'adelaide-australia': {
    slug: 'adelaide-australia',
    name: 'Adelaide',
    city: 'Adelaide',
    country: 'Australia',
    title: 'Crypto Payments in Adelaide, Australia | PortalPay',
    metaDescription:
      'Low-fee crypto payments for Adelaide cafés, artisan vendors, and repair shops.',
    localContext:
      'Festival city SMEs adopt QR receipts, split payouts, and offline-first operations.',
    popularIndustries: [
      'cafes',
      'artisan-potters',
      'mobile-phone-repair',
      'bakeries',
      'hardware-shops',
    ],
    population: 1400000,
    businessCount: 220000,
  },

  // Spain
  'valencia-spain': {
    slug: 'valencia-spain',
    name: 'Valencia',
    city: 'Valencia',
    country: 'Spain',
    title: 'Crypto Payments in Valencia, Spain | PortalPay',
    metaDescription:
      'Instant settlement and QR tickets for Valencia coastal services, cafés, and repair hubs.',
    localContext:
      'Port SMEs adopt QR tickets, split payouts, and offline-first receipts.',
    popularIndustries: [
      'small-ferry-operators',
      'cafes',
      'bakeries',
      'mobile-phone-repair',
      'artisan-potters',
    ],
    population: 800000,
    businessCount: 140000,
  },
  'seville-spain': {
    slug: 'seville-spain',
    name: 'Seville',
    city: 'Seville',
    country: 'Spain',
    title: 'Crypto Payments in Seville, Spain | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for Seville cafés, markets, and repair hubs.',
    localContext:
      'Historic districts and market SMEs leverage QR receipts, split payouts, and transparent inventory.',
    popularIndustries: [
      'cafes',
      'market-stall-vendors',
      'mobile-phone-repair',
      'bakeries',
      'artisan-potters',
    ],
    population: 700000,
    businessCount: 120000,
  },
  'malaga-spain': {
    slug: 'malaga-spain',
    name: 'Málaga',
    city: 'Málaga',
    country: 'Spain',
    title: 'Crypto Payments in Málaga, Spain | PortalPay',
    metaDescription:
      'Instant settlement for Málaga coastal services, cafés, and repair shops.',
    localContext:
      'Costa del Sol SMEs adopt QR receipts, split payouts, and offline-first reliability.',
    popularIndustries: [
      'small-ferry-operators',
      'cafes',
      'mobile-phone-repair',
      'bakeries',
      'artisan-potters',
    ],
    population: 580000,
    businessCount: 100000,
  },
  'bilbao-spain': {
    slug: 'bilbao-spain',
    name: 'Bilbao',
    city: 'Bilbao',
    country: 'Spain',
    title: 'Crypto Payments in Bilbao, Spain | PortalPay',
    metaDescription:
      'Low-fee crypto payments for Bilbao cafés, artisan vendors, and repair hubs.',
    localContext:
      'Riverfront and museum districts leverage QR receipts, split payouts, and transparent operations.',
    popularIndustries: [
      'cafes',
      'artisan-potters',
      'mobile-phone-repair',
      'bakeries',
      'hardware-shops',
    ],
    population: 350000,
    businessCount: 80000,
  },
  'zaragoza-spain': {
    slug: 'zaragoza-spain',
    name: 'Zaragoza',
    city: 'Zaragoza',
    country: 'Spain',
    title: 'Crypto Payments in Zaragoza, Spain | PortalPay',
    metaDescription:
      'Instant settlement for Zaragoza cafés, markets, and repair shops.',
    localContext:
      'Ebro corridor SMEs adopt QR receipts, inventory tagging, and split payouts.',
    popularIndustries: [
      'hardware-shops',
      'cafes',
      'mobile-phone-repair',
      'bakeries',
      'market-stall-vendors',
    ],
    population: 680000,
    businessCount: 110000,
  },

  // Netherlands
  'rotterdam-netherlands': {
    slug: 'rotterdam-netherlands',
    name: 'Rotterdam',
    city: 'Rotterdam',
    country: 'Netherlands',
    title: 'Crypto Payments in Rotterdam, Netherlands | PortalPay',
    metaDescription:
      'QR tickets and instant settlement for Rotterdam coastal services, cafés, and repair hubs.',
    localContext:
      'Port SMEs adopt QR tickets, split payouts, and offline-first operations.',
    popularIndustries: [
      'small-ferry-operators',
      'cafes',
      'mobile-phone-repair',
      'bakeries',
      'hardware-shops',
    ],
    population: 650000,
    businessCount: 140000,
  },
  'the-hague-netherlands': {
    slug: 'the-hague-netherlands',
    name: 'The Hague',
    city: 'The Hague',
    country: 'Netherlands',
    title: 'Crypto Payments in The Hague, Netherlands | PortalPay',
    metaDescription:
      'Instant settlement for Hague cafés, bakeries, and repair shops.',
    localContext:
      'Government district SMEs leverage QR receipts, split payouts, and transparent inventory.',
    popularIndustries: [
      'cafes',
      'bakeries',
      'mobile-phone-repair',
      'artisan-potters',
      'market-stall-vendors',
    ],
    population: 560000,
    businessCount: 120000,
  },
  'utrecht-netherlands': {
    slug: 'utrecht-netherlands',
    name: 'Utrecht',
    city: 'Utrecht',
    country: 'Netherlands',
    title: 'Crypto Payments in Utrecht, Netherlands | PortalPay',
    metaDescription:
      'Low-fee crypto payments for Utrecht cafés, artisan vendors, and repair hubs.',
    localContext:
      'Canal-side SMEs adopt QR receipts, split payouts, and offline-first support.',
    popularIndustries: [
      'cafes',
      'bakeries',
      'mobile-phone-repair',
      'artisan-potters',
      'internet-cafes',
    ],
    population: 360000,
    businessCount: 80000,
  },
  'eindhoven-netherlands': {
    slug: 'eindhoven-netherlands',
    name: 'Eindhoven',
    city: 'Eindhoven',
    country: 'Netherlands',
    title: 'Crypto Payments in Eindhoven, Netherlands | PortalPay',
    metaDescription:
      'Instant settlement for Eindhoven hardware, cafés, and repair hubs.',
    localContext:
      'High-tech campus SMEs leverage QR receipts, inventory tags, and split payouts.',
    popularIndustries: [
      'hardware-shops',
      'cafes',
      'mobile-phone-repair',
      'bakeries',
      'retail',
    ],
    population: 240000,
    businessCount: 65000,
  },
  'groningen-netherlands': {
    slug: 'groningen-netherlands',
    name: 'Groningen',
    city: 'Groningen',
    country: 'Netherlands',
    title: 'Crypto Payments in Groningen, Netherlands | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for Groningen cafés, student markets, and repair hubs.',
    localContext:
      'University town SMEs adopt QR receipts, split payouts, and offline-first operations.',
    popularIndustries: [
      'cafes',
      'mobile-phone-repair',
      'bakeries',
      'internet-cafes',
      'artisan-potters',
    ],
    population: 235000,
    businessCount: 60000,
  },

  // Saudi Arabia
  'dammam-saudi-arabia': {
    slug: 'dammam-saudi-arabia',
    name: 'Dammam',
    city: 'Dammam',
    country: 'Saudi Arabia',
    title: 'Crypto Payments in Dammam, Saudi Arabia | PortalPay',
    metaDescription:
      'Instant settlement for Dammam retail, cafés, and repair hubs.',
    localContext:
      'Eastern Province SMEs adopt QR receipts, split payouts, and transparent operations.',
    popularIndustries: [
      'retail',
      'cafes',
      'mobile-phone-repair',
      'bakeries',
      'hardware-shops',
    ],
    population: 1250000,
    businessCount: 200000,
  },
  'mecca-saudi-arabia': {
    slug: 'mecca-saudi-arabia',
    name: 'Mecca',
    city: 'Mecca',
    country: 'Saudi Arabia',
    title: 'Crypto Payments in Mecca, Saudi Arabia | PortalPay',
    metaDescription:
      'Low-fee crypto payments for Mecca retail, cafés, and market vendors.',
    localContext:
      'Pilgrimage season SMEs leverage QR receipts, inventory tagging, and split payouts.',
    popularIndustries: [
      'retail',
      'cafes',
      'mobile-phone-repair',
      'bakeries',
      'market-stall-vendors',
    ],
    population: 2000000,
    businessCount: 300000,
  },
  'medina-saudi-arabia': {
    slug: 'medina-saudi-arabia',
    name: 'Medina',
    city: 'Medina',
    country: 'Saudi Arabia',
    title: 'Crypto Payments in Medina, Saudi Arabia | PortalPay',
    metaDescription:
      'Instant settlement for Medina retail, cafés, and repair shops.',
    localContext:
      'Religious tourism SMEs adopt QR receipts, split payouts, and offline-first reliability.',
    popularIndustries: [
      'retail',
      'cafes',
      'mobile-phone-repair',
      'bakeries',
      'market-stall-vendors',
    ],
    population: 1500000,
    businessCount: 220000,
  },

  // Turkey
  'izmir-turkey': {
    slug: 'izmir-turkey',
    name: 'Izmir',
    city: 'Izmir',
    country: 'Turkey',
    title: 'Crypto Payments in Izmir, Turkey | PortalPay',
    metaDescription:
      'QR tickets and instant settlement for Izmir coastal services, cafés, and repair hubs.',
    localContext:
      'Aegean port SMEs adopt QR tickets, split payouts, and offline-first receipts.',
    popularIndustries: [
      'small-ferry-operators',
      'cafes',
      'mobile-phone-repair',
      'bakeries',
      'artisan-potters',
    ],
    population: 3000000,
    businessCount: 400000,
  },
  'bursa-turkey': {
    slug: 'bursa-turkey',
    name: 'Bursa',
    city: 'Bursa',
    country: 'Turkey',
    title: 'Crypto Payments in Bursa, Turkey | PortalPay',
    metaDescription:
      'Instant settlement for Bursa hardware, cafés, and repair hubs.',
    localContext:
      'Manufacturing SMEs leverage QR receipts, inventory tagging, and split payouts.',
    popularIndustries: [
      'hardware-shops',
      'cafes',
      'mobile-phone-repair',
      'bakeries',
      'market-stall-vendors',
    ],
    population: 2000000,
    businessCount: 280000,
  },
  'antalya-turkey': {
    slug: 'antalya-turkey',
    name: 'Antalya',
    city: 'Antalya',
    country: 'Turkey',
    title: 'Crypto Payments in Antalya, Turkey | PortalPay',
    metaDescription:
      'Low-fee crypto payments for Antalya tourism, cafés, and repair hubs.',
    localContext:
      'Riviera SMEs adopt QR receipts, split payouts, and transparent operations.',
    popularIndustries: [
      'cafes',
      'small-ferry-operators',
      'mobile-phone-repair',
      'bakeries',
      'artisan-potters',
    ],
    population: 1300000,
    businessCount: 220000,
  },

  // Taiwan
  'kaohsiung-taiwan': {
    slug: 'kaohsiung-taiwan',
    name: 'Kaohsiung',
    city: 'Kaohsiung',
    country: 'Taiwan',
    title: 'Crypto Payments in Kaohsiung, Taiwan | PortalPay',
    metaDescription:
      'Instant settlement and QR tickets for Kaohsiung coastal services, cafés, and repair hubs.',
    localContext:
      'Harbor SMEs adopt QR tickets, split payouts, and offline-first receipts.',
    popularIndustries: [
      'small-ferry-operators',
      'cafes',
      'mobile-phone-repair',
      'bakeries',
      'hardware-shops',
    ],
    population: 2700000,
    businessCount: 350000,
  },
  'taichung-taiwan': {
    slug: 'taichung-taiwan',
    name: 'Taichung',
    city: 'Taichung',
    country: 'Taiwan',
    title: 'Crypto Payments in Taichung, Taiwan | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for Taichung hardware, cafés, and street food.',
    localContext:
      'Manufacturing and night market SMEs leverage QR receipts, inventory tags, and split payouts.',
    popularIndustries: [
      'hardware-shops',
      'street-food-vendors',
      'cafes',
      'mobile-phone-repair',
      'bakeries',
    ],
    population: 2800000,
    businessCount: 360000,
  },
  'tainan-taiwan': {
    slug: 'tainan-taiwan',
    name: 'Tainan',
    city: 'Tainan',
    country: 'Taiwan',
    title: 'Crypto Payments in Tainan, Taiwan | PortalPay',
    metaDescription:
      'Instant settlement for Tainan street food, cafés, and artisan vendors.',
    localContext:
      'Historic craft and food corridors adopt QR receipts, split payouts, and offline-first operations.',
    popularIndustries: [
      'street-food-vendors',
      'cafes',
      'artisan-potters',
      'mobile-phone-repair',
      'bakeries',
    ],
    population: 1900000,
    businessCount: 240000,
  },
  'hsinchu-taiwan': {
    slug: 'hsinchu-taiwan',
    name: 'Hsinchu',
    city: 'Hsinchu',
    country: 'Taiwan',
    title: 'Crypto Payments in Hsinchu, Taiwan | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for Hsinchu hardware, cafés, and repair hubs.',
    localContext:
      'Science park SMEs leverage QR receipts, inventory tagging, and split payouts.',
    popularIndustries: [
      'hardware-shops',
      'cafes',
      'mobile-phone-repair',
      'bakeries',
      'internet-cafes',
    ],
    population: 450000,
    businessCount: 90000,
  },

  // Switzerland
  'geneva-switzerland': {
    slug: 'geneva-switzerland',
    name: 'Geneva',
    city: 'Geneva',
    country: 'Switzerland',
    title: 'Crypto Payments in Geneva, Switzerland | PortalPay',
    metaDescription:
      'Instant settlement and QR tickets for Geneva lakeside ferries, cafés, and repair hubs.',
    localContext:
      'Leman Lake SMEs adopt QR tickets, split payouts, and offline-first receipts.',
    popularIndustries: [
      'small-ferry-operators',
      'cafes',
      'mobile-phone-repair',
      'bakeries',
      'artisan-potters',
    ],
    population: 200000,
    businessCount: 60000,
  },
  'basel-switzerland': {
    slug: 'basel-switzerland',
    name: 'Basel',
    city: 'Basel',
    country: 'Switzerland',
    title: 'Crypto Payments in Basel, Switzerland | PortalPay',
    metaDescription:
      'Low-fee crypto payments for Basel cafés, artisan vendors, and repair shops.',
    localContext:
      'Rhine-side SMEs leverage QR receipts, split payouts, and transparent operations.',
    popularIndustries: [
      'cafes',
      'artisan-potters',
      'mobile-phone-repair',
      'bakeries',
      'hardware-shops',
    ],
    population: 180000,
    businessCount: 55000,
  },

  // Poland
  'krakow-poland': {
    slug: 'krakow-poland',
    name: 'Kraków',
    city: 'Kraków',
    country: 'Poland',
    title: 'Crypto Payments in Kraków, Poland | PortalPay',
    metaDescription:
      'Instant settlement for Kraków cafés, artisan vendors, and repair shops.',
    localContext:
      'Old Town SMEs adopt QR receipts, split payouts, and offline-first support.',
    popularIndustries: [
      'cafes',
      'artisan-potters',
      'mobile-phone-repair',
      'bakeries',
      'market-stall-vendors',
    ],
    population: 800000,
    businessCount: 140000,
  },
  'wroclaw-poland': {
    slug: 'wroclaw-poland',
    name: 'Wrocław',
    city: 'Wrocław',
    country: 'Poland',
    title: 'Crypto Payments in Wrocław, Poland | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for Wrocław cafés, markets, and repair hubs.',
    localContext:
      'Odra-side SMEs leverage QR receipts, split payouts, and transparent inventory tagging.',
    popularIndustries: [
      'cafes',
      'market-stall-vendors',
      'mobile-phone-repair',
      'bakeries',
      'artisan-potters',
    ],
    population: 680000,
    businessCount: 110000,
  },
  'gdansk-poland': {
    slug: 'gdansk-poland',
    name: 'Gdańsk',
    city: 'Gdańsk',
    country: 'Poland',
    title: 'Crypto Payments in Gdańsk, Poland | PortalPay',
    metaDescription:
      'Instant settlement and QR tickets for Gdańsk coastal services, cafés, and repair hubs.',
    localContext:
      'Baltic port SMEs adopt QR tickets, split payouts, and offline-first receipts.',
    popularIndustries: [
      'small-ferry-operators',
      'cafes',
      'mobile-phone-repair',
      'bakeries',
      'artisan-potters',
    ],
    population: 490000,
    businessCount: 90000,
  },
  'poznan-poland': {
    slug: 'poznan-poland',
    name: 'Poznań',
    city: 'Poznań',
    country: 'Poland',
    title: 'Crypto Payments in Poznań, Poland | PortalPay',
    metaDescription:
      'Low-fee crypto payments for Poznań cafés, hardware, and repair shops.',
    localContext:
      'Trade fair and neighborhood SMEs adopt QR receipts, inventory tagging, and split payouts.',
    popularIndustries: [
      'hardware-shops',
      'cafes',
      'mobile-phone-repair',
      'bakeries',
      'market-stall-vendors',
    ],
    population: 540000,
    businessCount: 100000,
  },

  // Brazil (additional)
  'salvador-brazil': {
    slug: 'salvador-brazil',
    name: 'Salvador',
    city: 'Salvador',
    country: 'Brazil',
    title: 'Crypto Payments in Salvador, Brazil | PortalPay',
    metaDescription:
      'Instant settlement and QR tickets for Salvador coastal services, street food, and cafés.',
    localContext:
      'Bahia SMEs adopt QR tickets, split payouts, and offline-first receipts.',
    popularIndustries: [
      'small-ferry-operators',
      'street-food-vendors',
      'cafes',
      'mobile-phone-repair',
      'market-stall-vendors',
    ],
    population: 2900000,
    businessCount: 350000,
  },
  'porto-alegre-brazil': {
    slug: 'porto-alegre-brazil',
    name: 'Porto Alegre',
    city: 'Porto Alegre',
    country: 'Brazil',
    title: 'Crypto Payments in Porto Alegre, Brazil | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for Porto Alegre cafés, bakeries, and repair hubs.',
    localContext:
      'Gaúcho SMEs leverage QR receipts, split payouts, and transparent operations.',
    popularIndustries: [
      'cafes',
      'bakeries',
      'mobile-phone-repair',
      'hardware-shops',
      'street-food-vendors',
    ],
    population: 1500000,
    businessCount: 220000,
  },
  'belem-brazil': {
    slug: 'belem-brazil',
    name: 'Belém',
    city: 'Belém',
    country: 'Brazil',
    title: 'Crypto Payments in Belém, Brazil | PortalPay',
    metaDescription:
      'Instant settlement and QR tickets for Belém river services, street food, and cafés.',
    localContext:
      'Amazon delta SMEs adopt QR tickets, split payouts, and offline-first receipts.',
    popularIndustries: [
      'small-ferry-operators',
      'street-food-vendors',
      'cafes',
      'mobile-phone-repair',
      'market-stall-vendors',
    ],
    population: 1500000,
    businessCount: 200000,
  },
  'goiania-brazil': {
    slug: 'goiania-brazil',
    name: 'Goiânia',
    city: 'Goiânia',
    country: 'Brazil',
    title: 'Crypto Payments in Goiânia, Brazil | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for Goiânia cafés, hardware, and repair shops.',
    localContext:
      'Inland capital SMEs leverage QR receipts, inventory tagging, and split payouts.',
    popularIndustries: [
      'hardware-shops',
      'cafes',
      'mobile-phone-repair',
      'bakeries',
      'street-food-vendors',
    ],
    population: 1500000,
    businessCount: 200000,
  },

  // === NEW LOCATIONS START ===

  // USA - Additional Cities
  'honolulu-usa': {
    slug: 'honolulu-usa',
    name: 'Honolulu',
    city: 'Honolulu',
    country: 'United States',
    title: 'Crypto Payments in Honolulu, USA | PortalPay',
    metaDescription:
      'QR ticketing for island ferries and instant settlement for cafés, tourism, and repair hubs.',
    localContext:
      'Aloha State SMEs adopt QR tickets, split payouts, and offline-first operations for tourism.',
    popularIndustries: [
      'small-ferry-operators',
      'cafes',
      'travel-agencies',
      'mobile-phone-repair',
      'artisan-potters',
    ],
    population: 350000,
    businessCount: 55000,
  },
  'anchorage-usa': {
    slug: 'anchorage-usa',
    name: 'Anchorage',
    city: 'Anchorage',
    country: 'United States',
    title: 'Crypto Payments in Anchorage, USA | PortalPay',
    metaDescription:
      'Instant settlement for Alaska cafés, hardware, and repair hubs.',
    localContext:
      'Last Frontier SMEs leverage QR receipts, split payouts, and offline-first reliability.',
    popularIndustries: [
      'hardware-shops',
      'cafes',
      'mobile-phone-repair',
      'auto-repair',
      'plumbing-services',
    ],
    population: 290000,
    businessCount: 45000,
  },
  'boise-usa': {
    slug: 'boise-usa',
    name: 'Boise',
    city: 'Boise',
    country: 'United States',
    title: 'Crypto Payments in Boise, USA | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for cafés, bakeries, and repair hubs.',
    localContext:
      'Treasure Valley SMEs adopt split payouts, QR receipts, and transparent operations.',
    popularIndustries: [
      'cafes',
      'bakeries',
      'mobile-phone-repair',
      'hardware-shops',
      'cleaning-services',
    ],
    population: 240000,
    businessCount: 38000,
  },
  'spokane-usa': {
    slug: 'spokane-usa',
    name: 'Spokane',
    city: 'Spokane',
    country: 'United States',
    title: 'Crypto Payments in Spokane, USA | PortalPay',
    metaDescription:
      'Instant settlement for cafés, repair hubs, and contractors.',
    localContext:
      'Inland Northwest SMEs leverage QR receipts, inventory tags, and split payouts.',
    popularIndustries: [
      'cafes',
      'mobile-phone-repair',
      'plumbing-services',
      'bakeries',
      'hardware-shops',
    ],
    population: 230000,
    businessCount: 35000,
  },
  'tacoma-usa': {
    slug: 'tacoma-usa',
    name: 'Tacoma',
    city: 'Tacoma',
    country: 'United States',
    title: 'Crypto Payments in Tacoma, USA | PortalPay',
    metaDescription:
      'QR tickets and instant settlement for Tacoma coastal services, cafés, and repair hubs.',
    localContext:
      'Puget Sound SMEs adopt QR tickets, split payouts, and offline-first receipts.',
    popularIndustries: [
      'small-ferry-operators',
      'cafes',
      'mobile-phone-repair',
      'bakeries',
      'hardware-shops',
    ],
    population: 220000,
    businessCount: 34000,
  },
  'richmond-usa': {
    slug: 'richmond-usa',
    name: 'Richmond',
    city: 'Richmond',
    country: 'United States',
    title: 'Crypto Payments in Richmond, USA | PortalPay',
    metaDescription:
      'Instant settlement for Richmond cafés, bakeries, and repair shops.',
    localContext:
      'Virginia capital SMEs leverage QR receipts, split payouts, and transparent operations.',
    popularIndustries: [
      'cafes',
      'bakeries',
      'mobile-phone-repair',
      'hardware-shops',
      'cleaning-services',
    ],
    population: 230000,
    businessCount: 36000,
  },
  'lexington-usa': {
    slug: 'lexington-usa',
    name: 'Lexington',
    city: 'Lexington',
    country: 'United States',
    title: 'Crypto Payments in Lexington, USA | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for cafés, hardware, and repair hubs.',
    localContext:
      'Bluegrass SMEs adopt split payouts, QR receipts, and offline-first reliability.',
    popularIndustries: [
      'cafes',
      'hardware-shops',
      'mobile-phone-repair',
      'bakeries',
      'auto-repair',
    ],
    population: 320000,
    businessCount: 48000,
  },
  'louisville-usa': {
    slug: 'louisville-usa',
    name: 'Louisville',
    city: 'Louisville',
    country: 'United States',
    title: 'Crypto Payments in Louisville, USA | PortalPay',
    metaDescription:
      'Instant settlement for Louisville cafés, bakeries, and repair shops.',
    localContext:
      'Derby City SMEs leverage QR receipts, inventory tags, and split payouts.',
    popularIndustries: [
      'cafes',
      'bakeries',
      'mobile-phone-repair',
      'hardware-shops',
      'cleaning-services',
    ],
    population: 620000,
    businessCount: 95000,
  },
  'memphis-usa': {
    slug: 'memphis-usa',
    name: 'Memphis',
    city: 'Memphis',
    country: 'United States',
    title: 'Crypto Payments in Memphis, USA | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for cafés, BBQ, and repair hubs.',
    localContext:
      'Bluff City SMEs adopt QR receipts, split payouts, and transparent operations.',
    popularIndustries: [
      'cafes',
      'restaurants',
      'mobile-phone-repair',
      'bakeries',
      'hardware-shops',
    ],
    population: 630000,
    businessCount: 90000,
  },
  'buffalo-usa': {
    slug: 'buffalo-usa',
    name: 'Buffalo',
    city: 'Buffalo',
    country: 'United States',
    title: 'Crypto Payments in Buffalo, USA | PortalPay',
    metaDescription:
      'Instant settlement for Buffalo cafés, bakeries, and repair hubs.',
    localContext:
      'Western NY SMEs leverage QR receipts, split payouts, and offline-first operations.',
    popularIndustries: [
      'cafes',
      'bakeries',
      'mobile-phone-repair',
      'hardware-shops',
      'plumbing-services',
    ],
    population: 255000,
    businessCount: 42000,
  },
  'rochester-usa': {
    slug: 'rochester-usa',
    name: 'Rochester',
    city: 'Rochester',
    country: 'United States',
    title: 'Crypto Payments in Rochester, USA | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for cafés, hardware, and repair shops.',
    localContext:
      'Flour City SMEs adopt QR receipts, inventory tagging, and split payouts.',
    popularIndustries: [
      'cafes',
      'hardware-shops',
      'mobile-phone-repair',
      'bakeries',
      'cleaning-services',
    ],
    population: 210000,
    businessCount: 35000,
  },
  'syracuse-usa': {
    slug: 'syracuse-usa',
    name: 'Syracuse',
    city: 'Syracuse',
    country: 'United States',
    title: 'Crypto Payments in Syracuse, USA | PortalPay',
    metaDescription:
      'Instant settlement for Syracuse cafés, bakeries, and repair hubs.',
    localContext:
      'Central NY SMEs leverage QR receipts, split payouts, and transparent operations.',
    popularIndustries: [
      'cafes',
      'bakeries',
      'mobile-phone-repair',
      'hardware-shops',
      'plumbing-services',
    ],
    population: 145000,
    businessCount: 25000,
  },
  'albany-usa': {
    slug: 'albany-usa',
    name: 'Albany',
    city: 'Albany',
    country: 'United States',
    title: 'Crypto Payments in Albany, USA | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for cafés, contractors, and repair hubs.',
    localContext:
      'Capital District SMEs adopt split payouts, QR receipts, and offline-first reliability.',
    popularIndustries: [
      'general-contractors',
      'cafes',
      'mobile-phone-repair',
      'bakeries',
      'cleaning-services',
    ],
    population: 100000,
    businessCount: 18000,
  },
  'hartford-usa': {
    slug: 'hartford-usa',
    name: 'Hartford',
    city: 'Hartford',
    country: 'United States',
    title: 'Crypto Payments in Hartford, USA | PortalPay',
    metaDescription:
      'Instant settlement for Hartford cafés, bakeries, and repair shops.',
    localContext:
      'Insurance capital SMEs leverage QR receipts, inventory tags, and split payouts.',
    popularIndustries: [
      'cafes',
      'bakeries',
      'mobile-phone-repair',
      'hardware-shops',
      'cleaning-services',
    ],
    population: 120000,
    businessCount: 22000,
  },
  'providence-usa': {
    slug: 'providence-usa',
    name: 'Providence',
    city: 'Providence',
    country: 'United States',
    title: 'Crypto Payments in Providence, USA | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for cafés, artisan vendors, and repair hubs.',
    localContext:
      'Creative Capital SMEs adopt QR receipts, split payouts, and transparent operations.',
    popularIndustries: [
      'cafes',
      'artisan-potters',
      'mobile-phone-repair',
      'bakeries',
      'hardware-shops',
    ],
    population: 190000,
    businessCount: 30000,
  },
  'newark-usa': {
    slug: 'newark-usa',
    name: 'Newark',
    city: 'Newark',
    country: 'United States',
    title: 'Crypto Payments in Newark, USA | PortalPay',
    metaDescription:
      'Instant settlement for Newark cafés, repair hubs, and contractors.',
    localContext:
      'Gateway City SMEs leverage QR receipts, split payouts, and offline-first support.',
    popularIndustries: [
      'cafes',
      'mobile-phone-repair',
      'general-contractors',
      'bakeries',
      'cleaning-services',
    ],
    population: 310000,
    businessCount: 50000,
  },
  'jersey-city-usa': {
    slug: 'jersey-city-usa',
    name: 'Jersey City',
    city: 'Jersey City',
    country: 'United States',
    title: 'Crypto Payments in Jersey City, USA | PortalPay',
    metaDescription:
      'QR tickets and instant settlement for Jersey City ferries, cafés, and repair hubs.',
    localContext:
      'Hudson River SMEs adopt QR tickets, split payouts, and transparent inventory tagging.',
    popularIndustries: [
      'small-ferry-operators',
      'cafes',
      'mobile-phone-repair',
      'bakeries',
      'hardware-shops',
    ],
    population: 290000,
    businessCount: 45000,
  },
  'virginia-beach-usa': {
    slug: 'virginia-beach-usa',
    name: 'Virginia Beach',
    city: 'Virginia Beach',
    country: 'United States',
    title: 'Crypto Payments in Virginia Beach, USA | PortalPay',
    metaDescription:
      'Instant settlement for Virginia Beach tourism, cafés, and repair shops.',
    localContext:
      'Coastal resort SMEs leverage QR receipts, split payouts, and offline-first operations.',
    popularIndustries: [
      'travel-agencies',
      'cafes',
      'mobile-phone-repair',
      'bakeries',
      'retail',
    ],
    population: 460000,
    businessCount: 70000,
  },
  'norfolk-usa': {
    slug: 'norfolk-usa',
    name: 'Norfolk',
    city: 'Norfolk',
    country: 'United States',
    title: 'Crypto Payments in Norfolk, USA | PortalPay',
    metaDescription:
      'QR tickets and instant settlement for Norfolk coastal services, cafés, and repair hubs.',
    localContext:
      'Naval port SMEs adopt QR tickets, split payouts, and transparent receipts.',
    popularIndustries: [
      'small-ferry-operators',
      'cafes',
      'mobile-phone-repair',
      'bakeries',
      'hardware-shops',
    ],
    population: 245000,
    businessCount: 40000,
  },
  'omaha-usa': {
    slug: 'omaha-usa',
    name: 'Omaha',
    city: 'Omaha',
    country: 'United States',
    title: 'Crypto Payments in Omaha, USA | PortalPay',
    metaDescription:
      'Instant settlement for Omaha cafés, bakeries, and repair hubs.',
    localContext:
      'Heartland SMEs leverage QR receipts, inventory tags, and split payouts.',
    popularIndustries: [
      'cafes',
      'bakeries',
      'mobile-phone-repair',
      'hardware-shops',
      'cleaning-services',
    ],
    population: 490000,
    businessCount: 75000,
  },
  'tulsa-usa': {
    slug: 'tulsa-usa',
    name: 'Tulsa',
    city: 'Tulsa',
    country: 'United States',
    title: 'Crypto Payments in Tulsa, USA | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for cafés, hardware, and repair shops.',
    localContext:
      'Oil capital SMEs adopt QR receipts, split payouts, and offline-first reliability.',
    popularIndustries: [
      'hardware-shops',
      'cafes',
      'mobile-phone-repair',
      'bakeries',
      'auto-repair',
    ],
    population: 410000,
    businessCount: 65000,
  },
  'oklahoma-city-usa': {
    slug: 'oklahoma-city-usa',
    name: 'Oklahoma City',
    city: 'Oklahoma City',
    country: 'United States',
    title: 'Crypto Payments in Oklahoma City, USA | PortalPay',
    metaDescription:
      'Instant settlement for OKC cafés, contractors, and repair hubs.',
    localContext:
      'Sooner State SMEs leverage QR receipts, inventory tagging, and split payouts.',
    popularIndustries: [
      'general-contractors',
      'cafes',
      'mobile-phone-repair',
      'bakeries',
      'hardware-shops',
    ],
    population: 700000,
    businessCount: 105000,
  },
  'wichita-usa': {
    slug: 'wichita-usa',
    name: 'Wichita',
    city: 'Wichita',
    country: 'United States',
    title: 'Crypto Payments in Wichita, USA | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for cafés, hardware, and repair hubs.',
    localContext:
      'Air Capital SMEs adopt QR receipts, split payouts, and transparent operations.',
    popularIndustries: [
      'hardware-shops',
      'cafes',
      'mobile-phone-repair',
      'bakeries',
      'auto-repair',
    ],
    population: 400000,
    businessCount: 60000,
  },
  'des-moines-usa': {
    slug: 'des-moines-usa',
    name: 'Des Moines',
    city: 'Des Moines',
    country: 'United States',
    title: 'Crypto Payments in Des Moines, USA | PortalPay',
    metaDescription:
      'Instant settlement for Des Moines cafés, bakeries, and repair shops.',
    localContext:
      'Iowa capital SMEs leverage QR receipts, inventory tags, and split payouts.',
    popularIndustries: [
      'cafes',
      'bakeries',
      'mobile-phone-repair',
      'hardware-shops',
      'cleaning-services',
    ],
    population: 215000,
    businessCount: 35000,
  },
  'little-rock-usa': {
    slug: 'little-rock-usa',
    name: 'Little Rock',
    city: 'Little Rock',
    country: 'United States',
    title: 'Crypto Payments in Little Rock, USA | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for cafés, contractors, and repair hubs.',
    localContext:
      'Natural State capital SMEs adopt QR receipts, split payouts, and offline-first support.',
    popularIndustries: [
      'general-contractors',
      'cafes',
      'mobile-phone-repair',
      'bakeries',
      'hardware-shops',
    ],
    population: 200000,
    businessCount: 32000,
  },
  'birmingham-usa': {
    slug: 'birmingham-usa',
    name: 'Birmingham',
    city: 'Birmingham',
    country: 'United States',
    title: 'Crypto Payments in Birmingham, USA | PortalPay',
    metaDescription:
      'Instant settlement for Birmingham cafés, BBQ, and repair shops.',
    localContext:
      'Magic City SMEs leverage QR receipts, inventory tagging, and split payouts.',
    popularIndustries: [
      'cafes',
      'restaurants',
      'mobile-phone-repair',
      'bakeries',
      'hardware-shops',
    ],
    population: 200000,
    businessCount: 35000,
  },
  'jackson-usa': {
    slug: 'jackson-usa',
    name: 'Jackson',
    city: 'Jackson',
    country: 'United States',
    title: 'Crypto Payments in Jackson, USA | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for cafés, repair hubs, and contractors.',
    localContext:
      'Mississippi capital SMEs adopt QR receipts, split payouts, and transparent operations.',
    popularIndustries: [
      'cafes',
      'mobile-phone-repair',
      'general-contractors',
      'bakeries',
      'cleaning-services',
    ],
    population: 150000,
    businessCount: 25000,
  },
  'baton-rouge-usa': {
    slug: 'baton-rouge-usa',
    name: 'Baton Rouge',
    city: 'Baton Rouge',
    country: 'United States',
    title: 'Crypto Payments in Baton Rouge, USA | PortalPay',
    metaDescription:
      'Instant settlement for Baton Rouge cafés, food trucks, and repair hubs.',
    localContext:
      'Red Stick SMEs leverage QR receipts, inventory tags, and split payouts.',
    popularIndustries: [
      'food-trucks',
      'cafes',
      'mobile-phone-repair',
      'bakeries',
      'hardware-shops',
    ],
    population: 225000,
    businessCount: 38000,
  },
  'shreveport-usa': {
    slug: 'shreveport-usa',
    name: 'Shreveport',
    city: 'Shreveport',
    country: 'United States',
    title: 'Crypto Payments in Shreveport, USA | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for cafés, casinos, and repair shops.',
    localContext:
      'Ark-La-Tex SMEs adopt QR receipts, split payouts, and offline-first operations.',
    popularIndustries: [
      'casinos-gambling',
      'cafes',
      'mobile-phone-repair',
      'bakeries',
      'hardware-shops',
    ],
    population: 185000,
    businessCount: 30000,
  },
  'mobile-usa': {
    slug: 'mobile-usa',
    name: 'Mobile',
    city: 'Mobile',
    country: 'United States',
    title: 'Crypto Payments in Mobile, USA | PortalPay',
    metaDescription:
      'QR tickets and instant settlement for Mobile coastal services, cafés, and repair hubs.',
    localContext:
      'Gulf Coast SMEs adopt QR tickets, split payouts, and transparent receipts.',
    popularIndustries: [
      'small-ferry-operators',
      'cafes',
      'mobile-phone-repair',
      'bakeries',
      'hardware-shops',
    ],
    population: 185000,
    businessCount: 30000,
  },
  'charleston-usa': {
    slug: 'charleston-usa',
    name: 'Charleston',
    city: 'Charleston',
    country: 'United States',
    title: 'Crypto Payments in Charleston, USA | PortalPay',
    metaDescription:
      'Instant settlement for Charleston coastal services, cafés, and artisan vendors.',
    localContext:
      'Holy City SMEs leverage QR receipts, inventory tagging, and split payouts.',
    popularIndustries: [
      'small-ferry-operators',
      'cafes',
      'artisan-potters',
      'mobile-phone-repair',
      'bakeries',
    ],
    population: 155000,
    businessCount: 28000,
  },
  'savannah-usa': {
    slug: 'savannah-usa',
    name: 'Savannah',
    city: 'Savannah',
    country: 'United States',
    title: 'Crypto Payments in Savannah, USA | PortalPay',
    metaDescription:
      'QR tickets and instant settlement for Savannah coastal services, cafés, and tourism.',
    localContext:
      'Historic district SMEs adopt QR tickets, split payouts, and offline-first operations.',
    popularIndustries: [
      'small-ferry-operators',
      'travel-agencies',
      'cafes',
      'artisan-potters',
      'mobile-phone-repair',
    ],
    population: 145000,
    businessCount: 25000,
  },
  'columbia-usa': {
    slug: 'columbia-usa',
    name: 'Columbia',
    city: 'Columbia',
    country: 'United States',
    title: 'Crypto Payments in Columbia, USA | PortalPay',
    metaDescription:
      'Instant settlement for Columbia cafés, bakeries, and repair shops.',
    localContext:
      'SC capital SMEs leverage QR receipts, inventory tags, and split payouts.',
    popularIndustries: [
      'cafes',
      'bakeries',
      'mobile-phone-repair',
      'hardware-shops',
      'cleaning-services',
    ],
    population: 135000,
    businessCount: 24000,
  },
  'greenville-usa': {
    slug: 'greenville-usa',
    name: 'Greenville',
    city: 'Greenville',
    country: 'United States',
    title: 'Crypto Payments in Greenville, USA | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for cafés, hardware, and repair hubs.',
    localContext:
      'Upstate SMEs adopt QR receipts, split payouts, and transparent operations.',
    popularIndustries: [
      'hardware-shops',
      'cafes',
      'mobile-phone-repair',
      'bakeries',
      'auto-repair',
    ],
    population: 75000,
    businessCount: 14000,
  },
  'knoxville-usa': {
    slug: 'knoxville-usa',
    name: 'Knoxville',
    city: 'Knoxville',
    country: 'United States',
    title: 'Crypto Payments in Knoxville, USA | PortalPay',
    metaDescription:
      'Instant settlement for Knoxville cafés, bakeries, and repair shops.',
    localContext:
      'Marble City SMEs leverage QR receipts, inventory tagging, and split payouts.',
    popularIndustries: [
      'cafes',
      'bakeries',
      'mobile-phone-repair',
      'hardware-shops',
      'cleaning-services',
    ],
    population: 195000,
    businessCount: 32000,
  },
  'chattanooga-usa': {
    slug: 'chattanooga-usa',
    name: 'Chattanooga',
    city: 'Chattanooga',
    country: 'United States',
    title: 'Crypto Payments in Chattanooga, USA | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for cafés, hardware, and repair hubs.',
    localContext:
      'Scenic City SMEs adopt QR receipts, split payouts, and offline-first reliability.',
    popularIndustries: [
      'cafes',
      'hardware-shops',
      'mobile-phone-repair',
      'bakeries',
      'internet-cafes',
    ],
    population: 185000,
    businessCount: 30000,
  },
  'fresno-usa': {
    slug: 'fresno-usa',
    name: 'Fresno',
    city: 'Fresno',
    country: 'United States',
    title: 'Crypto Payments in Fresno, USA | PortalPay',
    metaDescription:
      'Instant settlement for Fresno markets, cafés, and repair shops.',
    localContext:
      'Central Valley SMEs leverage QR receipts, inventory tags, and split payouts.',
    popularIndustries: [
      'market-stall-vendors',
      'cafes',
      'mobile-phone-repair',
      'bakeries',
      'hardware-shops',
    ],
    population: 545000,
    businessCount: 80000,
  },
  'bakersfield-usa': {
    slug: 'bakersfield-usa',
    name: 'Bakersfield',
    city: 'Bakersfield',
    country: 'United States',
    title: 'Crypto Payments in Bakersfield, USA | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for cafés, hardware, and repair hubs.',
    localContext:
      'Kern County SMEs adopt QR receipts, split payouts, and transparent operations.',
    popularIndustries: [
      'hardware-shops',
      'cafes',
      'mobile-phone-repair',
      'bakeries',
      'auto-repair',
    ],
    population: 400000,
    businessCount: 60000,
  },
  'stockton-usa': {
    slug: 'stockton-usa',
    name: 'Stockton',
    city: 'Stockton',
    country: 'United States',
    title: 'Crypto Payments in Stockton, USA | PortalPay',
    metaDescription:
      'Instant settlement for Stockton markets, cafés, and repair shops.',
    localContext:
      'Central Valley SMEs leverage QR receipts, inventory tags, and split payouts.',
    popularIndustries: [
      'market-stall-vendors',
      'cafes',
      'mobile-phone-repair',
      'bakeries',
      'hardware-shops',
    ],
    population: 320000,
    businessCount: 50000,
  },
  // ==== BATCH 1: Global distribution ====
  'porto-portugal': {
    slug: 'porto-portugal',
    name: 'Porto',
    city: 'Porto',
    country: 'Portugal',
    title: 'Crypto Payments in Porto, Portugal | PortalPay',
    metaDescription:
      'Instant settlement for cafés, bakeries, and Douro waterfront services with QR receipts and split payouts.',
    localContext:
      'Ribeira and Bolhão SMEs benefit from QR receipts, split payouts for attendants, and offline-first reliability across cafés, artisan vendors, and ferries.',
    popularIndustries: [
      'cafes',
      'bakeries',
      'small-ferry-operators',
      'artisan-potters',
      'mobile-phone-repair',
    ],
    population: 230000,
    businessCount: 60000,
  },

  'antwerp-belgium': {
    slug: 'antwerp-belgium',
    name: 'Antwerp',
    city: 'Antwerp',
    country: 'Belgium',
    title: 'Crypto Payments in Antwerp, Belgium | PortalPay',
    metaDescription:
      'QR receipts and low-fee crypto for cafés, bakeries, and diamond district repair hubs with instant settlement.',
    localContext:
      'Diamond and port-adjacent SMEs use QR receipts, inventory tagging, and split payouts across cafés, repair hubs, and artisan vendors.',
    popularIndustries: [
      'cafes',
      'bakeries',
      'mobile-phone-repair',
      'artisan-potters',
      'hardware-shops',
    ],
    population: 530000,
    businessCount: 100000,
  },

  'qingdao-china': {
    slug: 'qingdao-china',
    name: 'Qingdao',
    city: 'Qingdao',
    country: 'China',
    title: 'Crypto Payments in Qingdao, China | PortalPay',
    metaDescription:
      'QR tickets and instant settlement for coastal services, street food, and repair hubs across Qingdao.',
    localContext:
      'Coastal routes and markets leverage QR tickets, split payouts, and offline-first receipts for cafés, street food, and electronics repair.',
    popularIndustries: [
      'small-ferry-operators',
      'street-food-vendors',
      'mobile-phone-repair',
      'cafes',
      'market-stall-vendors',
    ],
    population: 10000000,
    businessCount: 1200000,
  },

  'xiamen-china': {
    slug: 'xiamen-china',
    name: 'Xiamen',
    city: 'Xiamen',
    country: 'China',
    title: 'Crypto Payments in Xiamen, China | PortalPay',
    metaDescription:
      'Instant settlement and QR receipts for cafés, ferries, and repair hubs around Xiamen’s island districts.',
    localContext:
      'Island ferries and seaside SMEs adopt QR tickets, split payouts, and transparent receipts across cafés and electronics repair.',
    popularIndustries: [
      'small-ferry-operators',
      'cafes',
      'mobile-phone-repair',
      'bakeries',
      'hardware-shops',
    ],
    population: 4400000,
    businessCount: 600000,
  },

  'canberra-australia': {
    slug: 'canberra-australia',
    name: 'Canberra',
    city: 'Canberra',
    country: 'Australia',
    title: 'Crypto Payments in Canberra, Australia | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for cafés, bakeries, and repair hubs in Australia’s capital.',
    localContext:
      'Civic and campus corridors use QR receipts, split payouts, and offline-first operations across cafés and service SMEs.',
    popularIndustries: [
      'cafes',
      'bakeries',
      'mobile-phone-repair',
      'hardware-shops',
      'freelancers',
    ],
    population: 460000,
    businessCount: 70000,
  },

  'sharjah-uae': {
    slug: 'sharjah-uae',
    name: 'Sharjah',
    city: 'Sharjah',
    country: 'United Arab Emirates',
    title: 'Crypto Payments in Sharjah, UAE | PortalPay',
    metaDescription:
      'Instant settlement and QR receipts for cafés, markets, and repair hubs across Sharjah.',
    localContext:
      'Souqs and waterfront services adopt QR receipts, inventory tagging, and split payouts across cafés and repair hubs.',
    popularIndustries: [
      'cafes',
      'market-stall-vendors',
      'mobile-phone-repair',
      'bakeries',
      'retail',
    ],
    population: 1500000,
    businessCount: 200000,
  },

  'caracas-venezuela': {
    slug: 'caracas-venezuela',
    name: 'Caracas',
    city: 'Caracas',
    country: 'Venezuela',
    title: 'Crypto Payments in Caracas, Venezuela | PortalPay',
    metaDescription:
      'Low-fee QR payments and instant settlement for cafés, street vendors, and repair hubs in Caracas.',
    localContext:
      'Urban corridors adopt QR receipts, split payouts, and offline-first reliability across cafés, street food, and electronics repair.',
    popularIndustries: [
      'street-food-vendors',
      'cafes',
      'mobile-phone-repair',
      'hardware-shops',
      'market-stall-vendors',
    ],
    population: 2000000,
    businessCount: 300000,
  },

  'enugu-nigeria': {
    slug: 'enugu-nigeria',
    name: 'Enugu',
    city: 'Enugu',
    country: 'Nigeria',
    title: 'Crypto Payments in Enugu, Nigeria | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for markets, cafés, and repair hubs across Enugu.',
    localContext:
      'Coal city SMEs leverage QR receipts, inventory tagging, and attendant split payouts across markets and cafés.',
    popularIndustries: [
      'market-stall-vendors',
      'cafes',
      'mobile-phone-repair',
      'street-food-vendors',
      'community-radio-stations',
    ],
    population: 900000,
    businessCount: 120000,
  },

  'mekelle-ethiopia': {
    slug: 'mekelle-ethiopia',
    name: 'Mekelle',
    city: 'Mekelle',
    country: 'Ethiopia',
    title: 'Crypto Payments in Mekelle, Ethiopia | PortalPay',
    metaDescription:
      'Instant settlement for artisan vendors, cafés, and repair hubs in Mekelle with offline-first support.',
    localContext:
      'Highland markets and cafés adopt QR receipts, inventory tags, and split payouts for transparent daily close.',
    popularIndustries: [
      'artisan-potters',
      'cafes',
      'mobile-phone-repair',
      'market-stall-vendors',
      'internet-cafes',
    ],
    population: 500000,
    businessCount: 70000,
  },

  'kuching-malaysia': {
    slug: 'kuching-malaysia',
    name: 'Kuching',
    city: 'Kuching',
    country: 'Malaysia',
    title: 'Crypto Payments in Kuching, Malaysia | PortalPay',
    metaDescription:
      'QR tickets and instant settlement for Sarawak river services, hawker stalls, and repair hubs.',
    localContext:
      'Borneo SMEs leverage QR tickets, split payouts, and offline-first receipts across cafés, hawker culture, and ferries.',
    popularIndustries: [
      'street-food-vendors',
      'small-ferry-operators',
      'cafes',
      'mobile-phone-repair',
      'market-stall-vendors',
    ],
    population: 680000,
    businessCount: 90000,
  },

  // ==== BATCH 2: Global distribution ====
  'thessaloniki-greece': {
    slug: 'thessaloniki-greece',
    name: 'Thessaloniki',
    city: 'Thessaloniki',
    country: 'Greece',
    title: 'Crypto Payments in Thessaloniki, Greece | PortalPay',
    metaDescription:
      'Instant settlement and QR receipts for cafés, markets, and ferry services in Thessaloniki.',
    localContext:
      'Waterfront SMEs and market corridors leverage QR tickets, split payouts, and offline-first operations across cafés, vendors, and coastal services.',
    popularIndustries: [
      'cafes',
      'small-ferry-operators',
      'mobile-phone-repair',
      'bakeries',
      'market-stall-vendors',
    ],
    population: 1100000,
    businessCount: 160000,
  },

  'nantes-france': {
    slug: 'nantes-france',
    name: 'Nantes',
    city: 'Nantes',
    country: 'France',
    title: 'Crypto Payments in Nantes, France | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for Nantes cafés, bakeries, and artisan vendors.',
    localContext:
      'Loire riverside SMEs adopt split payouts, QR receipts, and transparent inventory across cafés, markets, and galleries.',
    popularIndustries: [
      'cafes',
      'bakeries',
      'artisan-potters',
      'mobile-phone-repair',
      'hardware-shops',
    ],
    population: 650000,
    businessCount: 100000,
  },

  'ghent-belgium': {
    slug: 'ghent-belgium',
    name: 'Ghent',
    city: 'Ghent',
    country: 'Belgium',
    title: 'Crypto Payments in Ghent, Belgium | PortalPay',
    metaDescription:
      'Instant settlement for Ghent cafés, artisan markets, and repair hubs.',
    localContext:
      'Canal-side cafés and maker districts leverage split payouts, QR receipts, and offline-first reliability for daily close.',
    popularIndustries: [
      'cafes',
      'artisan-potters',
      'mobile-phone-repair',
      'bakeries',
      'market-stall-vendors',
    ],
    population: 265000,
    businessCount: 45000,
  },

  'cork-ireland': {
    slug: 'cork-ireland',
    name: 'Cork',
    city: 'Cork',
    country: 'Ireland',
    title: 'Crypto Payments in Cork, Ireland | PortalPay',
    metaDescription:
      'Low-fee crypto payments for Cork cafés, markets, and coastal services with instant settlement.',
    localContext:
      'Harbour and university SMEs adopt QR receipts, split payouts, and transparent inventory tagging across cafés and vendors.',
    popularIndustries: [
      'cafes',
      'bakeries',
      'mobile-phone-repair',
      'small-ferry-operators',
      'artisan-potters',
    ],
    population: 210000,
    businessCount: 35000,
  },

  'christchurch-new-zealand': {
    slug: 'christchurch-new-zealand',
    name: 'Christchurch',
    city: 'Christchurch',
    country: 'New Zealand',
    title: 'Crypto Payments in Christchurch, New Zealand | PortalPay',
    metaDescription:
      'Instant settlement and QR receipts for cafés, repair hubs, and coastal services in Christchurch.',
    localContext:
      'Rebuild-era SMEs and port-adjacent services leverage split payouts, QR tickets, and offline-first operations.',
    popularIndustries: [
      'cafes',
      'mobile-phone-repair',
      'small-ferry-operators',
      'bakeries',
      'artisan-potters',
    ],
    population: 390000,
    businessCount: 60000,
  },

  'kandy-sri-lanka': {
    slug: 'kandy-sri-lanka',
    name: 'Kandy',
    city: 'Kandy',
    country: 'Sri Lanka',
    title: 'Crypto Payments in Kandy, Sri Lanka | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for artisan vendors, cafés, and tour operators in Kandy.',
    localContext:
      'Hill-country craft and tourism corridors adopt QR receipts, inventory tagging, and split payouts for guides and vendors.',
    popularIndustries: [
      'artisan-potters',
      'cafes',
      'mobile-phone-repair',
      'cryptid-tour-operators',
      'market-stall-vendors',
    ],
    population: 170000,
    businessCount: 28000,
  },

  'yogyakarta-indonesia': {
    slug: 'yogyakarta-indonesia',
    name: 'Yogyakarta',
    city: 'Yogyakarta',
    country: 'Indonesia',
    title: 'Crypto Payments in Yogyakarta, Indonesia | PortalPay',
    metaDescription:
      'Instant settlement for craft markets, cafés, and repair hubs across Yogyakarta.',
    localContext:
      'Student and artisan districts leverage QR receipts, split payouts, and offline-first operations for co-ops and vendors.',
    popularIndustries: [
      'artisan-potters',
      'cafes',
      'internet-cafes',
      'mobile-phone-repair',
      'market-stall-vendors',
    ],
    population: 420000,
    businessCount: 60000,
  },

  'phuket-thailand': {
    slug: 'phuket-thailand',
    name: 'Phuket',
    city: 'Phuket',
    country: 'Thailand',
    title: 'Crypto Payments in Phuket, Thailand | PortalPay',
    metaDescription:
      'QR ticketing and instant settlement for island ferries, cafés, and tourism in Phuket.',
    localContext:
      'Resort SMEs adopt QR tickets, split payouts, and transparent receipts across charters, cafés, and craft vendors.',
    popularIndustries: [
      'small-ferry-operators',
      'cafes',
      'mobile-phone-repair',
      'artisan-potters',
      'street-food-vendors',
    ],
    population: 420000,
    businessCount: 70000,
  },

  'trujillo-peru': {
    slug: 'trujillo-peru',
    name: 'Trujillo',
    city: 'Trujillo',
    country: 'Peru',
    title: 'Crypto Payments in Trujillo, Peru | PortalPay',
    metaDescription:
      'Instant settlement and QR receipts for markets, cafés, and repair hubs in Trujillo.',
    localContext:
      'Northern coastal SMEs adopt QR receipts, inventory tagging, and split payouts across cafés and vendors.',
    popularIndustries: [
      'market-stall-vendors',
      'cafes',
      'mobile-phone-repair',
      'bakeries',
      'internet-cafes',
    ],
    population: 1100000,
    businessCount: 150000,
  },

  'mar-del-plata-argentina': {
    slug: 'mar-del-plata-argentina',
    name: 'Mar del Plata',
    city: 'Mar del Plata',
    country: 'Argentina',
    title: 'Crypto Payments in Mar del Plata, Argentina | PortalPay',
    metaDescription:
      'QR ticketing and instant settlement for coastal services, cafés, and artisan vendors in Mar del Plata.',
    localContext:
      'Atlantic resort SMEs leverage QR tickets, split payouts, and offline-first operations across charters, cafés, and craft stalls.',
    popularIndustries: [
      'small-ferry-operators',
      'cafes',
      'artisan-potters',
      'mobile-phone-repair',
      'bakeries',
    ],
    population: 650000,
    businessCount: 100000,
  },

  // ==== BATCH 3: Global distribution ====
  'heraklion-greece': {
    slug: 'heraklion-greece',
    name: 'Heraklion',
    city: 'Heraklion',
    country: 'Greece',
    title: 'Crypto Payments in Heraklion, Greece | PortalPay',
    metaDescription:
      'QR ticketing and instant settlement for ferries, cafés, and artisan vendors in Heraklion.',
    localContext:
      'Crete island SMEs adopt QR tickets, split payouts, and offline-first receipts across charters, cafés, and markets.',
    popularIndustries: [
      'small-ferry-operators',
      'cafes',
      'artisan-potters',
      'mobile-phone-repair',
      'bakeries',
    ],
    population: 210000,
    businessCount: 35000,
  },

  'gothenburg-sweden': {
    slug: 'gothenburg-sweden',
    name: 'Gothenburg',
    city: 'Gothenburg',
    country: 'Sweden',
    title: 'Crypto Payments in Gothenburg, Sweden | PortalPay',
    metaDescription:
      'Instant settlement and QR receipts for coastal services, cafés, and repair hubs in Gothenburg.',
    localContext:
      'Archipelago ferries and café corridors leverage QR tickets, split payouts, and offline-first operations.',
    popularIndustries: [
      'small-ferry-operators',
      'cafes',
      'mobile-phone-repair',
      'bakeries',
      'artisan-potters',
    ],
    population: 600000,
    businessCount: 120000,
  },

  'alicante-spain': {
    slug: 'alicante-spain',
    name: 'Alicante',
    city: 'Alicante',
    country: 'Spain',
    title: 'Crypto Payments in Alicante, Spain | PortalPay',
    metaDescription:
      'QR ticketing and instant settlement for coastal services, cafés, and artisan vendors in Alicante.',
    localContext:
      'Costa Blanca SMEs adopt QR tickets, split payouts, and transparent receipts across ferries, cafés, and markets.',
    popularIndustries: [
      'small-ferry-operators',
      'cafes',
      'mobile-phone-repair',
      'bakeries',
      'artisan-potters',
    ],
    population: 340000,
    businessCount: 70000,
  },

  'natal-brazil': {
    slug: 'natal-brazil',
    name: 'Natal',
    city: 'Natal',
    country: 'Brazil',
    title: 'Crypto Payments in Natal, Brazil | PortalPay',
    metaDescription:
      'Instant settlement and QR receipts for coastal services, street food, and cafés in Natal.',
    localContext:
      'Northeast Brazil SMEs adopt QR tickets, split payouts, and offline-first operations across beaches, markets, and cafés.',
    popularIndustries: [
      'small-ferry-operators',
      'street-food-vendors',
      'cafes',
      'mobile-phone-repair',
      'market-stall-vendors',
    ],
    population: 900000,
    businessCount: 120000,
  },

  'florianopolis-brazil': {
    slug: 'florianopolis-brazil',
    name: 'Florianópolis',
    city: 'Florianópolis',
    country: 'Brazil',
    title: 'Crypto Payments in Florianópolis, Brazil | PortalPay',
    metaDescription:
      'QR tickets and instant settlement for island ferries, cafés, and repair hubs in Florianópolis.',
    localContext:
      'Island capital SMEs leverage QR tickets, split payouts, and offline-first receipts across charters, cafés, and vendors.',
    popularIndustries: [
      'small-ferry-operators',
      'cafes',
      'mobile-phone-repair',
      'bakeries',
      'artisan-potters',
    ],
    population: 520000,
    businessCount: 80000,
  },

  'valencia-venezuela': {
    slug: 'valencia-venezuela',
    name: 'Valencia',
    city: 'Valencia',
    country: 'Venezuela',
    title: 'Crypto Payments in Valencia, Venezuela | PortalPay',
    metaDescription:
      'Instant settlement and QR receipts for cafés, repair hubs, and street vendors in Valencia.',
    localContext:
      'Industrial corridor SMEs adopt QR receipts, inventory tagging, and split payouts across cafés and repair hubs.',
    popularIndustries: [
      'cafes',
      'mobile-phone-repair',
      'hardware-shops',
      'street-food-vendors',
      'market-stall-vendors',
    ],
    population: 1500000,
    businessCount: 220000,
  },

  'harbin-china': {
    slug: 'harbin-china',
    name: 'Harbin',
    city: 'Harbin',
    country: 'China',
    title: 'Crypto Payments in Harbin, China | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for night markets, cafés, and repair hubs across Harbin.',
    localContext:
      'Winter city SMEs adopt QR receipts, split payouts, and offline-first operations across street food, cafés, and hardware.',
    popularIndustries: [
      'street-food-vendors',
      'cafes',
      'mobile-phone-repair',
      'hardware-shops',
      'bakeries',
    ],
    population: 9500000,
    businessCount: 1200000,
  },

  'shenyang-china': {
    slug: 'shenyang-china',
    name: 'Shenyang',
    city: 'Shenyang',
    country: 'China',
    title: 'Crypto Payments in Shenyang, China | PortalPay',
    metaDescription:
      'Instant settlement and QR receipts for hardware, cafés, and repair hubs across Shenyang.',
    localContext:
      'Industrial metropolis SMEs leverage QR receipts, inventory tagging, and split payouts across markets and cafés.',
    popularIndustries: [
      'hardware-shops',
      'cafes',
      'mobile-phone-repair',
      'bakeries',
      'market-stall-vendors',
    ],
    population: 9000000,
    businessCount: 1100000,
  },

  'ningbo-china': {
    slug: 'ningbo-china',
    name: 'Ningbo',
    city: 'Ningbo',
    country: 'China',
    title: 'Crypto Payments in Ningbo, China | PortalPay',
    metaDescription:
      'QR tickets and instant settlement for coastal services, cafés, and repair hubs in Ningbo.',
    localContext:
      'Deepwater port SMEs adopt QR tickets, split payouts, and offline-first receipts across ferries, cafés, and hardware.',
    popularIndustries: [
      'small-ferry-operators',
      'hardware-shops',
      'cafes',
      'mobile-phone-repair',
      'bakeries',
    ],
    population: 9400000,
    businessCount: 1100000,
  },

  'bacolod-philippines': {
    slug: 'bacolod-philippines',
    name: 'Bacolod City',
    city: 'Bacolod City',
    country: 'Philippines',
    title: 'Crypto Payments in Bacolod City, Philippines | PortalPay',
    metaDescription:
      'Instant settlement and QR receipts for sari-sari stores, cafés, and repair hubs in Bacolod.',
    localContext:
      'Sugar capital SMEs adopt QR receipts, inventory tags, and split payouts across sari-sari stores, cafés, and repair hubs.',
    popularIndustries: [
      'sari-sari-stores',
      'internet-cafes',
      'mobile-phone-repair',
      'cafes',
      'street-food-vendors',
    ],
    population: 600000,
    businessCount: 90000,
  },

  // ==== BATCH 4: Global distribution ====
  'patras-greece': {
    slug: 'patras-greece',
    name: 'Patras',
    city: 'Patras',
    country: 'Greece',
    title: 'Crypto Payments in Patras, Greece | PortalPay',
    metaDescription:
      'QR ticketing and instant settlement for ferries, cafés, and artisan vendors in Patras.',
    localContext:
      'Gulf of Patras ferries and university cafés adopt QR tickets, split payouts, and offline-first receipts.',
    popularIndustries: [
      'small-ferry-operators',
      'cafes',
      'bakeries',
      'mobile-phone-repair',
      'artisan-potters',
    ],
    population: 215000,
    businessCount: 34000,
  },

  'malmo-sweden': {
    slug: 'malmo-sweden',
    name: 'Malmö',
    city: 'Malmö',
    country: 'Sweden',
    title: 'Crypto Payments in Malmö, Sweden | PortalPay',
    metaDescription:
      'Instant settlement and QR receipts for Öresund ferries, cafés, and repair hubs in Malmö.',
    localContext:
      'Cross-bridge retail and coastal services leverage QR tickets, split payouts, and offline-first operations.',
    popularIndustries: [
      'small-ferry-operators',
      'cafes',
      'mobile-phone-repair',
      'bakeries',
      'hardware-shops',
    ],
    population: 350000,
    businessCount: 65000,
  },

  'las-palmas-spain': {
    slug: 'las-palmas-spain',
    name: 'Las Palmas',
    city: 'Las Palmas',
    country: 'Spain',
    title: 'Crypto Payments in Las Palmas, Spain | PortalPay',
    metaDescription:
      'QR ticketing and instant settlement for island ferries, cafés, and artisan markets in Las Palmas.',
    localContext:
      'Canary Island tourism SMEs adopt QR tickets, split payouts, and transparent receipts across charters, cafés, and markets.',
    popularIndustries: [
      'small-ferry-operators',
      'cafes',
      'mobile-phone-repair',
      'artisan-potters',
      'bakeries',
    ],
    population: 380000,
    businessCount: 70000,
  },

  'maceio-brazil': {
    slug: 'maceio-brazil',
    name: 'Maceió',
    city: 'Maceió',
    country: 'Brazil',
    title: 'Crypto Payments in Maceió, Brazil | PortalPay',
    metaDescription:
      'Instant settlement and QR receipts for coastal services, street food, and cafés in Maceió.',
    localContext:
      'Northeast beachfront SMEs adopt QR tickets, split payouts, and offline-first receipts across kiosks, cafés, and charters.',
    popularIndustries: [
      'street-food-vendors',
      'small-ferry-operators',
      'cafes',
      'mobile-phone-repair',
      'market-stall-vendors',
    ],
    population: 1000000,
    businessCount: 140000,
  },

  'salta-argentina': {
    slug: 'salta-argentina',
    name: 'Salta',
    city: 'Salta',
    country: 'Argentina',
    title: 'Crypto Payments in Salta, Argentina | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for artisan markets, cafés, and repair hubs in Salta.',
    localContext:
      'Highland craft corridors and cafés leverage QR receipts, inventory tags, and split payouts.',
    popularIndustries: [
      'artisan-potters',
      'cafes',
      'mobile-phone-repair',
      'internet-cafes',
      'bakeries',
    ],
    population: 620000,
    businessCount: 90000,
  },

  'maracaibo-venezuela': {
    slug: 'maracaibo-venezuela',
    name: 'Maracaibo',
    city: 'Maracaibo',
    country: 'Venezuela',
    title: 'Crypto Payments in Maracaibo, Venezuela | PortalPay',
    metaDescription:
      'Instant settlement and QR receipts for cafés, hardware, and street vendors in Maracaibo.',
    localContext:
      'Lake city SMEs adopt QR receipts, split payouts, and offline-first reliability across markets and cafés.',
    popularIndustries: [
      'hardware-shops',
      'street-food-vendors',
      'cafes',
      'mobile-phone-repair',
      'market-stall-vendors',
    ],
    population: 1400000,
    businessCount: 200000,
  },

  'dalian-china': {
    slug: 'dalian-china',
    name: 'Dalian',
    city: 'Dalian',
    country: 'China',
    title: 'Crypto Payments in Dalian, China | PortalPay',
    metaDescription:
      'QR tickets and instant settlement for coastal services, cafés, and repair hubs in Dalian.',
    localContext:
      'Liaoning coastal SMEs adopt QR tickets, split payouts, and transparent receipts across ferries, cafés, and hardware.',
    popularIndustries: [
      'small-ferry-operators',
      'hardware-shops',
      'cafes',
      'mobile-phone-repair',
      'bakeries',
    ],
    population: 7400000,
    businessCount: 950000,
  },

  'fuzhou-china': {
    slug: 'fuzhou-china',
    name: 'Fuzhou',
    city: 'Fuzhou',
    country: 'China',
    title: 'Crypto Payments in Fuzhou, China | PortalPay',
    metaDescription:
      'Instant settlement and QR receipts for street food, cafés, and repair hubs in Fuzhou.',
    localContext:
      'Fujian corridor SMEs leverage QR receipts, inventory tags, and split payouts across markets and cafés.',
    popularIndustries: [
      'street-food-vendors',
      'cafes',
      'mobile-phone-repair',
      'hardware-shops',
      'bakeries',
    ],
    population: 7800000,
    businessCount: 980000,
  },

  'zamboanga-philippines': {
    slug: 'zamboanga-philippines',
    name: 'Zamboanga City',
    city: 'Zamboanga City',
    country: 'Philippines',
    title: 'Crypto Payments in Zamboanga City, Philippines | PortalPay',
    metaDescription:
      'QR ticketing and instant settlement for ferries, sari-sari stores, and cafés in Zamboanga.',
    localContext:
      'Western Mindanao SMEs adopt QR tickets, split payouts, and offline-first receipts across ferries, neighborhood stores, and cafés.',
    popularIndustries: [
      'small-ferry-operators',
      'sari-sari-stores',
      'cafes',
      'mobile-phone-repair',
      'internet-cafes',
    ],
    population: 1100000,
    businessCount: 150000,
  },

  'darwin-australia': {
    slug: 'darwin-australia',
    name: 'Darwin',
    city: 'Darwin',
    country: 'Australia',
    title: 'Crypto Payments in Darwin, Australia | PortalPay',
    metaDescription:
      'Instant settlement and QR receipts for coastal services, cafés, and repair hubs in Darwin.',
    localContext:
      'Top End SMEs adopt QR tickets, split payouts, and offline-first operations across ferries, cafés, and hardware.',
    popularIndustries: [
      'small-ferry-operators',
      'cafes',
      'mobile-phone-repair',
      'hardware-shops',
      'bakeries',
    ],
    population: 150000,
    businessCount: 22000,
  },

  // ==== BATCH 5: Southern Europe & Islands ====
  'santa-cruz-de-tenerife-spain': {
    slug: 'santa-cruz-de-tenerife-spain',
    name: 'Santa Cruz de Tenerife',
    city: 'Santa Cruz de Tenerife',
    country: 'Spain',
    title: 'Crypto Payments in Santa Cruz de Tenerife, Spain | PortalPay',
    metaDescription:
      'QR ticketing and instant settlement for island ferries, cafés, and artisan markets in Santa Cruz de Tenerife.',
    localContext:
      'Canary inter-island ferries and market vendors adopt QR tickets, split payouts, and offline-first receipts.',
    popularIndustries: [
      'small-ferry-operators',
      'cafes',
      'artisan-potters',
      'mobile-phone-repair',
      'bakeries',
    ],
    population: 210000,
    businessCount: 40000,
  },

  'murcia-spain': {
    slug: 'murcia-spain',
    name: 'Murcia',
    city: 'Murcia',
    country: 'Spain',
    title: 'Crypto Payments in Murcia, Spain | PortalPay',
    metaDescription:
      'Instant settlement and QR receipts for cafés, artisan vendors, and repair hubs in Murcia.',
    localContext:
      'Segura River markets and student cafés leverage QR receipts, split payouts, and transparent inventory tagging.',
    popularIndustries: [
      'cafes',
      'artisan-potters',
      'mobile-phone-repair',
      'bakeries',
      'market-stall-vendors',
    ],
    population: 460000,
    businessCount: 80000,
  },

  'funchal-portugal': {
    slug: 'funchal-portugal',
    name: 'Funchal',
    city: 'Funchal',
    country: 'Portugal',
    title: 'Crypto Payments in Funchal, Portugal | PortalPay',
    metaDescription:
      'QR ticketing and instant settlement for Madeira ferries, cafés, and artisan vendors in Funchal.',
    localContext:
      'Island tourism SMEs adopt QR tickets, split payouts, and offline-first receipts across charters, cafés, and markets.',
    popularIndustries: [
      'small-ferry-operators',
      'cafes',
      'artisan-potters',
      'mobile-phone-repair',
      'bakeries',
    ],
    population: 110000,
    businessCount: 18000,
  },

  'split-croatia': {
    slug: 'split-croatia',
    name: 'Split',
    city: 'Split',
    country: 'Croatia',
    title: 'Crypto Payments in Split, Croatia | PortalPay',
    metaDescription:
      'Instant settlement and QR tickets for Adriatic ferries, cafés, and artisan vendors in Split.',
    localContext:
      'Dalmatian coastal SMEs leverage QR tickets, split payouts, and offline-first receipts across ferries, cafés, and markets.',
    popularIndustries: [
      'small-ferry-operators',
      'cafes',
      'artisan-potters',
      'mobile-phone-repair',
      'bakeries',
    ],
    population: 180000,
    businessCount: 30000,
  },

  'plovdiv-bulgaria': {
    slug: 'plovdiv-bulgaria',
    name: 'Plovdiv',
    city: 'Plovdiv',
    country: 'Bulgaria',
    title: 'Crypto Payments in Plovdiv, Bulgaria | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for artisan markets, cafés, and repair hubs in Plovdiv.',
    localContext:
      'Old Town craft corridors and cafés adopt QR receipts, inventory tags, and split payouts.',
    popularIndustries: [
      'artisan-potters',
      'cafes',
      'mobile-phone-repair',
      'bakeries',
      'market-stall-vendors',
    ],
    population: 345000,
    businessCount: 55000,
  },

  'maribor-slovenia': {
    slug: 'maribor-slovenia',
    name: 'Maribor',
    city: 'Maribor',
    country: 'Slovenia',
    title: 'Crypto Payments in Maribor, Slovenia | PortalPay',
    metaDescription:
      'Instant settlement and QR receipts for cafés, artisan vendors, and repair hubs in Maribor.',
    localContext:
      'Drava riverside SMEs leverage split payouts, QR receipts, and offline-first operations across cafés and markets.',
    popularIndustries: [
      'cafes',
      'artisan-potters',
      'mobile-phone-repair',
      'bakeries',
      'internet-cafes',
    ],
    population: 112000,
    businessCount: 16000,
  },

  'rhodes-greece': {
    slug: 'rhodes-greece',
    name: 'Rhodes',
    city: 'Rhodes',
    country: 'Greece',
    title: 'Crypto Payments in Rhodes, Greece | PortalPay',
    metaDescription:
      'QR ticketing and instant settlement for island ferries, cafés, and artisan vendors in Rhodes.',
    localContext:
      'Dodecanese tourism SMEs adopt QR tickets, split payouts, and transparent receipts across charters, cafés, and craft stalls.',
    popularIndustries: [
      'small-ferry-operators',
      'cafes',
      'artisan-potters',
      'mobile-phone-repair',
      'bakeries',
    ],
    population: 155000,
    businessCount: 24000,
  },

  'palma-de-mallorca-spain': {
    slug: 'palma-de-mallorca-spain',
    name: 'Palma de Mallorca',
    city: 'Palma de Mallorca',
    country: 'Spain',
    title: 'Crypto Payments in Palma de Mallorca, Spain | PortalPay',
    metaDescription:
      'Instant settlement and QR tickets for Balearic ferries, cafés, and artisan markets in Palma.',
    localContext:
      'Island SMEs leverage QR tickets, split payouts, and offline-first receipts across charters, cafés, and craft vendors.',
    popularIndustries: [
      'small-ferry-operators',
      'cafes',
      'artisan-potters',
      'mobile-phone-repair',
      'bakeries',
    ],
    population: 420000,
    businessCount: 70000,
  },

  'santander-spain': {
    slug: 'santander-spain',
    name: 'Santander',
    city: 'Santander',
    country: 'Spain',
    title: 'Crypto Payments in Santander, Spain | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for coastal services, cafés, and repair hubs in Santander.',
    localContext:
      'Bay of Biscay SMEs adopt QR receipts, split payouts, and transparent inventory tagging across cafés and vendors.',
    popularIndustries: [
      'small-ferry-operators',
      'cafes',
      'mobile-phone-repair',
      'bakeries',
      'artisan-potters',
    ],
    population: 175000,
    businessCount: 30000,
  },

  'trieste-italy': {
    slug: 'trieste-italy',
    name: 'Trieste',
    city: 'Trieste',
    country: 'Italy',
    title: 'Crypto Payments in Trieste, Italy | PortalPay',
    metaDescription:
      'Instant settlement and QR receipts for port services, cafés, and repair hubs in Trieste.',
    localContext:
      'Adriatic port SMEs leverage split payouts, QR receipts, and offline-first operations across cafés, hardware, and vendors.',
    popularIndustries: [
      'small-ferry-operators',
      'hardware-shops',
      'cafes',
      'mobile-phone-repair',
      'bakeries',
    ],
    population: 200000,
    businessCount: 32000,
  },

  // ==== BATCH 6: Mediterranean and Black Sea ports ====
  'catania-italy': {
    slug: 'catania-italy',
    name: 'Catania',
    city: 'Catania',
    country: 'Italy',
    title: 'Crypto Payments in Catania, Italy | PortalPay',
    metaDescription:
      'QR tickets and instant settlement for coastal services, cafés, and artisan vendors in Catania.',
    localContext:
      'Etna coast SMEs leverage QR tickets, split payouts, and offline-first receipts across charters, cafés, and craft markets.',
    popularIndustries: [
      'small-ferry-operators',
      'cafes',
      'artisan-potters',
      'mobile-phone-repair',
      'bakeries',
    ],
    population: 310000,
    businessCount: 52000,
  },

  'cagliari-italy': {
    slug: 'cagliari-italy',
    name: 'Cagliari',
    city: 'Cagliari',
    country: 'Italy',
    title: 'Crypto Payments in Cagliari, Italy | PortalPay',
    metaDescription:
      'Instant settlement and QR receipts for Sardinian ferries, cafés, and repair hubs in Cagliari.',
    localContext:
      'Island capital SMEs adopt QR tickets, split payouts, and transparent receipts across ferries, cafés, and markets.',
    popularIndustries: [
      'small-ferry-operators',
      'cafes',
      'mobile-phone-repair',
      'bakeries',
      'artisan-potters',
    ],
    population: 150000,
    businessCount: 24000,
  },

  'corfu-greece': {
    slug: 'corfu-greece',
    name: 'Corfu (Kerkyra)',
    city: 'Corfu',
    country: 'Greece',
    title: 'Crypto Payments in Corfu, Greece | PortalPay',
    metaDescription:
      'QR ticketing and instant settlement for Ionian ferries, cafés, and artisan vendors in Corfu.',
    localContext:
      'Island tourism SMEs leverage QR tickets, split payouts, and offline-first receipts across charters, cafés, and artisan stalls.',
    popularIndustries: [
      'small-ferry-operators',
      'cafes',
      'artisan-potters',
      'mobile-phone-repair',
      'bakeries',
    ],
    population: 39000,
    businessCount: 8000,
  },

  'chania-greece': {
    slug: 'chania-greece',
    name: 'Chania',
    city: 'Chania',
    country: 'Greece',
    title: 'Crypto Payments in Chania, Greece | PortalPay',
    metaDescription:
      'Instant settlement and QR receipts for Crete charters, cafés, and artisan markets in Chania.',
    localContext:
      'Old harbor SMEs adopt QR tickets, split payouts, and transparent receipts across cafés, charters, and vendors.',
    popularIndustries: [
      'small-ferry-operators',
      'cafes',
      'artisan-potters',
      'mobile-phone-repair',
      'bakeries',
    ],
    population: 110000,
    businessCount: 18000,
  },

  'ajaccio-france': {
    slug: 'ajaccio-france',
    name: 'Ajaccio',
    city: 'Ajaccio',
    country: 'France',
    title: 'Crypto Payments in Ajaccio, France | PortalPay',
    metaDescription:
      'QR ticketing and instant settlement for Corsican ferries, cafés, and artisan vendors in Ajaccio.',
    localContext:
      'Island SMEs leverage QR tickets, split payouts, and offline-first receipts across ferries, cafés, and craft markets.',
    popularIndustries: [
      'small-ferry-operators',
      'cafes',
      'artisan-potters',
      'mobile-phone-repair',
      'bakeries',
    ],
    population: 72000,
    businessCount: 12000,
  },

  'bari-italy': {
    slug: 'bari-italy',
    name: 'Bari',
    city: 'Bari',
    country: 'Italy',
    title: 'Crypto Payments in Bari, Italy | PortalPay',
    metaDescription:
      'Instant settlement and QR receipts for Adriatic ferries, cafés, and repair hubs in Bari.',
    localContext:
      'Apulia port SMEs adopt QR tickets, split payouts, and inventory tagging across cafés, hardware, and ferry services.',
    popularIndustries: [
      'small-ferry-operators',
      'hardware-shops',
      'cafes',
      'mobile-phone-repair',
      'bakeries',
    ],
    population: 320000,
    businessCount: 55000,
  },

  'ancona-italy': {
    slug: 'ancona-italy',
    name: 'Ancona',
    city: 'Ancona',
    country: 'Italy',
    title: 'Crypto Payments in Ancona, Italy | PortalPay',
    metaDescription:
      'QR tickets and instant settlement for ferries, cafés, and repair hubs in Ancona.',
    localContext:
      'Adriatic ferry gateway SMEs leverage QR tickets, split payouts, and offline-first receipts across cafés and hardware.',
    popularIndustries: [
      'small-ferry-operators',
      'hardware-shops',
      'cafes',
      'mobile-phone-repair',
      'bakeries',
    ],
    population: 100000,
    businessCount: 17000,
  },

  'zadar-croatia': {
    slug: 'zadar-croatia',
    name: 'Zadar',
    city: 'Zadar',
    country: 'Croatia',
    title: 'Crypto Payments in Zadar, Croatia | PortalPay',
    metaDescription:
      'Instant settlement and QR receipts for Dalmatian ferries, cafés, and artisan vendors in Zadar.',
    localContext:
      'Island-hopping SMEs adopt QR tickets, split payouts, and transparent receipts across charters, cafés, and markets.',
    popularIndustries: [
      'small-ferry-operators',
      'cafes',
      'artisan-potters',
      'mobile-phone-repair',
      'bakeries',
    ],
    population: 75000,
    businessCount: 11000,
  },

  'kotor-montenegro': {
    slug: 'kotor-montenegro',
    name: 'Kotor',
    city: 'Kotor',
    country: 'Montenegro',
    title: 'Crypto Payments in Kotor, Montenegro | PortalPay',
    metaDescription:
      'QR ticketing and instant settlement for bay tours, cafés, and artisan vendors in Kotor.',
    localContext:
      'Bay of Kotor tourism SMEs leverage QR tickets, split payouts, and offline-first receipts across charters and cafés.',
    popularIndustries: [
      'small-ferry-operators',
      'cafes',
      'artisan-potters',
      'mobile-phone-repair',
      'bakeries',
    ],
    population: 13000,
    businessCount: 2500,
  },

  'varna-bulgaria': {
    slug: 'varna-bulgaria',
    name: 'Varna',
    city: 'Varna',
    country: 'Bulgaria',
    title: 'Crypto Payments in Varna, Bulgaria | PortalPay',
    metaDescription:
      'Instant settlement and QR receipts for Black Sea ferries, cafés, and repair hubs in Varna.',
    localContext:
      'Black Sea port SMEs adopt QR tickets, split payouts, and transparent receipts across cafés, markets, and hardware.',
    popularIndustries: [
      'small-ferry-operators',
      'cafes',
      'hardware-shops',
      'mobile-phone-repair',
      'bakeries',
    ],
    population: 340000,
    businessCount: 52000,
  },

  'livorno-italy': {
    slug: 'livorno-italy',
    name: 'Livorno',
    city: 'Livorno',
    country: 'Italy',
    title: 'Crypto Payments in Livorno, Italy | PortalPay',
    metaDescription:
      'QR tickets and instant settlement for Tuscan ferries, cafés, and repair hubs in Livorno.',
    localContext:
      'Tyrrhenian port SMEs adopt QR tickets, split payouts, and transparent receipts across ferries, cafés, and hardware.',
    popularIndustries: [
      'small-ferry-operators',
      'cafes',
      'mobile-phone-repair',
      'bakeries',
      'hardware-shops',
    ],
    population: 160000,
    businessCount: 26000,
  },

  'la-spezia-italy': {
    slug: 'la-spezia-italy',
    name: 'La Spezia',
    city: 'La Spezia',
    country: 'Italy',
    title: 'Crypto Payments in La Spezia, Italy | PortalPay',
    metaDescription:
      'Instant settlement and QR receipts for Cinque Terre ferries, cafés, and artisan vendors in La Spezia.',
    localContext:
      'Gulf of Poets tourism SMEs use QR tickets, split payouts, and offline-first receipts across charters, cafés, and craft stalls.',
    popularIndustries: [
      'small-ferry-operators',
      'cafes',
      'artisan-potters',
      'mobile-phone-repair',
      'bakeries',
    ],
    population: 93000,
    businessCount: 15000,
  },

  'taranto-italy': {
    slug: 'taranto-italy',
    name: 'Taranto',
    city: 'Taranto',
    country: 'Italy',
    title: 'Crypto Payments in Taranto, Italy | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for port services, cafés, and repair hubs in Taranto.',
    localContext:
      'Apulia industrial-port SMEs leverage QR receipts, inventory tagging, and split payouts across cafés and hardware.',
    popularIndustries: [
      'hardware-shops',
      'cafes',
      'mobile-phone-repair',
      'bakeries',
      'small-ferry-operators',
    ],
    population: 190000,
    businessCount: 30000,
  },

  'civitavecchia-italy': {
    slug: 'civitavecchia-italy',
    name: 'Civitavecchia',
    city: 'Civitavecchia',
    country: 'Italy',
    title: 'Crypto Payments in Civitavecchia, Italy | PortalPay',
    metaDescription:
      'QR ticketing and instant settlement for cruise ferries, cafés, and vendors near Rome in Civitavecchia.',
    localContext:
      'Cruise gateway SMEs adopt QR tickets, split payouts, and offline-first receipts across charters, cafés, and markets.',
    popularIndustries: [
      'small-ferry-operators',
      'cafes',
      'artisan-potters',
      'mobile-phone-repair',
      'bakeries',
    ],
    population: 53000,
    businessCount: 9000,
  },

  'brindisi-italy': {
    slug: 'brindisi-italy',
    name: 'Brindisi',
    city: 'Brindisi',
    country: 'Italy',
    title: 'Crypto Payments in Brindisi, Italy | PortalPay',
    metaDescription:
      'Instant settlement and QR receipts for Adriatic ferries, cafés, and repair hubs in Brindisi.',
    localContext:
      'Salento SMEs leverage QR tickets, split payouts, and transparent receipts across ferries, cafés, and hardware.',
    popularIndustries: [
      'small-ferry-operators',
      'hardware-shops',
      'cafes',
      'mobile-phone-repair',
      'bakeries',
    ],
    population: 86000,
    businessCount: 13000,
  },

  'messina-italy': {
    slug: 'messina-italy',
    name: 'Messina',
    city: 'Messina',
    country: 'Italy',
    title: 'Crypto Payments in Messina, Italy | PortalPay',
    metaDescription:
      'QR ticketing and instant settlement for Strait of Messina ferries, cafés, and vendors.',
    localContext:
      'Strait-crossing ferries and waterfront SMEs adopt QR tickets, split payouts, and offline-first receipts.',
    popularIndustries: [
      'small-ferry-operators',
      'cafes',
      'mobile-phone-repair',
      'bakeries',
      'artisan-potters',
    ],
    population: 220000,
    businessCount: 34000,
  },

  'dubrovnik-croatia': {
    slug: 'dubrovnik-croatia',
    name: 'Dubrovnik',
    city: 'Dubrovnik',
    country: 'Croatia',
    title: 'Crypto Payments in Dubrovnik, Croatia | PortalPay',
    metaDescription:
      'Instant settlement and QR tickets for Adriatic ferries, cafés, and artisan vendors in Dubrovnik.',
    localContext:
      'Old Town tourism SMEs leverage QR tickets, split payouts, and transparent receipts across charters, cafés, and craft stalls.',
    popularIndustries: [
      'small-ferry-operators',
      'cafes',
      'artisan-potters',
      'mobile-phone-repair',
      'bakeries',
    ],
    population: 42000,
    businessCount: 8000,
  },

  'pula-croatia': {
    slug: 'pula-croatia',
    name: 'Pula',
    city: 'Pula',
    country: 'Croatia',
    title: 'Crypto Payments in Pula, Croatia | PortalPay',
    metaDescription:
      'QR receipts and instant settlement for Istrian ferries, cafés, and artisan markets in Pula.',
    localContext:
      'Arena-side SMEs adopt QR tickets, split payouts, and offline-first receipts across ferries, cafés, and vendors.',
    popularIndustries: [
      'small-ferry-operators',
      'cafes',
      'artisan-potters',
      'mobile-phone-repair',
      'bakeries',
    ],
    population: 57000,
    businessCount: 9000,
  },

  'piraeus-greece': {
    slug: 'piraeus-greece',
    name: 'Piraeus',
    city: 'Piraeus',
    country: 'Greece',
    title: 'Crypto Payments in Piraeus, Greece | PortalPay',
    metaDescription:
      'Instant settlement and QR tickets for Aegean ferries, cafés, and repair hubs in Piraeus.',
    localContext:
      'Athens gateway SMEs leverage QR tickets, split payouts, and transparent receipts across charters, cafés, and hardware.',
    popularIndustries: [
      'small-ferry-operators',
      'hardware-shops',
      'cafes',
      'mobile-phone-repair',
      'bakeries',
    ],
    population: 160000,
    businessCount: 25000,
  },

  'cadiz-spain': {
    slug: 'cadiz-spain',
    name: 'Cádiz',
    city: 'Cádiz',
    country: 'Spain',
    title: 'Crypto Payments in Cádiz, Spain | PortalPay',
    metaDescription:
      'QR tickets and instant settlement for Bay of Cádiz ferries, cafés, and artisan vendors.',
    localContext:
      'Andalusian coastal SMEs adopt QR tickets, split payouts, and offline-first receipts across charters, cafés, and markets.',
    popularIndustries: [
      'small-ferry-operators',
      'cafes',
      'artisan-potters',
      'mobile-phone-repair',
      'bakeries',
    ],
    population: 115000,
    businessCount: 18000,
  },

  'algeciras-spain': {
    slug: 'algeciras-spain',
    name: 'Algeciras',
    city: 'Algeciras',
    country: 'Spain',
    title: 'Crypto Payments in Algeciras, Spain | PortalPay',
    metaDescription:
      'Instant settlement and QR receipts for Strait of Gibraltar ferries, cafés, and repair hubs.',
    localContext:
      'Major container and ferry port SMEs leverage QR receipts, inventory tagging, and split payouts.',
    popularIndustries: [
      'small-ferry-operators',
      'hardware-shops',
      'cafes',
      'mobile-phone-repair',
      'bakeries',
    ],
    population: 123000,
    businessCount: 20000,
  },

  'constanta-romania': {
    slug: 'constanta-romania',
    name: 'Constanța',
    city: 'Constanța',
    country: 'Romania',
    title: 'Crypto Payments in Constanța, Romania | PortalPay',
    metaDescription:
      'QR tickets and instant settlement for Black Sea ferries, cafés, and repair hubs in Constanța.',
    localContext:
      'Port-city SMEs adopt QR tickets, split payouts, and offline-first receipts across ferries, cafés, and hardware.',
    popularIndustries: [
      'small-ferry-operators',
      'hardware-shops',
      'cafes',
      'mobile-phone-repair',
      'bakeries',
    ],
    population: 300000,
    businessCount: 45000,
  },

};

export function getLocationData(slug: string): LocationData | null {
  return LOCATION_DATA[slug] || null;
}

export function getAllLocations(): LocationData[] {
  return Object.values(LOCATION_DATA);
}
