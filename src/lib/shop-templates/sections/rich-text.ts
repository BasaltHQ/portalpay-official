import { registerSection } from '../registry';
import type { SectionDefinition } from '../types';

const richTextSection: SectionDefinition = {
  type: 'rich-text',
  name: 'Rich Text',
  description: 'Freeform text content with formatting',
  icon: 'Type',
  settings: [
    { key: 'content', type: 'richtext', label: 'Content', default: '<p>Share your story, mission, or any important information with your customers.</p>' },
    { key: 'alignment', type: 'select', label: 'Text Alignment', default: 'left', options: [
      { label: 'Left', value: 'left' },
      { label: 'Center', value: 'center' },
      { label: 'Right', value: 'right' },
    ]},
    { key: 'maxWidth', type: 'select', label: 'Content Width', default: 'medium', options: [
      { label: 'Narrow (640px)', value: 'narrow' },
      { label: 'Medium (800px)', value: 'medium' },
      { label: 'Wide (1000px)', value: 'wide' },
      { label: 'Full Width', value: 'full' },
    ]},
    { key: 'backgroundColor', type: 'color', label: 'Background Color', default: 'transparent' },
    { key: 'paddingY', type: 'range', label: 'Vertical Padding', default: 40, min: 0, max: 120, step: 8 },
  ],
};

registerSection(richTextSection);
export default richTextSection;
