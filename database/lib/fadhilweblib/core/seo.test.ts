import assert from 'node:assert/strict';
import test from 'node:test';
import { auditSeoMetadata, createSeoMetadata } from './seo';

test('createSeoMetadata builds canonical, robots, og, and twitter blocks', () => {
  const metadata = createSeoMetadata({
    siteName: 'Template Databases',
    siteUrl: 'https://templatedatabases.vercel.app/',
    pagePath: '/portfolio',
    title: 'Fadhil Portfolio – Template Databases',
    description: 'Portfolio page built with fadhilweblib including performance-safe syntax + technical SEO metadata.',
    keywords: ['portfolio', 'fadhilweblib', 'templates'],
    author: 'Fadhil Akbar',
    image: {
      url: 'https://templatedatabases.vercel.app/public/images/WebWorlds.jpg',
      width: 1200,
      height: 630,
      alt: 'Portfolio hero preview',
    },
  });

  assert.equal(metadata.canonicalUrl, 'https://templatedatabases.vercel.app/portfolio');
  assert.match(metadata.robots, /index,follow/);
  assert.equal(metadata.alternates.canonical, 'https://templatedatabases.vercel.app/portfolio');
  assert.equal(metadata.openGraph.url, 'https://templatedatabases.vercel.app/portfolio');
  assert.equal(metadata.twitter.card, 'summary_large_image');
});

test('auditSeoMetadata reports actionable issues and computes score', () => {
  const audit = auditSeoMetadata({
    siteName: 'Template Databases',
    siteUrl: 'https://templatedatabases.vercel.app',
    title: 'Short title',
    description: 'Too short',
  });

  assert.ok(audit.score < 100);
  assert.ok(audit.issues.some((issue) => issue.key === 'og-image'));
  assert.ok(audit.issues.some((issue) => issue.key === 'keywords'));
});
