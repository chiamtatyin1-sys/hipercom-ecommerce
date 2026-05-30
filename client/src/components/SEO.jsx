import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const SEO = ({ 
  title = 'HiperCom - Your Trusted E-Commerce Platform',
  description = 'Shop the latest products at HiperCom. Fast shipping, secure payments, excellent customer service.',
  keywords = 'ecommerce, online shopping, Malaysia, electronics, fashion',
  ogImage = 'https://hipercom.com/og-image.jpg',
  url,
}) => {
  const location = useLocation();
  const currentUrl = url || `https://hipercom.com${location.pathname}`;

  useEffect(() => {
    // Update document title
    document.title = title;

    // Update meta tags
    const metaTags = {
      'description': description,
      'keywords': keywords,
      'author': 'HiperCom',
      'robots': 'index, follow',
      'viewport': 'width=device-width, initial-scale=1.0',
    };

    Object.entries(metaTags).forEach(([name, content]) => {
      let meta = document.querySelector(`meta[name="${name}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.name = name;
        document.head.appendChild(meta);
      }
      meta.content = content;
    });

    // Open Graph tags
    const ogTags = {
      'og:title': title,
      'og:description': description,
      'og:image': ogImage,
      'og:url': currentUrl,
      'og:type': 'website',
      'og:site_name': 'HiperCom',
    };

    Object.entries(ogTags).forEach(([property, content]) => {
      let meta = document.querySelector(`meta[property="${property}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('property', property);
        document.head.appendChild(meta);
      }
      meta.content = content;
    });

    // Twitter Card tags
    const twitterTags = {
      'twitter:card': 'summary_large_image',
      'twitter:title': title,
      'twitter:description': description,
      'twitter:image': ogImage,
    };

    Object.entries(twitterTags).forEach(([name, content]) => {
      let meta = document.querySelector(`meta[name="${name}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.name = name;
        document.head.appendChild(meta);
      }
      meta.content = content;
    });

    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = currentUrl;

    // Structured Data (JSON-LD)
    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'HiperCom',
      url: currentUrl,
      description: description,
      potentialAction: {
        '@type': 'SearchAction',
        target: `https://hipercom.com/products?search={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    };

    let script = document.querySelector('#structured-data');
    if (!script) {
      script = document.createElement('script');
      script.id = 'structured-data';
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(structuredData);

  }, [title, description, keywords, ogImage, currentUrl]);

  return null;
};

export default SEO;
