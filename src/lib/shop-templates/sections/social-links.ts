import { registerSection } from '../registry';
import type { SectionDefinition } from '../types';

const socialLinksSection: SectionDefinition = {
  type: 'social-links',
  name: 'Social Links',
  description: 'Social media links and icons',
  icon: 'Share2',
  settings: [
    { key: 'heading', type: 'text', label: 'Heading', default: 'Follow Us' },
    { key: 'style', type: 'select', label: 'Style', default: 'icons', options: [
      { label: 'Icons Only', value: 'icons' },
      { label: 'Buttons with Labels', value: 'buttons' },
    ]},
    { key: 'alignment', type: 'select', label: 'Alignment', default: 'center', options: [
      { label: 'Left', value: 'left' },
      { label: 'Center', value: 'center' },
      { label: 'Right', value: 'right' },
    ]},
    { key: 'size', type: 'select', label: 'Icon Size', default: 'medium', options: [
      { label: 'Small', value: 'small' },
      { label: 'Medium', value: 'medium' },
      { label: 'Large', value: 'large' },
    ]},
  ],
  blocks: [{
    type: 'platform',
    name: 'Social Platform',
    settings: [
      { key: 'platform', type: 'select', label: 'Platform', default: 'instagram', options: [
        { label: 'Instagram', value: 'instagram' },
        { label: 'Twitter / X', value: 'twitter' },
        { label: 'Facebook', value: 'facebook' },
        { label: 'TikTok', value: 'tiktok' },
        { label: 'YouTube', value: 'youtube' },
        { label: 'LinkedIn', value: 'linkedin' },
        { label: 'Pinterest', value: 'pinterest' },
        { label: 'Discord', value: 'discord' },
        { label: 'Telegram', value: 'telegram' },
        { label: 'Website', value: 'website' },
      ]},
      { key: 'url', type: 'url', label: 'URL' },
    ],
    limit: 10,
  }],
};

registerSection(socialLinksSection);
export default socialLinksSection;
