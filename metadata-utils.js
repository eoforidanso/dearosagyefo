/**
 * Metadata Utilities for Dynamic Social Sharing & SEO
 * Handles dynamic updates to Open Graph tags, structured data, and page metadata
 */

const MetadataUtils = {
  /**
   * Update page title and OpenGraph metadata for a letter
   * @param {Object} letter - The letter object with title, authorName, content, etc.
   * @param {number} letterIndex - Index of the letter for URL generation
   */
  updateLetterMetadata: function(letter, letterIndex) {
    if (!letter) return;

    // Sanitize and prepare text
    const title = letter.title || 'Untitled Letter';
    const authorName = letter.authorName || 'Anonymous Citizen';
    const preview = (letter.content || letter.preview || '')
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .slice(0, 160) // Truncate to ~160 chars for meta description
      .trim();

    const fullDescription = `Letter from ${authorName} to Kwame Nkrumah: "${title}". ${preview}...`;
    const letterUrl = `https://dearosagyefo.com/l/${letter.id}`;

    // Update document title
    document.title = `${title} – by ${authorName} | Dear Osagyefo`;

    // Update Open Graph Meta Tags
    this.updateMetaTag('og:title', `${title} – Letter to Osagyefo`);
    this.updateMetaTag('og:description', fullDescription);
    this.updateMetaTag('og:url', letterUrl);
    this.updateMetaTag('og:type', 'article');
    
    this.updateMetaTag('og:image', `https://dearosagyefo.com/og/${letter.id}.png`);
    this.updateMetaTag('og:image:width', '1200');
    this.updateMetaTag('og:image:height', '630');

    // Update Twitter Card Tags
    this.updateMetaTag('twitter:title', `${title} – Letter to Osagyefo`);
    this.updateMetaTag('twitter:description', fullDescription);
    this.updateMetaTag('twitter:url', letterUrl);

    // Update canonical URL
    this.updateCanonicalUrl(letterUrl);

    // Update Article Structured Data
    this.updateArticleSchema(letter, letterUrl, authorName);

    // First open: push a new history entry so the back button closes the modal.
    // Subsequent prev/next navigation: replace the current entry to avoid history bloat.
    var currentState = window.history.state;
    if (currentState && currentState.letter) {
      window.history.replaceState({ letter: letter.id }, title, `/l/${letter.id}`);
    } else {
      window.history.pushState({ letter: letter.id }, title, `/l/${letter.id}`);
    }
  },

  /**
   * Reset metadata to default letters page
   */
  resetLetterMetadata: function() {
    document.title = 'Open Letters to Osagyefo | Dear Osagyefo';
    
    this.updateMetaTag('og:title', 'Open Letters to Osagyefo – Kwame Nkrumah');
    this.updateMetaTag('og:description', 'A dynamic collection of open letters from writers across the diaspora to Kwame Nkrumah, Ghana\'s first President.');
    this.updateMetaTag('og:url', 'https://dearosagyefo.com/letters.html');
    this.updateMetaTag('og:type', 'website');
    
    this.updateMetaTag('twitter:title', 'Open Letters to Osagyefo – Kwame Nkrumah');
    this.updateMetaTag('twitter:description', 'A dynamic collection of open letters from writers across the diaspora to Kwame Nkrumah, Ghana\'s first President.');

    this.updateCanonicalUrl('https://dearosagyefo.com/letters.html');

    // Remove article schema when not viewing a specific letter
    this.removeArticleSchema();

    window.history.replaceState({}, '', '/letters.html');
  },

  /**
   * Update or create a meta tag
   * @param {string} property - The meta property name (og:title, etc.)
   * @param {string} content - The content value
   */
  updateMetaTag: function(property, content) {
    let tag = document.querySelector(`meta[property="${property}"]`);
    if (!tag) {
      tag = document.createElement('meta');
      tag.setAttribute('property', property);
      document.head.appendChild(tag);
    }
    tag.setAttribute('content', content);
  },

  /**
   * Update canonical URL
   * @param {string} url - The canonical URL
   */
  updateCanonicalUrl: function(url) {
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = url;
  },

  /**
   * Update Article Schema structured data
   * @param {Object} letter - The letter object
   * @param {string} url - The letter URL
   * @param {string} authorName - The author name
   */
  updateArticleSchema: function(letter, url, authorName) {
    const datePublished = letter.publishedAt || letter.createdAt || new Date().toISOString();
    const dateModified = letter.updatedAt || datePublished;

    const articleSchema = {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": letter.title || 'Untitled Letter',
      "description": (letter.content || letter.preview || '').slice(0, 160),
      "image": `https://dearosagyefo.com/og/${letter.id}.png`,
      "datePublished": datePublished,
      "dateModified": dateModified,
      "author": {
        "@type": "Person",
        "name": authorName || "Anonymous Citizen"
      },
      "publisher": {
        "@type": "Organization",
        "name": "Dear Osagyefo",
        "logo": {
          "@type": "ImageObject",
          "url": "https://dearosagyefo.com/thumbnail.png"
        }
      },
      "url": url,
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": "https://dearosagyefo.com/letters.html"
      },
      "isPartOf": {
        "@type": "Collection",
        "name": "Letters to Osagyefo",
        "url": "https://dearosagyefo.com/letters.html"
      },
      "inLanguage": "en-US",
      "keywords": ["Kwame Nkrumah", "Ghana", "letter", "activism", "African history", letter.category || ""].filter(Boolean).join(", ")
    };

    // Remove existing article schema if present
    this.removeArticleSchema();

    // Add new article schema
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'article-schema';
    script.textContent = JSON.stringify(articleSchema);
    document.head.appendChild(script);
  },

  /**
   * Remove Article Schema from page
   */
  removeArticleSchema: function() {
    const existingSchema = document.getElementById('article-schema');
    if (existingSchema) {
      existingSchema.remove();
    }
  }
};

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MetadataUtils;
}
