import { registerSection } from '../registry';
import type { SectionDefinition } from '../types';

const imageWithTextSection: SectionDefinition = {
  type: 'image-with-text',
  name: 'Image with Text',
  description: 'Side-by-side image and text content block',
  icon: 'Columns',
  settings: [
    { key: 'image', type: 'image', label: 'Image' },
    { key: 'heading', type: 'text', label: 'Heading', default: 'About Our Brand' },
    { key: 'text', type: 'richtext', label: 'Text', default: '<p>Tell your story and connect with your customers.</p>' },
    { key: 'imagePosition', type: 'select', label: 'Image Position', default: 'left', options: [
      { label: 'Left', value: 'left' },
      { label: 'Right', value: 'right' },
    ]},
    { key: 'imageWidth', type: 'select', label: 'Image Width', default: '50', options: [
      { label: '40%', value: '40' },
      { label: '50%', value: '50' },
      { label: '60%', value: '60' },
    ]},
    { key: 'ctaText', type: 'text', label: 'Button Text' },
    { key: 'ctaLink', type: 'url', label: 'Button Link' },
    { key: 'backgroundColor', type: 'color', label: 'Background Color', default: 'transparent' },
  ],
};

registerSection(imageWithTextSection);
export default imageWithTextSection;
