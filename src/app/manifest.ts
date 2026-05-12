import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '당신의 다이어트를 함께하는 WE GO BE thin',
    short_name: 'WEGOBE',
    description:
      '여러분의 다이어트를 주변인과 공유하여 다이어트를 성공시켜 보세요!',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#F8F4FF',
    theme_color: '#000000',
    icons: [
      {
        src: '/icons/WEGOBE-logo-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/WEGOBE-logo-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/icons/WEGOBE-logo-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
