import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Mindmapmaker Workspace',
    short_name: 'Mindmapmaker',
    description:
      'Mindmapmaker Workspace for collaborative concept mapping, simulation, and cybernetic ideation.',
    start_url: '/mindmapmaker',
    scope: '/mindmapmaker',
    display: 'standalone',
    background_color: '#0a0f1f',
    theme_color: '#0a0f1f',
    icons: [
      {
        src: '/fadhil-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable',
      },
      {
        src: '/fadhil.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
    ],
  };
}
