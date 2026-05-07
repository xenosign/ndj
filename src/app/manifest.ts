import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'NDJ App',
    short_name: 'NDJ',
    description: 'NDJ Progressive Web Application',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#ffffff',
    theme_color: '#000000',
    icons: [
      {
        src: '/icons/ndj-logo-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/ndj-logo-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/icons/ndj-logo-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
