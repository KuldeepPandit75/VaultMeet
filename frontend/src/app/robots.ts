import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/admin/',
        '/event-space/',
        '/room/',
        '/_next/',
        '/private/',
        '*.json',
      ],
    },
    sitemap: 'https://www.vaultmeet.com/sitemap.xml',
  }
}
