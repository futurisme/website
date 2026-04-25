import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Mindmapmaker Workspace',
    short_name: 'Mindmapmaker',
    description: 'Mindmapmaker visual workspace and simulation studio.',
    start_url: '/mindmapmaker',
    scope: '/mindmapmaker',
    display: 'standalone',
    background_color: '#0a0f1f',
    theme_color: '#0a0f1f',
    icons: [
      {
        src: '/mindmapmaker/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  };
}
