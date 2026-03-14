import { registerSection } from '../registry';
import type { SectionDefinition } from '../types';

const featuredCollectionSection: SectionDefinition = {
  type: 'featured-collection',
  name: 'Featured Collection',
  description: 'Showcase products from a specific collection',
  icon: 'Star',
  settings: [
    { key: 'heading', type: 'text', label: 'Heading', default: 'Featured Products' },
    { key: 'collectionHandle', type: 'collection', label: 'Collection', info: 'Select a collection to feature' },
    { key: 'productsPerRow', type: 'range', label: 'Products Per Row', default: 4, min: 2, max: 6, step: 1 },
    { key: 'maxProducts', type: 'range', label: 'Max Products', default: 8, min: 2, max: 24, step: 2 },
    { key: 'showPrice', type: 'checkbox', label: 'Show Price', default: true },
    { key: 'showRating', type: 'checkbox', label: 'Show Rating', default: true },
    { key: 'showAddToCart', type: 'checkbox', label: 'Show Add to Cart', default: true },
    { key: 'viewAllLink', type: 'checkbox', label: 'Show "View All" Link', default: true },
  ],
};

registerSection(featuredCollectionSection);
export default featuredCollectionSection;
