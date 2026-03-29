/**
 * Cannabis Compliance — METRC v2 & BioTrack API Integration Types & Constants
 * Full depth coverage of all endpoint categories from both providers.
 */

// ═══════════════════════════════════════════════════════════════════════════════
// METRC STATE CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

export const METRC_STATES: Record<string, { name: string; code: string }> = {
  AK: { name: 'Alaska', code: 'ak' }, CA: { name: 'California', code: 'ca' },
  CO: { name: 'Colorado', code: 'co' }, DC: { name: 'Washington DC', code: 'dc' },
  LA: { name: 'Louisiana', code: 'la' }, MA: { name: 'Massachusetts', code: 'ma' },
  MD: { name: 'Maryland', code: 'md' }, ME: { name: 'Maine', code: 'me' },
  MI: { name: 'Michigan', code: 'mi' }, MO: { name: 'Missouri', code: 'mo' },
  MT: { name: 'Montana', code: 'mt' }, NJ: { name: 'New Jersey', code: 'nj' },
  NV: { name: 'Nevada', code: 'nv' }, OH: { name: 'Ohio', code: 'oh' },
  OK: { name: 'Oklahoma', code: 'ok' }, OR: { name: 'Oregon', code: 'or' },
  WV: { name: 'West Virginia', code: 'wv' },
};

export interface BioTrackStateConfig {
  name: string;
  apiBase: string;
  apiVersion: 'v1' | 'v2' | 'v3' | 'trace2';
  authMethod: 'basic' | 'session';          // basic = username/password per-call; session = POST login → x-api-key
  dateFormat: 'epoch' | 'iso8601';           // v1/v2 use epoch timestamps; v3+/Trace2 use ISO8601
  regulatoryBody: string;
  regulatoryAbbr: string;
  programType: 'medical' | 'adult-use' | 'both';
  reportingInterval: string;                 // how quickly data must be synced with the state
  identifierFormat: 'uuid' | '16-digit';     // FL uses UUIDs; most others use 16-digit barcodes
  features: {
    delivery: boolean;                       // supports delivery manifests
    patientLimits: boolean;                  // enforces patient dispensing limits
    b2bTransfers: boolean;                   // business-to-business transfer support
    curbsidePickup: boolean;                 // curbside/express pickup support
    labResultsImport: boolean;               // API supports lab result import
    wasteTracking: boolean;                  // mandatory waste disposal reporting
    additives: boolean;                      // pesticide/additive tracking
    transportManifests: boolean;             // transport manifest generation
  };
  inventoryCategories: string[];             // state-specific inventory type classifications
  notes: string;                             // important state-specific nuances
  supportEmail: string;
}

export const BIOTRACK_STATES: Record<string, BioTrackStateConfig> = {
  FL: {
    name: 'Florida',
    apiBase: 'https://fl.biotr.ac/api',
    apiVersion: 'v3',
    authMethod: 'basic',
    dateFormat: 'iso8601',
    regulatoryBody: 'Office of Medical Marijuana Use (OMMU)',
    regulatoryAbbr: 'OMMU',
    programType: 'medical',
    reportingInterval: 'Real-time (within 5 minutes)',
    identifierFormat: 'uuid',
    features: {
      delivery: true,
      patientLimits: true,
      b2bTransfers: true,
      curbsidePickup: false,
      labResultsImport: true,
      wasteTracking: true,
      additives: true,
      transportManifests: true,
    },
    inventoryCategories: [
      'Clones', 'Tissue Culture', 'Seeds', 'Harvested Flower', 'Harvested Trim',
      'Flower Lot', 'Kief Lot', 'Other Material Lot',
      'Intermediate Products (Extracts/Formulations)',
      'End Products (Retail-Ready)',
    ],
    notes: 'MMTCs do not log into BioTrack STS directly — all interaction via approved third-party API. Data also reported to Medical Marijuana User Registry (MMUR). Potency calculations require batch number linkage. Separate API endpoints: api.licensee.fl.biotr.ac and api.delivery.fl.biotr.ac.',
    supportEmail: 'flhelp@biotrackthc.com',
  },
  NM: {
    name: 'New Mexico',
    apiBase: 'https://nm.biotr.ac/api',
    apiVersion: 'trace2',
    authMethod: 'session',
    dateFormat: 'iso8601',
    regulatoryBody: 'Cannabis Control Division (CCD) / NM Dept. of Health',
    regulatoryAbbr: 'CCD/DOH',
    programType: 'both',
    reportingInterval: 'Daily',
    identifierFormat: '16-digit',
    features: {
      delivery: true,
      patientLimits: true,
      b2bTransfers: true,
      curbsidePickup: true,
      labResultsImport: true,
      wasteTracking: true,
      additives: true,
      transportManifests: true,
    },
    inventoryCategories: [
      'Plants', 'Harvested Material', 'Extracted Concentrate',
      'Infused Product', 'Usable Cannabis', 'Waste',
    ],
    notes: 'NM has 4 API versions: v1 (2014 foundation), v2 (2021 — ISO dates, B2B), v3 (2022 — enhanced dispense/patient search), Trace 2.0 (latest). Auth via POST login → sessionid used as x-api-key header. CCD regulates adult-use; DOH oversees medical patient program. ISO8601 datetime required.',
    supportEmail: 'nmhelp@biotrackthc.com',
  },
  HI: {
    name: 'Hawaii',
    apiBase: 'https://hi.biotr.ac/api',
    apiVersion: 'v3',
    authMethod: 'basic',
    dateFormat: 'iso8601',
    regulatoryBody: 'Hawaii Department of Health (DOH)',
    regulatoryAbbr: 'DOH',
    programType: 'medical',
    reportingInterval: 'Daily',
    identifierFormat: '16-digit',
    features: {
      delivery: false,
      patientLimits: true,
      b2bTransfers: false,
      curbsidePickup: false,
      labResultsImport: true,
      wasteTracking: true,
      additives: true,
      transportManifests: true,
    },
    inventoryCategories: [
      'Plants', 'Harvested Material', 'Finished Products',
      'Waste', 'Lab Samples',
    ],
    notes: 'Medical-only program. Hosted on AWS GovCloud for FISMA-level data security. Limited inter-island transport support. No recreational/adult-use market. Strict patient verification required before dispensing.',
    supportEmail: 'hihelp@biotrackthc.com',
  },
  DE: {
    name: 'Delaware',
    apiBase: 'https://de.biotr.ac/api',
    apiVersion: 'v3',
    authMethod: 'basic',
    dateFormat: 'iso8601',
    regulatoryBody: 'Office of the Marijuana Commissioner (OMC) / DHSS',
    regulatoryAbbr: 'OMC/DHSS',
    programType: 'both',
    reportingInterval: 'Daily',
    identifierFormat: '16-digit',
    features: {
      delivery: true,
      patientLimits: true,
      b2bTransfers: true,
      curbsidePickup: false,
      labResultsImport: true,
      wasteTracking: true,
      additives: true,
      transportManifests: true,
    },
    inventoryCategories: [
      'Plants', 'Harvested Material', 'Concentrates',
      'Infused Products', 'Usable Cannabis', 'Waste',
    ],
    notes: 'BioTrack since 2017 for medical; expanded to adult-use after 2023 legalization. OMC oversees adult-use market; DHSS manages medical. Confirmed on v3-api. Dual-market compliance required — must track medical vs. recreational inventory separately.',
    supportEmail: 'dehelp@biotrackthc.com',
  },
  CT: {
    name: 'Connecticut',
    apiBase: 'https://ct.biotr.ac/api',
    apiVersion: 'v3',
    authMethod: 'basic',
    dateFormat: 'iso8601',
    regulatoryBody: 'Department of Consumer Protection (DCP)',
    regulatoryAbbr: 'DCP',
    programType: 'both',
    reportingInterval: 'Daily',
    identifierFormat: '16-digit',
    features: {
      delivery: true,
      patientLimits: true,
      b2bTransfers: true,
      curbsidePickup: true,
      labResultsImport: true,
      wasteTracking: true,
      additives: true,
      transportManifests: true,
    },
    inventoryCategories: [
      'Plants', 'Harvested Material', 'Concentrates',
      'Edibles', 'Tinctures', 'Topicals', 'Vaporization Products', 'Waste',
    ],
    notes: 'DCP awarded BioTrack the state contract in 2021. Supports both medical and adult-use. Most feature-complete BioTrack state deployment. Curbside pickup tracking supported. All licensed businesses must use BioTrack or compatible platform.',
    supportEmail: 'cthelp@biotrackthc.com',
  },
  AR: {
    name: 'Arkansas',
    apiBase: 'https://ar.biotr.ac/api',
    apiVersion: 'v3',
    authMethod: 'basic',
    dateFormat: 'iso8601',
    regulatoryBody: 'Arkansas Medical Marijuana Commission (AMMC) / ADH',
    regulatoryAbbr: 'AMMC/ADH',
    programType: 'medical',
    reportingInterval: 'Daily',
    identifierFormat: '16-digit',
    features: {
      delivery: false,
      patientLimits: true,
      b2bTransfers: true,
      curbsidePickup: false,
      labResultsImport: true,
      wasteTracking: true,
      additives: true,
      transportManifests: true,
    },
    inventoryCategories: [
      'Plants', 'Harvested Material', 'Concentrates',
      'Infused Products', 'Usable Cannabis', 'Waste',
    ],
    notes: 'Medical-only program managed by AMMC and ADH. No delivery permitted — dispensary pickup only. Strict seed-to-sale from cultivation through processing to retail. Patient card verification mandatory before dispensing.',
    supportEmail: 'arhelp@biotrackthc.com',
  },
};

