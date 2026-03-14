import { registerSection } from '../registry';
import type { SectionDefinition } from '../types';

const gallerySection: SectionDefinition = {
  type: 'gallery',
  name: 'Image Gallery',
  description: 'Grid of images with optional lightbox',
  icon: 'Images',
  settings: [
    { key: 'heading', type: 'text', label: 'Heading', default: 'Gallery' },
    { key: 'columns', type: 'range', label: 'Columns', default: 3, min: 2, max: 5, step: 1 },
    { key: 'aspectRatio', type: 'select', label: 'Image Ratio', default: '1:1', options: [
      { label: 'Square (1:1)', value: '1:1' },
      { label: 'Portrait (3:4)', value: '3:4' },
      { label: 'Landscape (4:3)', value: '4:3' },
      { label: 'Natural', value: 'natural' },
    ]},
    { key: 'enableLightbox', type: 'checkbox', label: 'Enable Lightbox', default: true },
    { key: 'gap', type: 'range', label: 'Gap (px)', default: 8, min: 0, max: 24, step: 4 },
  ],
  blocks: [{
    type: 'image',
    name: 'Image',
    settings: [
      { key: 'image', type: 'image', label: 'Image' },
      { key: 'caption', type: 'text', label: 'Caption' },
      { key: 'link', type: 'url', label: 'Link' },
    ],
    limit: 24,
  }],
};

registerSection(gallerySection);
export default gallerySection;
