export type PageKey =
  | 'home'
  | 'analysis-loading'
  | 'site-analysis'
  | 'projects'
  | 'site-result'
  | 'project-detail';

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
  designNote?: string;
}

export interface SiteAnalysisData {
  [key: string]: unknown;
}