export function getMetrcBaseUrl(stateCode: string, sandbox: boolean): string {
  const prefix = sandbox ? 'sandbox-api' : 'api';
  return `https://${prefix}-${stateCode.toLowerCase()}.metrc.com`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// METRC v2 ENDPOINT CATALOG — Complete mapping of all 22 categories
// ═══════════════════════════════════════════════════════════════════════════════

export type MetrcEndpointCategory =
  | 'additivesTemplates' | 'caregivers' | 'employees' | 'facilities'
  | 'harvests' | 'items' | 'labTests' | 'locations' | 'packages'
  | 'patientCheckIns' | 'patients' | 'plantBatches' | 'plants'
  | 'processingJobs' | 'retailId' | 'sales' | 'sandbox' | 'strains'
  | 'sublocations' | 'tags' | 'transfers' | 'transporters'
  | 'unitsOfMeasure' | 'wasteMethods';

export interface MetrcEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  description: string;
}

export const METRC_ENDPOINTS: Record<MetrcEndpointCategory, MetrcEndpoint[]> = {
  additivesTemplates: [
    { method: 'GET', path: '/additivestemplates/v2/{id}', description: 'Get template by ID' },
    { method: 'GET', path: '/additivestemplates/v2/active', description: 'List active templates' },
    { method: 'GET', path: '/additivestemplates/v2/inactive', description: 'List inactive templates' },
    { method: 'POST', path: '/additivestemplates/v2/', description: 'Create template' },
    { method: 'PUT', path: '/additivestemplates/v2/', description: 'Update template' },
  ],
  caregivers: [
    { method: 'GET', path: '/caregivers/v2/status/{caregiverLicenseNumber}', description: 'Check caregiver status' },
  ],
  employees: [
    { method: 'GET', path: '/employees/v2/', description: 'List employees' },
    { method: 'GET', path: '/employees/v2/permissions', description: 'List permissions' },
  ],
  facilities: [
    { method: 'GET', path: '/facilities/v2/', description: 'List facilities' },
  ],
  harvests: [
    { method: 'GET', path: '/harvests/v2/{id}', description: 'Get harvest by ID' },
    { method: 'GET', path: '/harvests/v2/active', description: 'List active harvests' },
    { method: 'GET', path: '/harvests/v2/onhold', description: 'List on-hold harvests' },
    { method: 'GET', path: '/harvests/v2/inactive', description: 'List inactive harvests' },
    { method: 'GET', path: '/harvests/v2/waste', description: 'List harvest waste' },
    { method: 'GET', path: '/harvests/v2/waste/types', description: 'List waste types' },
    { method: 'POST', path: '/harvests/v2/packages/testing', description: 'Create testing packages from harvest' },
    { method: 'POST', path: '/harvests/v2/packages', description: 'Create packages from harvest' },
    { method: 'POST', path: '/harvests/v2/waste', description: 'Report harvest waste' },
    { method: 'PUT', path: '/harvests/v2/location', description: 'Move harvest' },
    { method: 'PUT', path: '/harvests/v2/rename', description: 'Rename harvest' },
    { method: 'PUT', path: '/harvests/v2/finish', description: 'Finish harvest' },
    { method: 'PUT', path: '/harvests/v2/unfinish', description: 'Unfinish harvest' },
    { method: 'PUT', path: '/harvests/v2/restore/harvestedplants', description: 'Restore harvested plants' },
    { method: 'DELETE', path: '/harvests/v2/waste/{id}', description: 'Delete harvest waste' },
  ],
  items: [
    { method: 'GET', path: '/items/v2/{id}', description: 'Get item by ID' },
    { method: 'GET', path: '/items/v2/active', description: 'List active items' },
    { method: 'GET', path: '/items/v2/inactive', description: 'List inactive items' },
    { method: 'GET', path: '/items/v2/categories', description: 'List item categories' },
    { method: 'GET', path: '/items/v2/brands', description: 'List brands' },
    { method: 'GET', path: '/items/v2/photo/{id}', description: 'Get item photo' },
    { method: 'GET', path: '/items/v2/file/{id}', description: 'Get item file' },
    { method: 'POST', path: '/items/v2/', description: 'Create item' },
    { method: 'PUT', path: '/items/v2/', description: 'Update item' },
    { method: 'POST', path: '/items/v2/photo', description: 'Upload item photo' },
    { method: 'POST', path: '/items/v2/file', description: 'Upload item file' },
    { method: 'POST', path: '/items/v2/brand', description: 'Create brand' },
    { method: 'PUT', path: '/items/v2/brand', description: 'Update brand' },
    { method: 'DELETE', path: '/items/v2/{id}', description: 'Delete item' },
    { method: 'DELETE', path: '/items/v2/brand/{id}', description: 'Delete brand' },
  ],
  labTests: [
    { method: 'GET', path: '/labtests/v2/states', description: 'List lab test states' },
    { method: 'GET', path: '/labtests/v2/batches', description: 'List lab test batches' },
    { method: 'GET', path: '/labtests/v2/types', description: 'List lab test types' },
    { method: 'GET', path: '/labtests/v2/results', description: 'Get lab test results' },
    { method: 'GET', path: '/labtests/v2/labtestdocument/{id}', description: 'Get lab test document' },
    { method: 'POST', path: '/labtests/v2/record', description: 'Record lab test result' },
    { method: 'PUT', path: '/labtests/v2/labtestdocument', description: 'Upload lab test document' },
    { method: 'PUT', path: '/labtests/v2/results/release', description: 'Release lab test results' },
  ],
  locations: [
    { method: 'GET', path: '/locations/v2/{id}', description: 'Get location by ID' },
    { method: 'GET', path: '/locations/v2/active', description: 'List active locations' },
    { method: 'GET', path: '/locations/v2/inactive', description: 'List inactive locations' },
    { method: 'GET', path: '/locations/v2/types', description: 'List location types' },
    { method: 'POST', path: '/locations/v2/', description: 'Create location' },
    { method: 'PUT', path: '/locations/v2/', description: 'Update location' },
    { method: 'DELETE', path: '/locations/v2/{id}', description: 'Delete location' },
  ],
  packages: [
    { method: 'GET', path: '/packages/v2/{id}', description: 'Get package by ID' },
    { method: 'GET', path: '/packages/v2/{label}', description: 'Get package by label' },
    { method: 'GET', path: '/packages/v2/active', description: 'List active packages' },
    { method: 'GET', path: '/packages/v2/onhold', description: 'List on-hold packages' },
    { method: 'GET', path: '/packages/v2/inactive', description: 'List inactive packages' },
    { method: 'GET', path: '/packages/v2/intransit', description: 'List in-transit packages' },
    { method: 'GET', path: '/packages/v2/labsamples', description: 'List lab sample packages' },
    { method: 'GET', path: '/packages/v2/transferred', description: 'List transferred packages' },
    { method: 'GET', path: '/packages/v2/types', description: 'List package types' },
    { method: 'GET', path: '/packages/v2/adjustments', description: 'List package adjustments' },
    { method: 'GET', path: '/packages/v2/adjust/reasons', description: 'List adjustment reasons' },
    { method: 'GET', path: '/packages/v2/{id}/source/harvests', description: 'Get source harvests' },
    { method: 'POST', path: '/packages/v2/', description: 'Create package' },
    { method: 'POST', path: '/packages/v2/testing', description: 'Create testing package' },
    { method: 'POST', path: '/packages/v2/plantings', description: 'Create planting package' },
    { method: 'POST', path: '/packages/v2/adjust', description: 'Adjust package (new)' },
    { method: 'PUT', path: '/packages/v2/adjust', description: 'Adjust package' },
    { method: 'PUT', path: '/packages/v2/item', description: 'Change package item' },
    { method: 'PUT', path: '/packages/v2/note', description: 'Update package note' },
    { method: 'PUT', path: '/packages/v2/location', description: 'Move package' },
    { method: 'PUT', path: '/packages/v2/usebydate', description: 'Set use-by date' },
    { method: 'PUT', path: '/packages/v2/externalid', description: 'Update external ID' },
    { method: 'PUT', path: '/packages/v2/labtests/required', description: 'Set required lab tests' },
    { method: 'PUT', path: '/packages/v2/remediate', description: 'Remediate package' },
    { method: 'PUT', path: '/packages/v2/pretreat', description: 'Pretreat package' },
    { method: 'PUT', path: '/packages/v2/decontaminate', description: 'Decontaminate package' },
    { method: 'PUT', path: '/packages/v2/finish', description: 'Finish package' },
    { method: 'PUT', path: '/packages/v2/unfinish', description: 'Unfinish package' },
    { method: 'PUT', path: '/packages/v2/donation/flag', description: 'Flag as donation' },
    { method: 'PUT', path: '/packages/v2/donation/unflag', description: 'Unflag donation' },
    { method: 'PUT', path: '/packages/v2/tradesample/flag', description: 'Flag as trade sample' },
    { method: 'PUT', path: '/packages/v2/tradesample/unflag', description: 'Unflag trade sample' },
    { method: 'PUT', path: '/packages/v2/finishedgood/flag', description: 'Flag as finished good' },
    { method: 'PUT', path: '/packages/v2/finishedgood/unflag', description: 'Unflag finished good' },
    { method: 'DELETE', path: '/packages/v2/{id}', description: 'Delete package' },
  ],
  patientCheckIns: [
    { method: 'GET', path: '/patient-checkins/v2/locations', description: 'List check-in locations' },
    { method: 'GET', path: '/patient-checkins/v2/', description: 'List patient check-ins' },
    { method: 'POST', path: '/patient-checkins/v2/', description: 'Create check-in' },
    { method: 'PUT', path: '/patient-checkins/v2/', description: 'Update check-in' },
    { method: 'DELETE', path: '/patient-checkins/v2/{id}', description: 'Delete check-in' },
  ],
  patients: [
    { method: 'GET', path: '/patients/v2/{id}', description: 'Get patient by ID' },
    { method: 'GET', path: '/patients/v2/active', description: 'List active patients' },
    { method: 'GET', path: '/patients/v2/statuses/{patientLicenseNumber}', description: 'Check patient status' },
    { method: 'POST', path: '/patients/v2/', description: 'Create patient' },
    { method: 'PUT', path: '/patients/v2/', description: 'Update patient' },
    { method: 'DELETE', path: '/patients/v2/{id}', description: 'Delete patient' },
  ],
  plantBatches: [
    { method: 'GET', path: '/plantbatches/v2/{id}', description: 'Get plant batch by ID' },
    { method: 'GET', path: '/plantbatches/v2/active', description: 'List active plant batches' },
    { method: 'GET', path: '/plantbatches/v2/inactive', description: 'List inactive plant batches' },
    { method: 'GET', path: '/plantbatches/v2/types', description: 'List plant batch types' },
    { method: 'GET', path: '/plantbatches/v2/waste', description: 'List plant batch waste' },
    { method: 'GET', path: '/plantbatches/v2/waste/reasons', description: 'List waste reasons' },
    { method: 'POST', path: '/plantbatches/v2/plantings', description: 'Create plantings' },
    { method: 'POST', path: '/plantbatches/v2/packages', description: 'Create packages from batch' },
    { method: 'POST', path: '/plantbatches/v2/packages/frommotherplant', description: 'Packages from mother plant' },
    { method: 'POST', path: '/plantbatches/v2/split', description: 'Split plant batch' },
    { method: 'POST', path: '/plantbatches/v2/growthphase', description: 'Change growth phase' },
    { method: 'POST', path: '/plantbatches/v2/additives', description: 'Add additives' },
    { method: 'POST', path: '/plantbatches/v2/additives/usingtemplate', description: 'Add additives via template' },
    { method: 'POST', path: '/plantbatches/v2/waste', description: 'Report batch waste' },
    { method: 'POST', path: '/plantbatches/v2/adjust', description: 'Adjust batch' },
    { method: 'PUT', path: '/plantbatches/v2/name', description: 'Rename batch' },
    { method: 'PUT', path: '/plantbatches/v2/tag', description: 'Update batch tag' },
    { method: 'PUT', path: '/plantbatches/v2/strain', description: 'Change batch strain' },
    { method: 'PUT', path: '/plantbatches/v2/location', description: 'Move batch' },
    { method: 'DELETE', path: '/plantbatches/v2/', description: 'Delete plant batch' },
  ],
  plants: [
    { method: 'GET', path: '/plants/v2/{id}', description: 'Get plant by ID' },
    { method: 'GET', path: '/plants/v2/{label}', description: 'Get plant by label' },
    { method: 'GET', path: '/plants/v2/vegetative', description: 'List vegetative plants' },
    { method: 'GET', path: '/plants/v2/flowering', description: 'List flowering plants' },
    { method: 'GET', path: '/plants/v2/onhold', description: 'List on-hold plants' },
    { method: 'GET', path: '/plants/v2/inactive', description: 'List inactive plants' },
    { method: 'GET', path: '/plants/v2/mother', description: 'List mother plants' },
    { method: 'GET', path: '/plants/v2/mother/inactive', description: 'List inactive mother plants' },
    { method: 'GET', path: '/plants/v2/mother/onhold', description: 'List on-hold mother plants' },
    { method: 'GET', path: '/plants/v2/additives', description: 'List plant additives' },
    { method: 'GET', path: '/plants/v2/additives/types', description: 'List additive types' },
    { method: 'GET', path: '/plants/v2/growthphases', description: 'List growth phases' },
    { method: 'GET', path: '/plants/v2/waste', description: 'List plant waste' },
    { method: 'GET', path: '/plants/v2/waste/reasons', description: 'List waste reasons' },
    { method: 'GET', path: '/plants/v2/waste/methods/all', description: 'List waste methods' },
    { method: 'GET', path: '/plants/v2/waste/{id}/plant', description: 'Get waste plant source' },
    { method: 'GET', path: '/plants/v2/waste/{id}/package', description: 'Get waste package source' },
    { method: 'POST', path: '/plants/v2/plantings', description: 'Create plantings' },
    { method: 'POST', path: '/plants/v2/plantbatch/packages', description: 'Create batch packages' },
    { method: 'POST', path: '/plants/v2/manicure', description: 'Manicure plants' },
    { method: 'POST', path: '/plants/v2/additives', description: 'Add additives to plants' },
    { method: 'POST', path: '/plants/v2/additives/usingtemplate', description: 'Add additives via template' },
    { method: 'POST', path: '/plants/v2/additives/bylocation', description: 'Add additives by location' },
    { method: 'POST', path: '/plants/v2/additives/bylocation/usingtemplate', description: 'Add by location via template' },
    { method: 'POST', path: '/plants/v2/waste', description: 'Report plant waste' },
    { method: 'PUT', path: '/plants/v2/location', description: 'Move plants' },
    { method: 'PUT', path: '/plants/v2/growthphase', description: 'Change growth phase' },
    { method: 'PUT', path: '/plants/v2/tag', description: 'Update plant tag' },
    { method: 'PUT', path: '/plants/v2/strain', description: 'Change plant strain' },
    { method: 'PUT', path: '/plants/v2/harvest', description: 'Harvest plants' },
    { method: 'PUT', path: '/plants/v2/merge', description: 'Merge plants' },
    { method: 'PUT', path: '/plants/v2/split', description: 'Split plant' },
    { method: 'DELETE', path: '/plants/v2/', description: 'Destroy plants' },
  ],
  processingJobs: [
    { method: 'GET', path: '/processing/v2/{id}', description: 'Get processing job by ID' },
    { method: 'GET', path: '/processing/v2/active', description: 'List active jobs' },
    { method: 'GET', path: '/processing/v2/inactive', description: 'List inactive jobs' },
    { method: 'GET', path: '/processing/v2/jobtypes/active', description: 'List active job types' },
    { method: 'GET', path: '/processing/v2/jobtypes/inactive', description: 'List inactive job types' },
    { method: 'GET', path: '/processing/v2/jobtypes/attributes', description: 'List job type attributes' },
    { method: 'GET', path: '/processing/v2/jobtypes/categories', description: 'List job type categories' },
    { method: 'POST', path: '/processing/v2/start', description: 'Start processing job' },
    { method: 'POST', path: '/processing/v2/createpackages', description: 'Create packages from job' },
    { method: 'POST', path: '/processing/v2/adjust', description: 'Adjust processing job' },
    { method: 'POST', path: '/processing/v2/jobtypes', description: 'Create job type' },
    { method: 'PUT', path: '/processing/v2/finish', description: 'Finish processing job' },
    { method: 'PUT', path: '/processing/v2/unfinish', description: 'Unfinish processing job' },
    { method: 'PUT', path: '/processing/v2/jobtypes', description: 'Update job type' },
    { method: 'DELETE', path: '/processing/v2/jobtypes/{id}', description: 'Delete job type' },
    { method: 'DELETE', path: '/processing/v2/{id}', description: 'Delete processing job' },
  ],
  retailId: [
    { method: 'GET', path: '/retailid/v2/allotment', description: 'Get retail ID allotment' },
    { method: 'GET', path: '/retailid/v2/receive/{label}', description: 'Receive by label' },
    { method: 'GET', path: '/retailid/v2/receive/qr/{shortCode}', description: 'Receive by QR code' },
    { method: 'POST', path: '/retailid/v2/associate', description: 'Associate retail ID' },
    { method: 'POST', path: '/retailid/v2/generate', description: 'Generate retail ID' },
    { method: 'POST', path: '/retailid/v2/merge', description: 'Merge retail IDs' },
    { method: 'POST', path: '/retailid/v2/packages/info', description: 'Get package info by retail ID' },
  ],
  sales: [
    { method: 'GET', path: '/sales/v2/customertypes', description: 'List customer types' },
    { method: 'GET', path: '/sales/v2/paymenttypes', description: 'List payment types' },
    { method: 'GET', path: '/sales/v2/counties', description: 'List counties' },
    { method: 'GET', path: '/sales/v2/patientregistration/locations', description: 'Patient registration locations' },
    { method: 'GET', path: '/sales/v2/receipts/{id}', description: 'Get receipt by ID' },
    { method: 'GET', path: '/sales/v2/receipts/external/{externalNumber}', description: 'Get receipt by external #' },
    { method: 'GET', path: '/sales/v2/receipts/active', description: 'List active receipts' },
    { method: 'GET', path: '/sales/v2/receipts/inactive', description: 'List inactive receipts' },
    { method: 'POST', path: '/sales/v2/receipts', description: 'Create sales receipt' },
    { method: 'PUT', path: '/sales/v2/receipts', description: 'Update sales receipt' },
    { method: 'PUT', path: '/sales/v2/receipts/finalize', description: 'Finalize receipt' },
    { method: 'PUT', path: '/sales/v2/receipts/unfinalize', description: 'Unfinalize receipt' },
    { method: 'DELETE', path: '/sales/v2/receipts/{id}', description: 'Delete receipt' },
    { method: 'GET', path: '/sales/v2/deliveries/{id}', description: 'Get delivery by ID' },
    { method: 'GET', path: '/sales/v2/deliveries/active', description: 'List active deliveries' },
    { method: 'GET', path: '/sales/v2/deliveries/inactive', description: 'List inactive deliveries' },
    { method: 'GET', path: '/sales/v2/deliveries/returnreasons', description: 'List return reasons' },
    { method: 'POST', path: '/sales/v2/deliveries', description: 'Create delivery' },
    { method: 'PUT', path: '/sales/v2/deliveries', description: 'Update delivery' },
    { method: 'PUT', path: '/sales/v2/deliveries/complete', description: 'Complete delivery' },
    { method: 'PUT', path: '/sales/v2/deliveries/hub', description: 'Update hub delivery' },
    { method: 'PUT', path: '/sales/v2/deliveries/hub/accept', description: 'Accept hub delivery' },
    { method: 'PUT', path: '/sales/v2/deliveries/hub/depart', description: 'Depart hub delivery' },
    { method: 'PUT', path: '/sales/v2/deliveries/hub/verifyID', description: 'Verify ID at hub' },
    { method: 'DELETE', path: '/sales/v2/deliveries/{id}', description: 'Delete delivery' },
    { method: 'GET', path: '/sales/v2/deliveries/retailer/active', description: 'Active retailer deliveries' },
    { method: 'GET', path: '/sales/v2/deliveries/retailer/inactive', description: 'Inactive retailer deliveries' },
    { method: 'GET', path: '/sales/v2/deliveries/retailer/{id}', description: 'Get retailer delivery' },
    { method: 'POST', path: '/sales/v2/deliveries/retailer', description: 'Create retailer delivery' },
    { method: 'PUT', path: '/sales/v2/deliveries/retailer', description: 'Update retailer delivery' },
    { method: 'DELETE', path: '/sales/v2/deliveries/retailer/{id}', description: 'Delete retailer delivery' },
    { method: 'POST', path: '/sales/v2/deliveries/retailer/depart', description: 'Depart retailer delivery' },
    { method: 'POST', path: '/sales/v2/deliveries/retailer/restock', description: 'Restock retailer delivery' },
    { method: 'POST', path: '/sales/v2/deliveries/retailer/sale', description: 'Record retailer sale' },
    { method: 'POST', path: '/sales/v2/deliveries/retailer/end', description: 'End retailer delivery' },
  ],
  sandbox: [
    { method: 'POST', path: '/sandbox/v2/integrator/setup', description: 'Set up sandbox integrator environment' },
  ],
  strains: [
    { method: 'GET', path: '/strains/v2/{id}', description: 'Get strain by ID' },
    { method: 'GET', path: '/strains/v2/active', description: 'List active strains' },
    { method: 'GET', path: '/strains/v2/inactive', description: 'List inactive strains' },
    { method: 'POST', path: '/strains/v2/', description: 'Create strain' },
    { method: 'PUT', path: '/strains/v2/', description: 'Update strain' },
    { method: 'DELETE', path: '/strains/v2/{id}', description: 'Delete strain' },
  ],
  sublocations: [
    { method: 'GET', path: '/sublocations/v2/{id}', description: 'Get sublocation by ID' },
    { method: 'GET', path: '/sublocations/v2/active', description: 'List active sublocations' },
    { method: 'GET', path: '/sublocations/v2/inactive', description: 'List inactive sublocations' },
    { method: 'POST', path: '/sublocations/v2/', description: 'Create sublocation' },
    { method: 'PUT', path: '/sublocations/v2/', description: 'Update sublocation' },
    { method: 'DELETE', path: '/sublocations/v2/{id}', description: 'Delete sublocation' },
  ],
  tags: [
    { method: 'GET', path: '/tags/v2/plant/available', description: 'Available plant tags' },
    { method: 'GET', path: '/tags/v2/package/available', description: 'Available package tags' },
    { method: 'GET', path: '/tags/v2/staged', description: 'Staged tags' },
  ],
  transfers: [
    { method: 'GET', path: '/transfers/v2/hub', description: 'List hub transfers' },
    { method: 'GET', path: '/transfers/v2/incoming', description: 'List incoming transfers' },
    { method: 'GET', path: '/transfers/v2/outgoing', description: 'List outgoing transfers' },
    { method: 'GET', path: '/transfers/v2/rejected', description: 'List rejected transfers' },
    { method: 'GET', path: '/transfers/v2/types', description: 'List transfer types' },
    { method: 'GET', path: '/transfers/v2/{id}/deliveries', description: 'Get transfer deliveries' },
    { method: 'GET', path: '/transfers/v2/deliveries/{id}/transporters', description: 'Get delivery transporters' },
    { method: 'GET', path: '/transfers/v2/deliveries/{id}/transporters/details', description: 'Transporter details' },
    { method: 'GET', path: '/transfers/v2/deliveries/{id}/packages', description: 'Get delivery packages' },
    { method: 'GET', path: '/transfers/v2/deliveries/{id}/packages/wholesale', description: 'Wholesale package data' },
    { method: 'GET', path: '/transfers/v2/deliveries/package/{id}/requiredlabtestbatches', description: 'Required lab tests' },
    { method: 'GET', path: '/transfers/v2/deliveries/packages/states', description: 'Package delivery states' },
    { method: 'GET', path: '/transfers/v2/manifest/{id}/pdf', description: 'Download manifest PDF' },
    { method: 'GET', path: '/transfers/v2/templates/outgoing', description: 'List outgoing templates' },
    { method: 'GET', path: '/transfers/v2/templates/outgoing/{id}/deliveries', description: 'Template deliveries' },
    { method: 'GET', path: '/transfers/v2/templates/outgoing/deliveries/{id}/transporters', description: 'Template transporters' },
    { method: 'GET', path: '/transfers/v2/templates/outgoing/deliveries/{id}/transporters/details', description: 'Template transporter details' },
    { method: 'GET', path: '/transfers/v2/templates/outgoing/deliveries/{id}/packages', description: 'Template packages' },
    { method: 'POST', path: '/transfers/v2/external/incoming', description: 'Create external incoming' },
    { method: 'POST', path: '/transfers/v2/templates/outgoing', description: 'Create outgoing template' },
    { method: 'POST', path: '/transfers/v2/hub/arrive', description: 'Hub arrival' },
    { method: 'POST', path: '/transfers/v2/hub/checkin', description: 'Hub check-in' },
    { method: 'POST', path: '/transfers/v2/hub/checkout', description: 'Hub check-out' },
    { method: 'POST', path: '/transfers/v2/hub/depart', description: 'Hub departure' },
    { method: 'PUT', path: '/transfers/v2/external/incoming', description: 'Update external incoming' },
    { method: 'PUT', path: '/transfers/v2/templates/outgoing', description: 'Update outgoing template' },
    { method: 'DELETE', path: '/transfers/v2/external/incoming/{id}', description: 'Delete external incoming' },
    { method: 'DELETE', path: '/transfers/v2/templates/outgoing/{id}', description: 'Delete outgoing template' },
  ],
  transporters: [
    { method: 'GET', path: '/transporters/v2/drivers', description: 'List drivers' },
    { method: 'GET', path: '/transporters/v2/drivers/{id}', description: 'Get driver by ID' },
    { method: 'POST', path: '/transporters/v2/drivers', description: 'Create driver' },
    { method: 'PUT', path: '/transporters/v2/drivers', description: 'Update driver' },
    { method: 'DELETE', path: '/transporters/v2/drivers/{id}', description: 'Delete driver' },
    { method: 'GET', path: '/transporters/v2/vehicles', description: 'List vehicles' },
    { method: 'GET', path: '/transporters/v2/vehicles/{id}', description: 'Get vehicle by ID' },
    { method: 'POST', path: '/transporters/v2/vehicles', description: 'Create vehicle' },
    { method: 'PUT', path: '/transporters/v2/vehicles', description: 'Update vehicle' },
    { method: 'DELETE', path: '/transporters/v2/vehicles/{id}', description: 'Delete vehicle' },
  ],
  unitsOfMeasure: [
    { method: 'GET', path: '/unitsofmeasure/v2/active', description: 'List active units of measure' },
    { method: 'GET', path: '/unitsofmeasure/v2/inactive', description: 'List inactive units of measure' },
  ],
  wasteMethods: [
    { method: 'GET', path: '/wastemethods/v2/', description: 'List waste disposal methods' },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════════
// BIOTRACK API ENDPOINT CATALOG
// ═══════════════════════════════════════════════════════════════════════════════

export type BioTrackEndpointCategory =
  | 'inventory' | 'plants' | 'manifests' | 'dispensing'
  | 'labResults' | 'patients' | 'rooms' | 'employees' | 'vendors'
  | 'sync' | 'waste' | 'strains' | 'harvests';

export const BIOTRACK_ENDPOINTS: Record<BioTrackEndpointCategory, MetrcEndpoint[]> = {
  inventory: [
    { method: 'GET', path: '/inventory/lookup', description: 'Look up inventory by barcode/ID' },
    { method: 'GET', path: '/inventory/list', description: 'List all inventory items' },
    { method: 'POST', path: '/inventory/create', description: 'Create inventory item' },
    { method: 'POST', path: '/inventory/adjust', description: 'Adjust inventory weight/quantity' },
    { method: 'POST', path: '/inventory/convert', description: 'Convert inventory between product types' },
    { method: 'POST', path: '/inventory/move', description: 'Move inventory between rooms' },
    { method: 'DELETE', path: '/inventory/remove', description: 'Remove inventory' },
    { method: 'GET', path: '/inventory/types', description: 'List inventory product types' },
    { method: 'GET', path: '/inventory/adjust/reasons', description: 'List adjustment reasons' },
  ],
  plants: [
    { method: 'GET', path: '/plants/lookup', description: 'Look up plant by 16-digit ID' },
    { method: 'GET', path: '/plants/list', description: 'List all plants' },
    { method: 'POST', path: '/plants/create', description: 'Register new plant' },
    { method: 'POST', path: '/plants/harvest', description: 'Harvest plant' },
    { method: 'POST', path: '/plants/destroy', description: 'Destroy plant' },
    { method: 'POST', path: '/plants/phase', description: 'Change growth phase' },
    { method: 'POST', path: '/plants/move', description: 'Move plant to room' },
    { method: 'POST', path: '/plants/additives', description: 'Record pesticide/additive application' },
  ],
  manifests: [
    { method: 'GET', path: '/manifests/list', description: 'List all manifests' },
    { method: 'GET', path: '/manifests/lookup', description: 'Look up manifest by ID' },
    { method: 'POST', path: '/manifests/create', description: 'Create regular manifest (self-transport)' },
    { method: 'POST', path: '/manifests/create/pickup', description: 'Create pickup manifest (vendor pickup)' },
    { method: 'POST', path: '/manifests/receive', description: 'Receive manifested items' },
    { method: 'POST', path: '/manifests/void', description: 'Void manifest' },
    { method: 'GET', path: '/manifests/vehicles', description: 'List registered vehicles' },
    { method: 'GET', path: '/manifests/drivers', description: 'List registered drivers' },
    { method: 'GET', path: '/manifests/routes', description: 'List available routes' },
  ],
  dispensing: [
    { method: 'POST', path: '/dispensing/sale', description: 'Record dispensary sale' },
    { method: 'POST', path: '/dispensing/void', description: 'Void dispensing transaction' },
    { method: 'GET', path: '/dispensing/history', description: 'Get dispensing history' },
    { method: 'GET', path: '/dispensing/limits', description: 'Check patient dispensing limits' },
  ],
  labResults: [
    { method: 'GET', path: '/lab/results', description: 'Get lab results for batch/inventory' },
    { method: 'POST', path: '/lab/results/import', description: 'Import lab results (direct)' },
    { method: 'POST', path: '/lab/results/csv', description: 'Import lab results (CSV upload)' },
    { method: 'GET', path: '/lab/types', description: 'List lab test types' },
  ],
  patients: [
    { method: 'GET', path: '/patients/verify', description: 'Verify patient by card key' },
    { method: 'GET', path: '/patients/lookup', description: 'Look up patient information' },
    { method: 'POST', path: '/patients/import', description: 'Import patient data' },
    { method: 'GET', path: '/patients/allotment', description: 'Check patient allotment/limits' },
  ],
  rooms: [
    { method: 'GET', path: '/rooms/list', description: 'List all rooms/locations' },
    { method: 'POST', path: '/rooms/create', description: 'Create room' },
    { method: 'PUT', path: '/rooms/update', description: 'Update room' },
  ],
  employees: [
    { method: 'GET', path: '/employees/list', description: 'List employees' },
    { method: 'POST', path: '/employees/create', description: 'Create employee' },
  ],
  vendors: [
    { method: 'GET', path: '/vendors/list', description: 'List vendors' },
    { method: 'GET', path: '/vendors/lookup', description: 'Look up vendor by license' },
  ],
  sync: [
    { method: 'POST', path: '/sync/inventory', description: 'Full inventory sync' },
    { method: 'POST', path: '/sync/plants', description: 'Full plant sync' },
    { method: 'POST', path: '/sync/manifests', description: 'Full manifest sync' },
    { method: 'POST', path: '/sync/sales', description: 'Full sales sync' },
    { method: 'GET', path: '/sync/status', description: 'Check sync job status' },
    { method: 'GET', path: '/sync/changes', description: 'List changes since last sync' },
  ],
  waste: [
    { method: 'POST', path: '/waste/record', description: 'Record waste disposal' },
    { method: 'GET', path: '/waste/reasons', description: 'List waste reasons' },
    { method: 'GET', path: '/waste/methods', description: 'List waste disposal methods' },
    { method: 'GET', path: '/waste/history', description: 'Waste disposal history' },
  ],
  strains: [
    { method: 'GET', path: '/strains/list', description: 'List strains' },
    { method: 'POST', path: '/strains/create', description: 'Register strain' },
    { method: 'PUT', path: '/strains/update', description: 'Update strain' },
  ],
  harvests: [
    { method: 'GET', path: '/harvests/list', description: 'List harvests' },
    { method: 'POST', path: '/harvests/create', description: 'Create harvest batch' },
    { method: 'POST', path: '/harvests/finish', description: 'Finish harvest' },
    { method: 'GET', path: '/harvests/lookup', description: 'Look up harvest by ID' },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════════
// COMPLIANCE CONFIG TYPES (stored in site:config)
// ═══════════════════════════════════════════════════════════════════════════════

export interface MetrcConfig {
  enabled: boolean;
  integratorApiKey: string;
  userApiKey: string;
  licenseNumber: string;
  stateCode: string;
  sandbox: boolean;
  lastConnected?: string;
  connectionStatus?: 'connected' | 'error' | 'disconnected';
  connectionError?: string;
}

export interface BioTrackConfig {
  enabled: boolean;
  apiUrl: string;
  username: string;
  password: string;
  licenseNumber: string;
  stateCode: string;
  apiVersion: 'v2' | 'v3';
  companyId?: string;                  // required for NM session-based auth
  sessionId?: string;                  // populated at runtime from POST /login response
  sessionExpiry?: string;              // ISO timestamp when session expires
  lastConnected?: string;
  connectionStatus?: 'connected' | 'error' | 'disconnected';
  connectionError?: string;
}

export type ComplianceProvider = 'metrc' | 'biotrack' | null;
export type CannabisLicenseType = 'retail' | 'manufacturing' | 'cultivation';

// ═══════════════════════════════════════════════════════════════════════════════
// AUDIT / RECONCILIATION TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface TransporterDriver { id: string; name: string; licenseNumber: string; }
export interface TransporterVehicle { id: string; make: string; model: string; licensePlate: string; }
export interface B2BVendor { id: string; name: string; licenseNumber: string; facilityType: string; }
export interface CompliancePlant { id: string; strain: string; phase: 'vegetative' | 'flowering' | 'harvested'; room: string; plantedDate: string; }
export interface CompliancePackage { id: string; tag: string; item: string; quantity: number; unit: string; labStatus: 'passed' | 'failed' | 'testing' | 'none'; }
export interface ComplianceHarvest { id: string; name: string; wetWeight: number; unit: string; status: 'active' | 'finished'; }
export interface ComplianceSaleReceipt { id: string; receiptNumber: string; totalAmount: number; date: string; patientId?: string; }
export interface ComplianceLabTest { id: string; batchId: string; status: 'passed' | 'failed'; testedDate: string; }


export type DiscrepancyStatus = 'unresolved' | 'synced_to_provider' | 'bypassed' | 'dismissed';

export interface ReconciliationItem {
  id: string;
  sku: string;
  productName: string;
  category: string;
  posQuantity: number;
  providerQuantity: number;
  discrepancy: number;            // posQuantity - providerQuantity
  unit: string;                   // grams, units, ounces, etc.
  providerTag?: string;           // METRC tag or BioTrack barcode
  batchNumber?: string;
  lastSyncedAt?: string;
  status: DiscrepancyStatus;
  resolvedAt?: string;
  resolvedBy?: string;
  resolution?: 'sync_to_provider' | 'bypass_accept_provider' | 'dismiss';
  notes?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: 'sync_to_provider' | 'bypass_accept_provider' | 'dismiss' | 'bulk_sync' | 'bulk_bypass' | 'reconciliation_run';
  itemCount: number;
  performedBy: string;
  provider: 'metrc' | 'biotrack';
  details?: string;
  items?: { sku: string; name: string; before: number; after: number }[];
}

export interface ComplianceConfig {
  activeProvider: ComplianceProvider;
  licenseType: CannabisLicenseType | null;
  metrc: MetrcConfig;
  biotrack: BioTrackConfig;
  syncSchedule: 'manual' | '15min' | '30min' | '1hour' | '4hours' | 'daily';
  lastFullSync?: string;
  autoReportSales: boolean;
  autoSyncInventory: boolean;
}

export const DEFAULT_COMPLIANCE_CONFIG: ComplianceConfig = {
  activeProvider: null,
  licenseType: null,
  metrc: {
    enabled: false,
    integratorApiKey: '',
    userApiKey: '',
    licenseNumber: '',
    stateCode: '',
    sandbox: true,
    connectionStatus: 'disconnected',
  },
  biotrack: {
    enabled: false,
    apiUrl: '',
    username: '',
    password: '',
    licenseNumber: '',
    stateCode: '',
    apiVersion: 'v3',
    connectionStatus: 'disconnected',
  },
  syncSchedule: 'manual',
  autoReportSales: false,
  autoSyncInventory: false,
};

// ═══════════════════════════════════════════════════════════════════════════════
// COMPLIANCE TAB DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

export type ComplianceTabKey =
  | 'dashboard'
  | 'integrations'
  | 'plants'
  | 'packages'
  | 'harvests'
  | 'transfers'
  | 'sales'
  | 'labTests'
  | 'audit';

export interface ComplianceTab {
  key: ComplianceTabKey;
  label: string;
  icon: string;
  description: string;
  metrcCategories: MetrcEndpointCategory[];
  biotrackCategories: BioTrackEndpointCategory[];
  licenseTypes?: CannabisLicenseType[];
}

export const COMPLIANCE_TABS: ComplianceTab[] = [
  {
    key: 'integrations',
    label: 'Integrations',
    icon: '🔗',
    description: 'Connect METRC & BioTrack credentials, test connections, configure sync',
    metrcCategories: ['facilities', 'employees'],
    biotrackCategories: ['employees'],
  },
  {
    key: 'plants',
    label: 'Plants & Batches',
    icon: '🌱',
    description: 'Manage plant lifecycle, batches, growth phases, strains, locations, additives',
    metrcCategories: ['plants', 'plantBatches', 'strains', 'locations', 'sublocations', 'additivesTemplates'],
    biotrackCategories: ['plants', 'rooms'],
    licenseTypes: ['cultivation'],
  },
  {
    key: 'packages',
    label: 'Packages & Inventory',
    icon: '📦',
    description: 'Track packages, items, tags, adjustments, remediation, trade samples',
    metrcCategories: ['packages', 'items', 'tags', 'unitsOfMeasure'],
    biotrackCategories: ['inventory'],
    // All licenses use packages
  },
  {
    key: 'harvests',
    label: 'Harvests & Processing',
    icon: '🌾',
    description: 'Manage harvests, processing jobs, waste tracking, package creation',
    metrcCategories: ['harvests', 'processingJobs', 'wasteMethods'],
    biotrackCategories: ['inventory'],
    licenseTypes: ['cultivation', 'manufacturing'],
  },
  {
    key: 'transfers',
    label: 'Transfers & Manifests',
    icon: '🚚',
    description: 'Create/track transfers, manifest PDFs, hub operations, drivers, vehicles',
    metrcCategories: ['transfers', 'transporters'],
    biotrackCategories: ['manifests', 'vendors'],
    // All licenses transfer bounds
  },
  {
    key: 'sales',
    label: 'Sales & Patients',
    icon: '💰',
    description: 'Sales receipts, deliveries, patient management, check-ins, caregivers, retail ID',
    metrcCategories: ['sales', 'patients', 'patientCheckIns', 'caregivers', 'retailId'],
    biotrackCategories: ['dispensing', 'patients'],
    licenseTypes: ['retail'],
  },
  {
    key: 'labTests',
    label: 'Lab Tests & Dashboard',
    icon: '🧪',
    description: 'Lab test results, compliance dashboard, audit exports, waste methods',
    metrcCategories: ['labTests'],
    biotrackCategories: ['labResults'],
    licenseTypes: ['retail', 'manufacturing'],
  },
  {
    key: 'audit',
    label: 'Audit & Reconciliation',
    icon: '📊',
    description: 'Track inventory discrepancies between POS and compliance provider, sync or bypass adjustments',
    metrcCategories: ['packages', 'items'],
    biotrackCategories: ['inventory'],
  },
];
