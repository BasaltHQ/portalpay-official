/**
 * Industry Landing Page Data - Index
 * Manually curated: references only custom, hand-authored industries
 */

import { IndustryLandingData } from '../types';

// Import industries
import { restaurants } from './restaurants';
import { hotels } from './hotels';
import { retail } from './retail';
import { cafes } from './cafes';
import { bars } from './bars';
import { gyms } from './gyms';
import { bakeries } from './bakeries';
import { foodTrucks } from './food-trucks';
import { salons } from './salons';
import { freelancers } from './freelancers';
import { ecommerce } from './ecommerce';
import { medical } from './medical';
import { autoRepair } from './auto-repair';
import { veterinarians } from './veterinarians';
import { kiranaStores } from './kirana-stores';
import { sariSariStores } from './sari-sari-stores';
import { streetFoodVendors } from './street-food-vendors';
import { bodaBodaOperators } from './boda-boda-operators';
import { marketStallVendors } from './market-stall-vendors';
import { waterKioskOperators } from './water-kiosk-operators';
import { matatuOperators } from './matatu-operators';
import { communityTailors } from './community-tailors';
import { tukTukOperators } from './tuk-tuk-operators';
import { fisherfolkCooperatives } from './fisherfolk-cooperatives';
import { smallholderFarmers } from './smallholder-farmers';
import { streetMusicians } from './street-musicians';
import { communityPharmacies } from './community-pharmacies';
import { hardwareShops } from './hardware-shops';
import { streetBarbers } from './street-barbers';
import { wastePickers } from './waste-pickers';
import { butcherShops } from './butcher-shops';
import { mobileMoneyAgents } from './mobile-money-agents';
import { mobilePhoneRepair } from './mobile-phone-repair';
import { communityRadioStations } from './community-radio-stations';
import { microGridOperators } from './micro-grid-operators';
import { internetCafes } from './internet-cafes';
import { smallFerryOperators } from './small-ferry-operators';
import { artisanPotters } from './artisan-potters';
import { villageSavingsGroups } from './village-savings-groups';
import { cryptidTourOperators } from './cryptid-tour-operators';
import { realEstate } from './real-estate';
import { ventureCapital } from './venture-capital';
import { investmentFunds } from './investment-funds';
import { privateEquity } from './private-equity';
import { luxuryRealEstate } from './luxury-real-estate';
import { aircraftSales } from './aircraft-sales';
import { yachtBrokers } from './yacht-brokers';
import { artGalleries } from './art-galleries';
import { rareCollectibles } from './rare-collectibles';
import { jewelryDiamonds } from './jewelry-diamonds';
import { plumbingServices, hvacServices, electricalContractors, roofingContractors, landscapingServices, generalContractors, carpentry, painters, pestControl, locksmiths, applianceRepair, cleaningServices } from './blue-collar';
import { cannabisDispensaries, liquorStores, vapeTobaccoShops, adultEntertainment, casinosGambling, firearmsGunShops, cbdHempProducts, kratomSellers, supplementsNutraceuticals, paydayLoans, checkCashingMoneyServices, bailBonds, debtCollection, creditRepair, ticketBrokers, travelAgencies, fantasySports, timeshares, highTicketCoaching, onlineGaming } from './high-risk';
import { lubeManufacturers } from './lube-manufacturers';
import { adultNoveltyRetailers } from './adult-novelty-retailers';
import { tattooPiercingStudios } from './tattoo-piercing-studios';
import { nightclubs } from './nightclubs';
import { 
  petServices, daycareChildcare, tutoringEducation, photographyStudios, eventPlanning,
  cateringServices, florists, printShops, dryCleaners, laundromats, storageFacilities,
  parkingLots, carWashes, towingServices, movingCompanies, musicLessons, danceStudios,
  yogaStudios, martialArts, bowlingAlleys, escapeRooms, arcades, movieTheaters
} from './service-industries';

