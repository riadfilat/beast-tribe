import type { MetadataRoute } from 'next';

// Lets admins add the dashboard to their phone's home screen and open it like an app.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Beast Tribe Admin',
    short_name: 'BT Admin',
    description: 'Beast Tribe admin and partner dashboard',
    start_url: '/',
    display: 'standalone',
    background_color: '#023C3C',
    theme_color: '#023C3C',
    icons: [
      { src: '/icon.png', sizes: 'any', type: 'image/png' },
      { src: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  };
}
