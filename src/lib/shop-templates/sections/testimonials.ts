import { registerSection } from '../registry';
import type { SectionDefinition } from '../types';

const testimonialsSection: SectionDefinition = {
  type: 'testimonials',
  name: 'Testimonials',
  description: 'Customer reviews and social proof',
  icon: 'MessageSquareQuote',
  settings: [
    { key: 'heading', type: 'text', label: 'Heading', default: 'What Our Customers Say' },
    { key: 'source', type: 'select', label: 'Source', default: 'auto', options: [
      { label: 'Auto (from reviews)', value: 'auto' },
      { label: 'Manual', value: 'manual' },
      { label: 'Both', value: 'both' },
    ]},
    { key: 'style', type: 'select', label: 'Style', default: 'cards', options: [
      { label: 'Cards', value: 'cards' },
      { label: 'Minimal', value: 'minimal' },
      { label: 'Carousel', value: 'carousel' },
    ]},
    { key: 'maxReviews', type: 'range', label: 'Max Reviews', default: 6, min: 3, max: 12, step: 1 },
    { key: 'showRating', type: 'checkbox', label: 'Show Star Rating', default: true },
    { key: 'showDate', type: 'checkbox', label: 'Show Date', default: true },
  ],
  blocks: [{
    type: 'testimonial',
    name: 'Testimonial',
    settings: [
      { key: 'quote', type: 'textarea', label: 'Quote' },
      { key: 'author', type: 'text', label: 'Author Name' },
      { key: 'role', type: 'text', label: 'Role / Title' },
      { key: 'avatar', type: 'image', label: 'Avatar' },
      { key: 'rating', type: 'range', label: 'Rating', default: 5, min: 1, max: 5, step: 1 },
    ],
    limit: 12,
  }],
};

registerSection(testimonialsSection);
export default testimonialsSection;
