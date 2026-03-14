import { registerSection } from '../registry';
import type { SectionDefinition } from '../types';

const customHtmlSection: SectionDefinition = {
  type: 'custom-html',
  name: 'Custom HTML',
  description: 'Raw HTML and CSS content block for advanced customization',
  icon: 'Code',
  settings: [
    { key: 'html', type: 'textarea', label: 'HTML Content', default: '<div style="text-align: center; padding: 2rem;"><p>Custom content goes here</p></div>' },
    { key: 'css', type: 'textarea', label: 'Custom CSS', default: '', info: 'Scoped CSS styles for this section' },
    { key: 'maxWidth', type: 'select', label: 'Max Width', default: 'full', options: [
      { label: 'Narrow (640px)', value: 'narrow' },
      { label: 'Medium (800px)', value: 'medium' },
      { label: 'Wide (1000px)', value: 'wide' },
      { label: 'Full Width', value: 'full' },
    ]},
  ],
};

registerSection(customHtmlSection);
export default customHtmlSection;
