import { registerSection } from '../registry';
import type { SectionDefinition } from '../types';

const announcementBarSection: SectionDefinition = {
  type: 'announcement-bar',
  name: 'Announcement Bar',
  description: 'Top-of-page banner for promotions and alerts',
  icon: 'Megaphone',
  settings: [
    { key: 'backgroundColor', type: 'color', label: 'Background Color', default: '' },
    { key: 'textColor', type: 'color', label: 'Text Color', default: '#ffffff' },
    { key: 'dismissible', type: 'checkbox', label: 'Dismissible', default: true },
    { key: 'autoRotate', type: 'checkbox', label: 'Auto-rotate Announcements', default: true },
    { key: 'rotateSpeed', type: 'range', label: 'Rotate Speed (seconds)', default: 5, min: 2, max: 15, step: 1 },
  ],
  blocks: [{
    type: 'announcement',
    name: 'Announcement',
    settings: [
      { key: 'text', type: 'text', label: 'Text', default: 'Free shipping on orders over $50!' },
      { key: 'link', type: 'url', label: 'Link' },
      { key: 'icon', type: 'text', label: 'Emoji Icon', default: '🎉' },
    ],
    limit: 5,
  }],
  maxPerPage: 1,
};

registerSection(announcementBarSection);
export default announcementBarSection;
