import { registerSection } from '../registry';
import type { SectionDefinition } from '../types';

const collectionListSection: SectionDefinition = {
  type: 'collection-list',
  name: 'Collection List',
  description: 'Grid of collection cards linking to collection pages',
  icon: 'FolderOpen',
  settings: [
    { key: 'heading', type: 'text', label: 'Heading', default: 'Shop by Category' },
    { key: 'columns', type: 'range', label: 'Columns', default: 3, min: 2, max: 5, step: 1 },
    { key: 'imageRatio', type: 'select', label: 'Image Ratio', default: '1:1', options: [
      { label: 'Square (1:1)', value: '1:1' },
      { label: 'Portrait (3:4)', value: '3:4' },
      { label: 'Landscape (16:9)', value: '16:9' },
    ]},
    { key: 'showTitle', type: 'checkbox', label: 'Show Title', default: true },
    { key: 'showProductCount', type: 'checkbox', label: 'Show Product Count', default: true },
    { key: 'titlePosition', type: 'select', label: 'Title Position', default: 'below', options: [
      { label: 'Below Image', value: 'below' },
      { label: 'Overlay', value: 'overlay' },
    ]},
  ],
};

registerSection(collectionListSection);
export default collectionListSection;
