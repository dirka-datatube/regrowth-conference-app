import type { Ionicons } from '@expo/vector-icons';

/**
 * Templates & Resources (217:1521).
 *
 * INTERIM CONTENT — there is no resources table yet. The list below is a
 * plausible starting library, typed the way a table would be, so the screen
 * does not change when one lands: swap useResources() for a query. None of the
 * files exist yet, so no item has a `url` and every card reads "Available
 * soon"; add a URL (and its size) as REGROWTH uploads each file.
 */

export const RESOURCE_CATEGORIES = ['Templates', 'Guides', 'Worksheets', 'Handouts'] as const;
export type ResourceCategory = (typeof RESOURCE_CATEGORIES)[number];

export type Resource = {
  id: string;
  title: string;
  /** One line under the title. */
  description: string;
  category: ResourceCategory;
  /** File type or medium: "PDF", "PPTX", "Video"… */
  format: string;
  /** e.g. "2.4 MB" — known once the file exists. */
  size?: string;
  /** Where it opens. Without one the card shows "Available soon". */
  url?: string;
  /** "download" for files, "open" for pages and videos. */
  action: 'download' | 'open';
};

export const RESOURCE_ICONS: Record<ResourceCategory, keyof typeof Ionicons.glyphMap> = {
  Templates: 'copy-outline',
  Guides: 'book-outline',
  Worksheets: 'create-outline',
  Handouts: 'document-text-outline',
};

const INTERIM_RESOURCES: Resource[] = [
  {
    id: 'navigate-2027-leadership',
    title: 'Leadership Resources — Navigate 2027',
    description: 'The keynote handout: frameworks and takeaways from the main stage.',
    category: 'Handouts',
    format: 'PDF',
    action: 'download',
  },
  {
    id: 'listing-presentation',
    title: 'Listing Presentation Template',
    description: 'A ready-to-brand deck for winning your next appraisal.',
    category: 'Templates',
    format: 'PPTX',
    action: 'download',
  },
  {
    id: 'business-plan-90-day',
    title: '90-Day Business Plan',
    description: 'Set your targets, priorities and weekly rhythm for the quarter.',
    category: 'Templates',
    format: 'DOCX',
    action: 'download',
  },
  {
    id: 'vendor-update-emails',
    title: 'Vendor Update Email Templates',
    description: 'Campaign updates that keep sellers informed and confident.',
    category: 'Templates',
    format: 'DOCX',
    action: 'download',
  },
  {
    id: 'prospecting-playbook',
    title: 'Prospecting Playbook',
    description: 'Daily habits and scripts for building a consistent pipeline.',
    category: 'Guides',
    format: 'PDF',
    action: 'download',
  },
  {
    id: 'high-performance-team',
    title: 'Building a High-Performance Team',
    description: 'Recruit, onboard and retain the people who lift your business.',
    category: 'Guides',
    format: 'PDF',
    action: 'download',
  },
  {
    id: 'goal-setting-2027',
    title: 'Goal Setting Worksheet 2027',
    description: 'Turn your annual goals into monthly and weekly numbers.',
    category: 'Worksheets',
    format: 'PDF',
    action: 'download',
  },
  {
    id: 'weekly-activity-tracker',
    title: 'Weekly Activity Tracker',
    description: 'Track calls, appraisals and listings against your plan.',
    category: 'Worksheets',
    format: 'XLSX',
    action: 'download',
  },
  {
    id: 'study-tour-2027-workbook',
    title: 'Study Tour 2027 — Delegate Workbook',
    description: 'Questions to ask and room for notes at every agency visit.',
    category: 'Handouts',
    format: 'PDF',
    action: 'download',
  },
];

/** The resource library. Interim: a typed list until the table exists. */
export function useResources(): { data: Resource[] } {
  return { data: INTERIM_RESOURCES };
}
