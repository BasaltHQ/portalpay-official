import { registerSection } from '../registry';
import type { SectionDefinition } from '../types';

const footerSection: SectionDefinition = {
  type: 'footer',
  name: 'Footer',
  description: 'Configurable store footer with links, social, and copyright',
  icon: 'PanelBottom',
  settings: [
    { key: 'showSocialLinks', type: 'checkbox', label: 'Show Social Links', default: true },
    { key: 'showPaymentIcons', type: 'checkbox', label: 'Show Payment Icons', default: true },
    { key: 'copyrightText', type: 'text', label: 'Copyright Text', default: '© {year} {shopName}. All rights reserved.' },
    { key: 'showPoweredBy', type: 'checkbox', label: 'Show Powered By', default: true },
    { key: 'backgroundColor', type: 'color', label: 'Background Color', default: '' },
    { key: 'columns', type: 'range', label: 'Link Columns', default: 3, min: 1, max: 4, step: 1 },
  ],
  blocks: [{
    type: 'link-column',
    name: 'Link Column',
    settings: [
      { key: 'heading', type: 'text', label: 'Column Heading' },
      { key: 'links', type: 'textarea', label: 'Links (one per line: Label|URL)', info: 'Format: Label|URL, one per line' },
    ],
    limit: 4,
  }],
  maxPerPage: 1,
};

registerSection(footerSection);
export default footerSection;
