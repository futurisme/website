export interface FadhilWebSeoImage {
  url: string;
  width?: number;
  height?: number;
  alt?: string;
}

export interface FadhilWebSeoConfig {
  siteName: string;
  siteUrl: string;
  pagePath?: string;
  title: string;
  description: string;
  locale?: string;
  keywords?: string[];
  author?: string;
  index?: boolean;
  follow?: boolean;
  ogType?: 'website' | 'article' | 'profile';
  image?: FadhilWebSeoImage;
  publishedTime?: string;
  modifiedTime?: string;
}

export interface FadhilWebSeoResult {
  canonicalUrl: string;
  robots: string;
  alternates: { canonical: string };
  openGraph: Record<string, unknown>;
  twitter: Record<string, unknown>;
  metadataBase: URL;
  keywords?: string[];
  authors?: Array<{ name: string }>;
}

export interface FadhilWebSeoAuditIssue {
  key: string;
  severity: 'error' | 'warning';
  message: string;
}

export interface FadhilWebSeoAudit {
  score: number;
  issues: FadhilWebSeoAuditIssue[];
}
