/**
 * API configuration - points to production backend only.
 * 
 * Change API_BASE here and it applies to ALL pages.
 * 
 * Configuration:
 *   - Always uses production backend (no localhost)
 *   - Update PRODUCTION_BACKEND_URL with your deployed backend URL
 */
(function () {
  // API calls go through CloudFront (/api/* proxied to EC2 backend)
  // No separate URL needed — same domain, no mixed content issues
  window.API_BASE = '';
})();
