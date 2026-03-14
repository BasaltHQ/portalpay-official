import { registerSection } from '../registry';
import type { SectionDefinition } from '../types';

const videoSection: SectionDefinition = {
  type: 'video',
  name: 'Video',
  description: 'Embedded video from YouTube, Vimeo, or direct URL',
  icon: 'Play',
  settings: [
    { key: 'url', type: 'url', label: 'Video URL', info: 'YouTube, Vimeo, or direct video URL' },
    { key: 'heading', type: 'text', label: 'Heading' },
    { key: 'description', type: 'textarea', label: 'Description' },
    { key: 'autoplay', type: 'checkbox', label: 'Autoplay (muted)', default: false },
    { key: 'loop', type: 'checkbox', label: 'Loop', default: false },
    { key: 'posterImage', type: 'image', label: 'Cover Image', info: 'Shown before video plays' },
    { key: 'aspectRatio', type: 'select', label: 'Aspect Ratio', default: '16:9', options: [
      { label: '16:9', value: '16:9' },
      { label: '4:3', value: '4:3' },
      { label: '1:1', value: '1:1' },
      { label: '9:16 (Vertical)', value: '9:16' },
    ]},
    { key: 'maxWidth', type: 'select', label: 'Max Width', default: 'large', options: [
      { label: 'Medium (800px)', value: 'medium' },
      { label: 'Large (1000px)', value: 'large' },
      { label: 'Full Width', value: 'full' },
    ]},
  ],
};

registerSection(videoSection);
export default videoSection;
