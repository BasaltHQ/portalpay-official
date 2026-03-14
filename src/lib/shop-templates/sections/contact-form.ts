import { registerSection } from '../registry';
import type { SectionDefinition } from '../types';

const contactFormSection: SectionDefinition = {
  type: 'contact-form',
  name: 'Contact Form',
  description: 'Contact or inquiry form for customer communication',
  icon: 'MessageCircle',
  settings: [
    { key: 'heading', type: 'text', label: 'Heading', default: 'Get in Touch' },
    { key: 'description', type: 'textarea', label: 'Description', default: 'Have a question? We\'d love to hear from you.' },
    { key: 'submitText', type: 'text', label: 'Submit Button Text', default: 'Send Message' },
    { key: 'successMessage', type: 'text', label: 'Success Message', default: 'Thank you! We\'ll get back to you shortly.' },
    { key: 'showPhone', type: 'checkbox', label: 'Show Phone Field', default: false },
    { key: 'showSubject', type: 'checkbox', label: 'Show Subject Field', default: true },
    { key: 'backgroundColor', type: 'color', label: 'Background Color', default: 'transparent' },
  ],
};

registerSection(contactFormSection);
export default contactFormSection;
