import { registerSection } from '../registry';
import type { SectionDefinition } from '../types';

const multicolumnSection: SectionDefinition = {
  type: 'multicolumn',
  name: 'Multi-column',
  description: '2-4 column content blocks with icons, headings, and text',
  icon: 'Columns3',
  settings: [
    { key: 'heading', type: 'text', label: 'Section Heading' },
    { key: 'columnCount', type: 'range', label: 'Columns', default: 3, min: 2, max: 4, step: 1 },
    { key: 'alignment', type: 'select', label: 'Content Alignment', default: 'center', options: [
      { label: 'Left', value: 'left' },
      { label: 'Center', value: 'center' },
    ]},
    { key: 'backgroundColor', type: 'color', label: 'Background Color', default: 'transparent' },
  ],
  blocks: [{
    type: 'column',
    name: 'Column',
    settings: [
      { key: 'icon', type: 'text', label: 'Emoji / Icon', default: '⚡' },
      { key: 'image', type: 'image', label: 'Image (optional)' },
      { key: 'heading', type: 'text', label: 'Heading' },
      { key: 'text', type: 'textarea', label: 'Text' },
      { key: 'linkText', type: 'text', label: 'Link Text' },
      { key: 'linkUrl', type: 'url', label: 'Link URL' },
    ],
    limit: 4,
  }],
};

registerSection(multicolumnSection);
export default multicolumnSection;