// Export combined INDUSTRY_DATA object (slug -> data)
export const INDUSTRY_DATA: Record<string, IndustryLandingData> = {
  'restaurants': restaurants,
  'hotels': hotels,
  'retail': retail,
  'cafes': cafes,
  'bars': bars,
  'gyms': gyms,
  'bakeries': bakeries,
  'food-trucks': foodTrucks,
  'salons': salons,
  'freelancers': freelancers,
  'ecommerce': ecommerce,
  'medical': medical,
  'auto-repair': autoRepair,
  'veterinarians': veterinarians,
  'kirana-stores': kiranaStores,
  'sari-sari-stores': sariSariStores,
  'street-food-vendors': streetFoodVendors,
  'boda-boda-operators': bodaBodaOperators,
  'market-stall-vendors': marketStallVendors,
  'water-kiosk-operators': waterKioskOperators,
  'matatu-operators': matatuOperators,
  'community-tailors': communityTailors,
  'tuk-tuk-operators': tukTukOperators,
  'fisherfolk-cooperatives': fisherfolkCooperatives,
  'smallholder-farmers': smallholderFarmers,
  'street-musicians': streetMusicians,
  'community-pharmacies': communityPharmacies,
  'hardware-shops': hardwareShops,
  'street-barbers': streetBarbers,
  'waste-pickers': wastePickers,
  'butcher-shops': butcherShops,
  'mobile-money-agents': mobileMoneyAgents,
  'mobile-phone-repair': mobilePhoneRepair,
  'community-radio-stations': communityRadioStations,
  'micro-grid-operators': microGridOperators,
  'internet-cafes': internetCafes,
  'small-ferry-operators': smallFerryOperators,
  'artisan-potters': artisanPotters,
  'village-savings-groups': villageSavingsGroups,
  'cryptid-tour-operators': cryptidTourOperators,
  'real-estate': realEstate,
  'venture-capital': ventureCapital,
  'investment-funds': investmentFunds,
  'private-equity': privateEquity,
  'luxury-real-estate': luxuryRealEstate,
  'aircraft-sales': aircraftSales,
  'yacht-brokers': yachtBrokers,
  'art-galleries': artGalleries,
  'rare-collectibles': rareCollectibles,
  'jewelry-diamonds': jewelryDiamonds,
  'plumbing-services': plumbingServices,
  'hvac-services': hvacServices,
  'electrical-contractors': electricalContractors,
  'roofing-contractors': roofingContractors,
  'landscaping-services': landscapingServices,
  'general-contractors': generalContractors,
  'carpentry': carpentry,
  'painters': painters,
  'pest-control': pestControl,
  'locksmiths': locksmiths,
  'appliance-repair': applianceRepair,
  'cleaning-services': cleaningServices,

  // High-Risk Industries
  'cannabis-dispensaries': cannabisDispensaries,
  'liquor-stores': liquorStores,
  'vape-tobacco-shops': vapeTobaccoShops,
  'adult-entertainment': adultEntertainment,
  'casinos-gambling': casinosGambling,
  'firearms-gun-shops': firearmsGunShops,
  'cbd-hemp-products': cbdHempProducts,
  'kratom-sellers': kratomSellers,
  'supplements-nutraceuticals': supplementsNutraceuticals,
  'payday-loans': paydayLoans,
  'check-cashing-money-services': checkCashingMoneyServices,
  'bail-bonds': bailBonds,
  'debt-collection': debtCollection,
  'credit-repair': creditRepair,
  'ticket-brokers': ticketBrokers,
  'travel-agencies': travelAgencies,
  'fantasy-sports': fantasySports,
  'timeshares': timeshares,
  'high-ticket-coaching': highTicketCoaching,
  'online-gaming': onlineGaming,
  'lube-manufacturers': lubeManufacturers,
  'adult-novelty-retailers': adultNoveltyRetailers,
  'tattoo-piercing-studios': tattooPiercingStudios,
  'nightclubs': nightclubs,
  
  // Service Industries (24 new)
  'pet-services': petServices,
  'daycare-childcare': daycareChildcare,
  'tutoring-education': tutoringEducation,
  'photography-studios': photographyStudios,
  'event-planning': eventPlanning,
  'catering-services': cateringServices,
  'florists': florists,
  'print-shops': printShops,
  'dry-cleaners': dryCleaners,
  'laundromats': laundromats,
  'storage-facilities': storageFacilities,
  'parking-lots': parkingLots,
  'car-washes': carWashes,
  'towing-services': towingServices,
  'moving-companies': movingCompanies,
  'music-lessons': musicLessons,
  'dance-studios': danceStudios,
  'yoga-studios': yogaStudios,
  'martial-arts': martialArts,
  'bowling-alleys': bowlingAlleys,
  'escape-rooms': escapeRooms,
  'arcades': arcades,
  'movie-theaters': movieTheaters,
};

// Export utility functions
export function getIndustryData(slug: string): IndustryLandingData | null {
  return INDUSTRY_DATA[slug] || null;
}

export function getAllIndustries(): IndustryLandingData[] {
  return Object.values(INDUSTRY_DATA);
}

export function getRelatedIndustries(slug: string): IndustryLandingData[] {
  const industry = getIndustryData(slug);
  if (!industry) return [];
  
  return industry.relatedIndustries
    .map((relSlug) => getIndustryData(relSlug))
    .filter((ind): ind is IndustryLandingData => ind !== null);
}
