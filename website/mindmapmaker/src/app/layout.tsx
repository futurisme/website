import type { Metadata } from 'next';
import './globals.css';
import '@/lib/fadhilweblib/styles/theme.css';
import { GlobalRuntime } from '@/components/global-runtime';

const siteUrl = 'https://fadhil.dev';
const siteName = 'Mindmapmaker Workspace';
const defaultTitle = 'Mindmapmaker Workspace | Cybernetic Concept Mapping';
const defaultDescription =
  'Build futuristic concept maps in Mindmapmaker Workspace with real-time collaboration, fast editing, and immersive cybernetic visuals.';
const canonicalPath = '/mindmapmaker';
const socialImage = `${siteUrl}/mindmapmaker/social-preview-whatsapp.jpg`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: defaultTitle,
    template: '%s | Mindmapmaker Workspace',
  },
  description: defaultDescription,
  alternates: {
    canonical: canonicalPath,
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  applicationName: siteName,
  icons: {
    icon: [{ url: '/fadhil-512x512.png', type: 'image/png', sizes: '512x512' }],
    shortcut: [{ url: '/fadhil-512x512.png', type: 'image/png' }],
    apple: [{ url: '/fadhil-512x512.png', sizes: '512x512' }],
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: `${siteUrl}${canonicalPath}`,
    siteName,
    title: defaultTitle,
    description: defaultDescription,
    images: [
      {
        url: socialImage,
        secureUrl: socialImage,
        width: 1200,
        height: 630,
        type: 'image/jpeg',
        alt: 'Mindmapmaker Workspace futuristic landing preview',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: defaultTitle,
    description: defaultDescription,
    images: [socialImage],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <style>{`
          .editor-shell-header {
            min-height: 40px;
            border-bottom: 1px solid rgba(34, 211, 238, 0.25);
            background: rgba(2, 6, 23, 0.9);
          }

          .editor-shell-loading {
            min-height: 100%;
            background: rgb(248 250 252);
          }
        `}</style>
      </head>
      <body>
        <GlobalRuntime />
        {children}
      </body>
    </html>
  );
}
