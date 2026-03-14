import { registerSection } from '../registry';
import type { SectionDefinition } from '../types';

const productGridSection: SectionDefinition = {
  type: 'product-grid',
  name: 'Product Grid',
  description: 'Main product catalog with filtering, sorting, and pagination',
  icon: 'LayoutGrid',
  settings: [
    { key: 'heading', type: 'text', label: 'Heading', default: 'All Products' },
    { key: 'columns', type: 'range', label: 'Columns', default: 3, min: 2, max: 5, step: 1 },
    { key: 'productsPerPage', type: 'select', label: 'Products Per Page', default: '12', options: [
      { label: '8', value: '8' }, { label: '12', value: '12' },
      { label: '24', value: '24' }, { label: '48', value: '48' },
    ]},
    { key: 'enableFilters', type: 'checkbox', label: 'Enable Category Filters', default: true },
    { key: 'enableSort', type: 'checkbox', label: 'Enable Sort Controls', default: true },
    { key: 'enableSearch', type: 'checkbox', label: 'Enable Search', default: true },
    { key: 'showPrice', type: 'checkbox', label: 'Show Price', default: true },
    { key: 'showRating', type: 'checkbox', label: 'Show Rating', default: true },
    { key: 'showAddToCart', type: 'checkbox', label: 'Show Add to Cart', default: true },
    { key: 'showDiscountBadge', type: 'checkbox', label: 'Show Discount Badges', default: true },
    { key: 'paginationType', type: 'select', label: 'Pagination', default: 'load-more', options: [
      { label: 'Load More Button', value: 'load-more' },
      { label: 'Infinite Scroll', value: 'infinite' },
      { label: 'Page Numbers', value: 'numbered' },
    ]},
    { key: 'viewMode', type: 'select', label: 'Default View', default: 'grid', options: [
      { label: 'Grid', value: 'grid' },
      { label: 'List', value: 'list' },
      { label: 'Category Groups', value: 'category' },
    ]},
    { key: 'cardSize', type: 'select', label: 'Card Size', default: 'medium', options: [
      { label: 'Small', value: 'small' },
      { label: 'Medium', value: 'medium' },
      { label: 'Large', value: 'large' },
    ]},
  ],
};

registerSection(productGridSection);
export default productGridSection;
