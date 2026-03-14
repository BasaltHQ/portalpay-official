import { registerSection } from '../registry';
import type { SectionDefinition } from '../types';

const collapsibleContentSection: SectionDefinition = {
  type: 'collapsible-content',
  name: 'Collapsible Content',
  description: 'FAQ-style accordion with expandable sections',
  icon: 'ChevronDown',
  settings: [
    { key: 'heading', type: 'text', label: 'Heading', default: 'Frequently Asked Questions' },
    { key: 'openFirst', type: 'checkbox', label: 'Open First Item by Default', default: true },
    { key: 'allowMultiple', type: 'checkbox', label: 'Allow Multiple Open', default: false },
    { key: 'style', type: 'select', label: 'Style', default: 'bordered', options: [
      { label: 'Bordered', value: 'bordered' },
      { label: 'Minimal', value: 'minimal' },
      { label: 'Cards', value: 'cards' },
    ]},
  ],
  blocks: [{
    type: 'item',
    name: 'FAQ Item',
    settings: [
      { key: 'question', type: 'text', label: 'Question' },
      { key: 'answer', type: 'richtext', label: 'Answer' },
    ],
    limit: 20,
  }],
};

registerSection(collapsibleContentSection);
export default collapsibleContentSection;
