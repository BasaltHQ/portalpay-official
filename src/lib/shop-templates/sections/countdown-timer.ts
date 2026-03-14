import { registerSection } from '../registry';
import type { SectionDefinition } from '../types';

const countdownTimerSection: SectionDefinition = {
  type: 'countdown-timer',
  name: 'Countdown Timer',
  description: 'Countdown timer for sales, launches, or events',
  icon: 'Clock',
  settings: [
    { key: 'heading', type: 'text', label: 'Heading', default: 'Sale Ends In' },
    { key: 'targetDate', type: 'text', label: 'Target Date & Time', default: '', info: 'Format: YYYY-MM-DDTHH:MM (e.g. 2026-12-31T23:59)' },
    { key: 'expiredMessage', type: 'text', label: 'Expired Message', default: 'This offer has ended!' },
    { key: 'ctaText', type: 'text', label: 'CTA Button Text' },
    { key: 'ctaLink', type: 'url', label: 'CTA Button Link' },
    { key: 'style', type: 'select', label: 'Style', default: 'boxes', options: [
      { label: 'Boxes', value: 'boxes' },
      { label: 'Inline', value: 'inline' },
      { label: 'Minimal', value: 'minimal' },
    ]},
    { key: 'backgroundColor', type: 'color', label: 'Background Color', default: '' },
  ],
  maxPerPage: 2,
};

registerSection(countdownTimerSection);
export default countdownTimerSection;
