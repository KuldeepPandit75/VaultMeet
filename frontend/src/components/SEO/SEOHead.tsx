import Head from 'next/head';

interface SEOHeadProps {
  title: string;
  description: string;
  keywords?: string[];
  ogImage?: string;
  ogUrl?: string;
  canonical?: string;
  structuredData?: object;
  noIndex?: boolean;
}

export default function SEOHead({
  title,
  description,
  keywords = [],
  ogImage = '/banner.png',
  ogUrl,
  canonical,
  structuredData,
  noIndex = false,
}: SEOHeadProps) {
  const fullTitle = title.includes('VaultMeet') ? title : `${title} | VaultMeet`;
  const fullUrl = ogUrl || `https://www.vaultmeet.xyz${canonical || ''}`;

  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords.length > 0 && <meta name="keywords" content={keywords.join(', ')} />}
      
      {/* Canonical URL */}
      {canonical && <link rel="canonical" href={`https://www.vaultmeet.xyz${canonical}`} />}
      
      {/* Robots */}
      {noIndex && <meta name="robots" content="noindex, nofollow" />}
      
      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={`https://www.vaultmeet.xyz${ogImage}`} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="VaultMeet" />
      <meta property="og:locale" content="en_US" />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={`https://www.vaultmeet.xyz${ogImage}`} />
      <meta name="twitter:creator" content="@Kuldeepk75" />
      <meta name="twitter:site" content="@Kuldeepk75" />
      
      {/* Additional Social Media Meta Tags */}
      <meta property="og:site_name" content="VaultMeet" />
      <meta property="og:locale" content="en_US" />
      <meta property="og:type" content="website" />
      
      {/* LinkedIn specific meta tags */}
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content="VaultMeet - 2D Virtual Event Platform" />
      
      {/* Structured Data */}
      {structuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />
      )}
      
      {/* Additional Meta Tags */}
      <meta name="author" content="VaultMeet Team" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="theme-color" content="#6366f1" />
      
      {/* Preconnect for Performance */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
    </Head>
  );
}
