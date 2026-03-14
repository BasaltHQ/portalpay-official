import { registerSection } from '../registry';
import type { SectionDefinition } from '../types';

const slideshowSection: SectionDefinition = {
  type: 'slideshow',
  name: 'Slideshow',
  description: 'Full-width rotating image carousel with text overlays',
  icon: 'GalleryHorizontal',
  settings: [
    { key: 'autoplay', type: 'checkbox', label: 'Auto-play', default: true },
    { key: 'speed', type: 'range', label: 'Slide Duration (seconds)', default: 5, min: 2, max: 15, step: 1 },
    { key: 'showArrows', type: 'checkbox', label: 'Show Arrows', default: true },
    { key: 'showDots', type: 'checkbox', label: 'Show Navigation Dots', default: true },
    { key: 'height', type: 'select', label: 'Height', default: 'large', options: [
      { label: 'Small (300px)', value: 'small' },
      { label: 'Medium (450px)', value: 'medium' },
      { label: 'Large (600px)', value: 'large' },
      { label: 'Full Screen', value: 'fullscreen' },
    ]},
    { key: 'transition', type: 'select', label: 'Transition', default: 'fade', options: [
      { label: 'Fade', value: 'fade' },
      { label: 'Slide', value: 'slide' },
    ]},
  ],
  blocks: [{
    type: 'slide',
    name: 'Slide',
    settings: [
      { key: 'image', type: 'image', label: 'Image' },
      { key: 'heading', type: 'text', label: 'Heading' },
      { key: 'subheading', type: 'text', label: 'Subheading' },
      { key: 'ctaText', type: 'text', label: 'Button Text' },
      { key: 'ctaLink', type: 'url', label: 'Button Link' },
      { key: 'textPosition', type: 'select', label: 'Text Position', default: 'center', options: [
        { label: 'Left', value: 'left' },
        { label: 'Center', value: 'center' },
        { label: 'Right', value: 'right' },
      ]},
    ],
    limit: 8,
  }],
  maxPerPage: 1,
};

registerSection(slideshowSection);
export default slideshowSection;
