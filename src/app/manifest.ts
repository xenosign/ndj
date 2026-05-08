import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '네 다이어트를 적에게 알려라!',
    short_name: 'NDJ',
    description: '여러분의 다이어트를 주변인과 공유하여 다이어트를 성공!!',
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
