// Runs in the head before the async GTM script, independently of React.
// External file so the site's CSP does not need unsafe-inline.
window.dataLayer = window.dataLayer || [];
window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
window.gtag('consent', 'default', {
  analytics_storage: 'denied',
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied'
});
window.gtag('set', 'ads_data_redaction', true);
window.gtag('set', 'url_passthrough', false);
window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
