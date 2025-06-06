'use client';

import Head from 'next/head';
import { SEOProps } from '@/config/seo.config';

// SEO Component for handling meta tags and Open Graph data
const SEO = ({
  title,
  description,
  keywords,
  ogImage,
  ogType = 'website',
  twitterCard = 'summary_large_image',
  canonicalUrl,
  noIndex = false
}: SEOProps) => {
  // Ensure we have a valid title and description
  const pageTitle = title || 'HackMeet - Virtual Hackathon Platform';
  const pageDescription = description || 'Join HackMeet, the innovative virtual hackathon platform.';
  const pageKeywords = keywords?.join(', ') || '';
  const pageImage = ogImage || '/images/og-image.jpg';
  const pageUrl = canonicalUrl || 'https://hackmeet.com';

  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{pageTitle}</title>
      <meta name="description" content={pageDescription} />
      {keywords && <meta name="keywords" content={pageKeywords} />}
      
      {/* Canonical URL */}
      <link rel="canonical" href={pageUrl} />
      
      {/* Robots Meta */}
      <meta 
        name="robots" 
        content={noIndex ? 'noindex, nofollow' : 'index, follow'} 
      />
      
      {/* Open Graph Meta Tags */}
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDescription} />
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={pageUrl} />
      <meta property="og:image" content={pageImage} />
      <meta property="og:site_name" content="HackMeet" />
      
      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={pageDescription} />
      <meta name="twitter:image" content={pageImage} />
      
      {/* Additional Meta Tags */}
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
      <meta name="language" content="English" />
      <meta name="revisit-after" content="7 days" />
      <meta name="author" content="HackMeet" />
      
      {/* Favicon */}
      <link rel="icon" href="/favicon.ico" />
      <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    </Head>
  );
};

export default SEO; 