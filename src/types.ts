export type PageKey =
  | 'home'
  | 'site-analysis'
  | 'reference'
  | 'design'
  | 'review'
  | 'projects'
  | 'site-result';

export interface FeatureCardData {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  desc: string;
  page: PageKey;
}

export interface Project {
  id: string;
  name: string;
  address: string;
  date: string;
  thumbnail?: string;
  analysisData?: SiteAnalysisData;
}

export interface SiteAnalysisData {
  [key: string]: unknown;
}
