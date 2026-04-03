import type { FadhilWebSeoAudit, FadhilWebSeoConfig, FadhilWebSeoResult } from './types/seo';

function normalizeSiteUrl(siteUrl: string) {
  return siteUrl.endsWith('/') ? siteUrl.slice(0, -1) : siteUrl;
}

function normalizePath(path?: string) {
  if (!path || path === '/') {
    return '';
  }

  return path.startsWith('/') ? path : `/${path}`;
}

export function createSeoMetadata(config: FadhilWebSeoConfig): FadhilWebSeoResult {
  const siteUrl = normalizeSiteUrl(config.siteUrl);
  const pagePath = normalizePath(config.pagePath);
  const canonicalUrl = `${siteUrl}${pagePath}`;
  const locale = config.locale ?? 'en_US';
  const index = config.index ?? true;
  const follow = config.follow ?? true;

  const robots = `${index ? 'index' : 'noindex'},${follow ? 'follow' : 'nofollow'},max-image-preview:large,max-snippet:-1,max-video-preview:-1`;

  return {
    canonicalUrl,
    metadataBase: new URL(siteUrl),
    alternates: {
      canonical: canonicalUrl,
    },
    robots,
    keywords: config.keywords,
    authors: config.author ? [{ name: config.author }] : undefined,
    openGraph: {
      type: config.ogType ?? 'website',
      url: canonicalUrl,
      title: config.title,
      description: config.description,
      siteName: config.siteName,
      locale,
      images: config.image ? [config.image] : undefined,
      publishedTime: config.publishedTime,
      modifiedTime: config.modifiedTime,
    },
    twitter: {
      card: config.image ? 'summary_large_image' : 'summary',
      title: config.title,
      description: config.description,
      images: config.image ? [config.image.url] : undefined,
    },
  };
}

export function auditSeoMetadata(config: FadhilWebSeoConfig): FadhilWebSeoAudit {
  const issues: FadhilWebSeoAudit['issues'] = [];

  if (!config.title || config.title.trim().length < 30) {
    issues.push({ key: 'title-length', severity: 'warning', message: 'Title should be at least 30 characters for stronger search snippets.' });
  }

  if (config.title.length > 60) {
    issues.push({ key: 'title-overflow', severity: 'warning', message: 'Title should stay under 60 characters to reduce truncation risk.' });
  }

  if (!config.description || config.description.trim().length < 70) {
    issues.push({ key: 'description-length', severity: 'warning', message: 'Description should be at least 70 characters for richer result previews.' });
  }

  if (config.description.length > 160) {
    issues.push({ key: 'description-overflow', severity: 'warning', message: 'Description should stay under 160 characters to reduce truncation risk.' });
  }

  if (!config.keywords || config.keywords.length < 3) {
    issues.push({ key: 'keywords', severity: 'warning', message: 'Provide at least three focused keywords for internal SEO governance.' });
  }

  if (!config.image?.url) {
    issues.push({ key: 'og-image', severity: 'error', message: 'Open Graph image is required for modern social + discover feed previews.' });
  }

  const penalties = issues.reduce((acc, issue) => acc + (issue.severity === 'error' ? 25 : 8), 0);
  const score = Math.max(0, 100 - penalties);

  return {
    score,
    issues,
  };
}
