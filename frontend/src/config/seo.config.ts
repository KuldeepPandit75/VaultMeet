// SEO Configuration for HackMeet
// This file contains all the default SEO settings and helper functions

// Types for SEO metadata
export interface SEOProps {
  title?: string;
  description?: string;
  keywords: string[];  // Make keywords required
  ogImage?: string;
  ogType?: 'website' | 'article';
  twitterCard?: 'summary' | 'summary_large_image';
  canonicalUrl?: string;
  noIndex?: boolean;
}

// Default SEO settings for the entire application
export const defaultSEO: SEOProps = {
  title: 'HackMeet - Virtual Hackathon Platform',
  description: 'Join HackMeet, the innovative virtual hackathon platform. Connect with developers worldwide, participate in exciting challenges, and showcase your skills in our immersive 2D virtual environment.',
  keywords: [
    'hackathon',
    'virtual hackathon',
    'coding competition',
    'developer platform',
    'tech events',
    'programming',
    'innovation',
    'virtual environment',
    '2D virtual world',
    'developer community'
  ],
  ogImage: '/images/og-image.jpg', // Default Open Graph image
  ogType: 'website',
  twitterCard: 'summary_large_image',
  canonicalUrl: 'https://hackmeet.com', // Replace with your actual domain
  noIndex: false
};

// Helper function to generate page-specific SEO metadata
export const generateSEO = (pageSEO: Partial<SEOProps> = {}): SEOProps => {
  return {
    ...defaultSEO,
    ...pageSEO,
    // Ensure title is properly formatted
    title: pageSEO.title 
      ? `${pageSEO.title} | HackMeet`
      : defaultSEO.title,
    // Merge keywords if provided
    keywords: pageSEO.keywords 
      ? [...defaultSEO.keywords, ...pageSEO.keywords]
      : defaultSEO.keywords
  };
};

// Common SEO patterns for different page types
export const pageTypeSEO = {
  event: (eventName: string, eventDescription: string) => ({
    title: eventName,
    description: eventDescription,
    ogType: 'article' as const,
    keywords: ['hackathon event', 'coding competition', eventName.toLowerCase()]
  }),
  
  news: (articleTitle: string, articleDescription: string) => ({
    title: articleTitle,
    description: articleDescription,
    ogType: 'article' as const,
    keywords: ['tech news', 'hackathon news', articleTitle.toLowerCase()]
  }),
  
  profile: (username: string, userBio: string) => ({
    title: `${username}'s Profile`,
    description: userBio,
    ogType: 'profile' as const,
    keywords: ['developer profile', 'hacker profile', username.toLowerCase()]
  })
};

// Instructions for adding new pages:
/*
1. Import the generateSEO function in your page component:
   import { generateSEO } from '@/config/seo.config';

2. Define page-specific SEO metadata:
   const pageSEO = {
     title: 'Your Page Title',
     description: 'Your page description',
     keywords: ['your', 'specific', 'keywords'],
     ogImage: '/path/to/your/image.jpg' // Optional
   };

3. Use the generateSEO function to merge with defaults:
   const seo = generateSEO(pageSEO);

4. Pass the SEO metadata to the SEO component:
   <SEO {...seo} />
*/ 