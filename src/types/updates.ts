export type UpdateTarget = 'ALL' | 'SPECIFIC_PARTNER';
export type UpdateStatus = 'DRAFT' | 'PUBLISHED';
export type UpdateCategory = 'FEATURE' | 'IMPROVEMENT' | 'BUGFIX' | 'ANNOUNCEMENT';

export interface SystemUpdate {
  id: string;
  title: string;
  content: string; // Markdown/HTML content
  category: UpdateCategory;
  target: UpdateTarget;
  partnerId?: string; // e.g. shopSlug or wallet address if targeted
  status: UpdateStatus;
  createdAt: number; // epoch ms
  updatedAt: number; // epoch ms
}
