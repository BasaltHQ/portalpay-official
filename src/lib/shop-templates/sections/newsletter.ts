import { registerSection } from '../registry';
import type { SectionDefinition } from '../types';

const newsletterSection: SectionDefinition = {
  type: 'newsletter',
  name: 'Newsletter Signup',
  description: 'Email subscription form with customizable messaging',
  icon: 'Mail',
  settings: [
    { key: 'heading', type: 'text', label: 'Heading', default: 'Stay in the Loop' },
    { key: 'subtext', type: 'textarea', label: 'Description', default: 'Subscribe to get special offers, free giveaways, and exclusive deals.' },
    { key: 'buttonText', type: 'text', label: 'Button Text', default: 'Subscribe' },
    { key: 'successMessage', type: 'text', label: 'Success Message', default: 'Thank you for subscribing!' },
    { key: 'backgroundColor', type: 'color', label: 'Background Color', default: '' },
    { key: 'style', type: 'select', label: 'Style', default: 'inline', options: [
      { label: 'Inline', value: 'inline' },
      { label: 'Stacked', value: 'stacked' },
      { label: 'Card', value: 'card' },
    ]},
  ],
  maxPerPage: 1,
};

registerSection(newsletterSection);
export default newsletterSection;
