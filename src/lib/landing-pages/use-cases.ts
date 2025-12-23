/**
 * Use Case Landing Page Data
 * Programmatic SEO: concrete workflows independent of industry
 */

import { UseCaseData } from './types';

export const USE_CASE_DATA: Record<string, UseCaseData> = {
  'qr-deposits': {
    slug: 'qr-deposits',
    name: 'QR Deposits',
    title: 'QR Deposits | Collect Upfront Payments Instantly',
    metaDescription:
      'Collect diagnostic, booking, or custom-order deposits via QR. Tie payments to tickets, export audit trails, and reduce disputes with transparent receipts.',
    headline: 'Collect Deposits in Seconds with QR',
    subheadline:
      'Upfront payments linked to tickets and references. Faster approvals, fewer disputes, complete audit trail.',
    benefits: [
      {
        icon: '💳',
        title: 'Upfront Cash Flow',
        description:
          'Secure deposits before work starts to reduce cancellations and improve scheduling.',
      },
      {
        icon: '🧾',
        title: 'Ticket-Linked Receipts',
        description:
          'Each deposit references a ticket ID with itemized notes for transparent records.',
      },
      {
        icon: '📈',
        title: 'Fewer Disputes',
        description:
          'Clear scope and deposit references minimize misunderstandings and chargebacks.',
      },
    ],
    howItWorks: [
      'Create a ticket and set deposit amount',
      'Generate a QR linked to the ticket',
      'Customer scans and pays',
      'Receipt stores references and notes',
      'Proceed with work once deposit is confirmed',
    ],
    useCases: [
      {
        title: 'Phone Repair Diagnostics',
        description:
          'Collect a $10 diagnostic deposit tied to IMEI and issue notes.',
        example:
          'Customer pays via QR; tech starts diagnostics with audit-ready receipt.',
      },
      {
        title: 'Custom Pottery Order',
        description:
          'Secure a 20% deposit linked to materials and kiln batch schedule.',
        example:
          'Deposit receipt lists clay/glaze choices and target firing date.',
      },
      {
        title: 'Tailoring & Alterations',
        description:
          'Take small deposits to reserve slots and materials.',
        example:
          'Scope and garment notes are embedded in the receipt for clarity.',
      },
    ],
    faqs: [
      {
        question: 'Can deposits be refunded?',
        answer:
          'Yes. Issue partial or full refunds with references to the original ticket and receipt.',
      },
      {
        question: 'Do deposits work offline?',
        answer:
          'Deposits can be recorded offline and sync with receipts when connectivity returns.',
      },
    ],
    relatedIndustries: [
      'mobile-phone-repair',
      'artisan-potters',
      'community-tailors',
      'restaurants',
    ],
  },

  'split-payments': {
    slug: 'split-payments',
    name: 'Split Payments',
    title: 'Split Payments | Automatic Revenue Sharing',
    metaDescription:
      'Define split rules for owner, staff, partners, and reserves. Settlement distributes shares automatically with statements.',
    headline: 'Automatic Revenue Splits at Settlement',
    subheadline:
      'Configure percentages by product or route. Remove manual reconciliation and pay everyone instantly.',
    benefits: [
      {
        icon: '🤝',
        title: 'Configurable Rules',
        description:
          'Set splits per service, route, or ticket type and reuse across branches.',
      },
      {
        icon: '📄',
        title: 'Clear Statements',
        description:
          'Each settlement includes line items and shares for transparent payouts.',
      },
      {
        icon: '⚙️',
        title: 'Reserve Allocations',
        description:
          'Automatically route a percentage to maintenance, safety, or dues funds.',
      },
    ],
    howItWorks: [
      'Define split rules for products or routes',
      'Associate rules with tickets or sales',
      'Process payments normally',
      'At settlement, shares distribute on-chain',
      'Export statements for each participant',
    ],
    useCases: [
      {
        title: 'Owner/Technician Splits',
        description:
          'Share labor revenue between shop owner and technician.',
        example:
          '40/60 split applied to labor line items; statements generated automatically.',
      },
      {
        title: 'Transport Crew Pool',
        description:
          'Distribute micro-fare revenue to captain, crew pool, and harbor dues reserve.',
        example:
          'Owner 70%, captain 15%, crew pool 10%, dues 5% — exported monthly.',
      },
      {
        title: 'Band Tip Splits',
        description:
          'Split tips among band members at the end of the show.',
        example:
          'QR tip jar distributes evenly or by configured shares.',
      },
    ],
    faqs: [
      {
        question: 'Are split rules flexible?',
        answer:
          'Yes. Use fixed percentages or per-line-item overrides. Save templates per branch.',
      },
      {
        question: 'Can reserves be time-bound?',
        answer:
          'Set reserves by product or period and export allocation statements.',
      },
    ],
    relatedIndustries: [
      'small-ferry-operators',
      'matatu-operators',
      'micro-grid-operators',
      'street-musicians',
    ],
  },

  'offline-mode': {
    slug: 'offline-mode',
    name: 'Offline Mode',
    title: 'Offline Mode | Keep Selling Without Connectivity',
    metaDescription:
      'Capture payments, tickets, and approvals offline. Sync records and reconcile automatically when back online.',
    headline: 'Operate Anywhere — Even Without Signal',
    subheadline:
      'Record events offline with tamper-evident logs. Sync and reconcile seamlessly when connectivity returns.',
    benefits: [
      {
        icon: '📶',
        title: 'Continuity',
        description:
          'Sales and approvals continue during outages with local persistence.',
      },
      {
        icon: '🛡️',
        title: 'Tamper Evident',
        description:
          'Local records include hashes and timestamps to prevent manipulation.',
      },
      {
        icon: '🔄',
        title: 'Auto Sync',
        description:
          'Reconcile tickets, manifests, and deposits the moment you reconnect.',
      },
    ],
    howItWorks: [
      'Enable offline mode in settings',
      'Record sales and approvals normally',
      'Local ledger stores events with hashes',
      'On reconnect, sync and reconcile',
      'Export offline logs for audit if needed',
    ],
    useCases: [
      {
        title: 'Island Ferry Boarding',
        description:
          'Scan tickets and record cargo fees on routes with no coverage.',
        example:
          'Manifests finalize at departure; sync occurs at the next harbor.',
      },
      {
        title: 'Micro-Grid Token Sales',
        description:
          'Issue prepaid energy credits when the kiosk loses signal.',
        example:
          'Tokens activate on meters once reconnected; receipts sync automatically.',
      },
      {
        title: 'Internet Café Sessions',
        description:
          'Start and end sessions with local timers during network drops.',
        example:
          'Sessions and add-ons sync later and export for partners.',
      },
    ],
    faqs: [
      {
        question: 'How are conflicts handled?',
        answer:
          'Sync process merges events by timestamp and ticket ID; conflicts are flagged for review.',
      },
      {
        question: 'Is offline supported on mobile?',
        answer:
          'Yes. Mobile and kiosk clients both support offline capture and sync.',
      },
    ],
    relatedIndustries: [
      'small-ferry-operators',
      'micro-grid-operators',
      'internet-cafes',
      'water-kiosk-operators',
    ],
  },

  'inventory-tagging': {
    slug: 'inventory-tagging',
    name: 'Inventory Tagging',
    title: 'Inventory Tagging | Attribute Parts and Materials to Orders',
    metaDescription:
      'Tag parts, materials, and consumables to tickets. Track stock movements, prevent leakage, and export audit-ready references.',
    headline: 'Track Every Part to Its Ticket',
    subheadline:
      'SKU-level attribution and cost control with simple tags and receipt references.',
    benefits: [
      {
        icon: '🏷️',
        title: 'SKU-Level Control',
        description:
          'Attribute materials per ticket and export references on receipts.',
      },
      {
        icon: '📦',
        title: 'Stock Movement Logs',
        description:
          'See every addition and removal with user and time stamps.',
      },
      {
        icon: '💹',
        title: 'Margin Protection',
        description:
          'Prevent under-billing and leakage with itemized costs.',
      },
    ],
    howItWorks: [
      'Create or scan a ticket',
      'Add SKUs and quantity with notes',
      'Costs attribute to the ticket automatically',
      'Invoice combines labor and materials',
      'Export stock movement logs as CSV/JSON',
    ],
    useCases: [
      {
        title: 'Phone Screen Replacement',
        description:
          'Tag screen and adhesive SKUs to the repair ticket.',
        example:
          'Final invoice reconciles deposit + parts + labor for clear margin.',
      },
      {
        title: 'Pottery Materials',
        description:
          'Attribute clay and glaze to an order with kiln batch reference.',
        example:
          'Receipt shows materials for authenticity and care instructions.',
      },
      {
        title: 'Hardware Shop Orders',
        description:
          'Attach fasteners and paint SKUs to contractor tickets.',
        example:
          'Quote-to-order flow ensures accurate billing and stock control.',
      },
    ],
    faqs: [
      {
        question: 'Can we scan barcodes?',
        answer:
          'Yes. Use camera or handheld scanners to add SKUs to tickets.',
      },
      {
        question: 'Do exports include user activity?',
        answer:
          'Exports list actor, timestamp, SKU, quantity, and ticket reference.',
      },
    ],
    relatedIndustries: [
      'mobile-phone-repair',
      'artisan-potters',
      'hardware-shops',
      'retail',
    ],
  },

  'warranty-management': {
    slug: 'warranty-management',
    name: 'Warranty Management',
    title: 'Warranty Management | IMEI and Serial Tracking',
    metaDescription:
      'Store IMEI/serial and warranty terms per job. Approve replacements faster and reduce escalations with exportable histories.',
    headline: 'Fast, Clear Warranty Decisions',
    subheadline:
      'Serial-level histories and terms to resolve claims quickly and fairly.',
    benefits: [
      {
        icon: '📇',
        title: 'IMEI/Serial Histories',
        description:
          'Each job stores device IDs with past service notes.',
      },
      {
        icon: '✅',
        title: 'Clear Terms',
        description:
          'Define warranty windows and conditions per product category.',
      },
      {
        icon: '📤',
        title: 'Exportable Evidence',
        description:
          'Provide CSV/JSON histories to vendors or customers on request.',
      },
    ],
    howItWorks: [
      'Enable IMEI/serial capture',
      'Define warranty terms by category',
      'Attach histories to tickets',
      'Approve or deny claims with references',
      'Export histories for vendor approval',
    ],
    useCases: [
      {
        title: '90-Day Screen Replacement',
        description:
          'Check IMEI history and approve replacement under defined terms.',
        example:
          'Receipt references prior repairs and warranty window dates.',
      },
      {
        title: 'Battery Warranty',
        description:
          'Assess cycles and notes before approving a swap.',
        example:
          'Export history to supplier for reimbursement tagging.',
      },
    ],
    faqs: [
      {
        question: 'Can warranty terms vary?',
        answer:
          'Yes. Configure terms per product category and branch.',
      },
      {
        question: 'Do customers see histories?',
        answer:
          'You control visibility. Share excerpts or full exports as needed.',
      },
    ],
    relatedIndustries: [
      'mobile-phone-repair',
      'community-pharmacies',
      'hardware-shops',
    ],
  },

  'ticketing': {
    slug: 'ticketing',
    name: 'QR Ticketing',
    title: 'QR Ticketing | Faster Boarding and Fewer Counterfeits',
    metaDescription:
      'Sell and scan QR tickets by route or event. Build manifests, apply surcharges, allocate dues, and operate offline with transparent receipts.',
    headline: 'Board Faster with QR Tickets',
    subheadline:
      'Route and event ticketing with manifests, surcharges, and offline support.',
    benefits: [
      {
        icon: '🎫',
        title: 'Counterfeit Prevention',
        description:
          'Unique QR codes per ticket reduce fraud and speed up verification.',
      },
      {
        icon: '📋',
        title: 'Manifests & Headcount',
        description:
          'Auto-build manifests and lock headcount before departure.',
      },
      {
        icon: '⚖️',
        title: 'Surcharges & Dues',
        description:
          'Itemize per-kg cargo, harbor dues, or permit fees for transparency.',
      },
    ],
    howItWorks: [
      'Create route or event schedule',
      'Set fare tables and surcharges',
      'Sell QR tickets online or at kiosk',
      'Scan at boarding; lock manifest',
      'Export statements for authorities',
    ],
    useCases: [
      {
        title: 'Lake Ferry Routes',
        description:
          'Commuter tickets with cargo surcharges and harbor dues.',
        example:
          'Manifest exports monthly to port authority.',
      },
      {
        title: 'Night Safari Expeditions',
        description:
          'Timed expedition tickets with permit allocations.',
        example:
          'Check-in builds headcount and safety brief acknowledgments.',
      },
    ],
    faqs: [
      {
        question: 'Do tickets work offline?',
        answer:
          'Yes. Sell and scan offline; events sync and reconcile later.',
      },
      {
        question: 'Can we integrate weight scales?',
        answer:
          'Record weights manually or integrate with compatible peripherals.',
      },
    ],
    relatedIndustries: [
      'small-ferry-operators',
      'cryptid-tour-operators',
      'matatu-operators',
    ],
  },
};

export function getUseCaseData(slug: string): UseCaseData | null {
  return USE_CASE_DATA[slug] || null;
}

export function getAllUseCases(): UseCaseData[] {
  return Object.values(USE_CASE_DATA);
}
