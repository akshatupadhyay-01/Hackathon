import { useEffect } from 'react';

export interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonicalPath?: string;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'place' | 'profile';
  noIndex?: boolean;
  schema?: Record<string, any> | Array<Record<string, any>>;
}

const DEFAULT_TITLE = 'Johar Jharkhand — Official Eco & Cultural Tourism Platform | SIH25032';
const DEFAULT_DESCRIPTION =
  "Discover Jharkhand's sacred hills, cascades, living tribal heritage, and national parks. Book certified indigenous guides, authentic rural homestays, digital eco-passes, and explore live crowd-monitored GIS maps.";
const DEFAULT_KEYWORDS =
  'Jharkhand tourism, eco tourism Jharkhand, Betla National Park, Hundru Falls, Netarhat sunset point, Parasnath Shikharji, Patratu valley, Dokra craft, Sohrai art, SIH25032';
const DEFAULT_IMAGE =
  'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1200&auto=format&fit=crop&q=80';
const BASE_URL = 'https://johar-jharkhand-tourism.gov.in';

/**
 * Helper to update or create a meta tag by property or name attribute
 */
function setMetaTag(selector: string, attributeName: string, attributeValue: string, content: string) {
  let element = document.querySelector(selector) as HTMLMetaElement | null;
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attributeName, attributeValue);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

/**
 * Dynamic SEO Component for client-side routing.
 * Synchronously updates document.title, meta descriptions, canonical links,
 * OpenGraph, Twitter Cards, and injects Schema.org JSON-LD structured data.
 */
export function SEO({
  title,
  description = DEFAULT_DESCRIPTION,
  keywords = DEFAULT_KEYWORDS,
  canonicalPath = '',
  ogImage = DEFAULT_IMAGE,
  ogType = 'website',
  noIndex = false,
  schema,
}: SEOProps) {
  useEffect(() => {
    // 1. Document Title
    const formattedTitle = title
      ? `${title} | Johar Jharkhand Eco Tourism`
      : DEFAULT_TITLE;
    document.title = formattedTitle;

    // 2. Primary Meta Tags
    setMetaTag('meta[name="title"]', 'name', 'title', formattedTitle);
    setMetaTag('meta[name="description"]', 'name', 'description', description);
    setMetaTag('meta[name="keywords"]', 'name', 'keywords', keywords);

    // 3. Robots
    const robotsContent = noIndex
      ? 'noindex, nofollow'
      : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';
    setMetaTag('meta[name="robots"]', 'name', 'robots', robotsContent);

    // 4. Canonical URL
    const canonicalUrl = `${BASE_URL}${canonicalPath.startsWith('/') ? canonicalPath : `/${canonicalPath}`}`;
    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', canonicalUrl);

    // 5. OpenGraph Tags
    setMetaTag('meta[property="og:title"]', 'property', 'og:title', formattedTitle);
    setMetaTag('meta[property="og:description"]', 'property', 'og:description', description);
    setMetaTag('meta[property="og:url"]', 'property', 'og:url', canonicalUrl);
    setMetaTag('meta[property="og:image"]', 'property', 'og:image', ogImage);
    setMetaTag('meta[property="og:type"]', 'property', 'og:type', ogType);
    setMetaTag('meta[property="og:site_name"]', 'property', 'og:site_name', 'Johar Jharkhand Eco Tourism');

    // 6. Twitter Card Tags
    setMetaTag('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image');
    setMetaTag('meta[name="twitter:title"]', 'name', 'twitter:title', formattedTitle);
    setMetaTag('meta[name="twitter:description"]', 'name', 'twitter:description', description);
    setMetaTag('meta[name="twitter:image"]', 'name', 'twitter:image', ogImage);

    // 7. Schema.org JSON-LD structured data injection
    let schemaScript = document.getElementById('dynamic-page-schema') as HTMLScriptElement | null;
    if (schema) {
      if (!schemaScript) {
        schemaScript = document.createElement('script');
        schemaScript.id = 'dynamic-page-schema';
        schemaScript.type = 'application/ld+json';
        document.head.appendChild(schemaScript);
      }
      schemaScript.text = JSON.stringify(schema);
    } else if (schemaScript) {
      schemaScript.remove();
    }

    return () => {
      // Optional cleanup on unmount: remove dynamic schema script
      const scriptToRemove = document.getElementById('dynamic-page-schema');
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [title, description, keywords, canonicalPath, ogImage, ogType, noIndex, schema]);

  return null;
}
