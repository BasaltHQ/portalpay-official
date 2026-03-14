import { registerSection } from '../registry';
import type { SectionDefinition } from '../types';

const heroSection: SectionDefinition = {
  type: 'hero',
  name: 'Hero Banner',
  description: 'Full-width banner with heading, subtext, and call-to-action button',
  icon: 'ImageIcon',
  settings: [
    { key: 'heading', type: 'text', label: 'Heading', default: 'Welcome to our store' },
    { key: 'subheading', type: 'textarea', label: 'Subheading', default: 'Discover amazing products at great prices' },
    { key: 'backgroundImage', type: 'image', label: 'Background Image' },
    { key: 'overlayOpacity', type: 'range', label: 'Overlay Opacity', default: 40, min: 0, max: 100, step: 5 },
    { key: 'height', type: 'select', label: 'Height', default: 'large', options: [
      { label: 'Small (300px)', value: 'small' },
      { label: 'Medium (450px)', value: 'medium' },
      { label: 'Large (600px)', value: 'large' },
      { label: 'Full Screen', value: 'fullscreen' },
    ]},
    { key: 'textAlignment', type: 'select', label: 'Text Alignment', default: 'center', options: [
      { label: 'Left', value: 'left' },
      { label: 'Center', value: 'center' },
      { label: 'Right', value: 'right' },
    ]},
    { key: 'ctaText', type: 'text', label: 'Button Text', default: 'Shop Now' },
    { key: 'ctaLink', type: 'url', label: 'Button Link', default: '#products' },
    { key: 'showLogo', type: 'checkbox', label: 'Show Store Logo', default: true },
    { key: 'showRating', type: 'checkbox', label: 'Show Store Rating', default: true },
    { key: 'showDescription', type: 'checkbox', label: 'Show Description', default: true },
  ],
  maxPerPage: 1,
};

registerSection(heroSection);
export default heroSection;
