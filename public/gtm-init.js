// Runs in the head before GTM and React. GTM remains the owner of pixel IDs/events.
(function () {
  var choice = { analytics: false, marketing: false };
  try {
    // Keep this small classic-script check in sync with parseConsent (tested together).
    var saved = JSON.parse(localStorage.getItem('ilyakav-consent') || 'null');
    var age = saved && Date.now() - Date.parse(saved.chosenAt);
    if (!new URLSearchParams(location.search).has('consent-reset') && saved &&
      saved.version === 2 && typeof saved.chosenAt === 'string' &&
      typeof saved.analytics === 'boolean' && typeof saved.marketing === 'boolean' &&
      Number.isFinite(age) && age >= 0 && age < 180 * 24 * 60 * 60 * 1000) {
      // Do not restore an old grant from read-only storage: a later withdrawal
      // could not replace it. This fixed, temporary key contains no user data.
      if (saved.analytics || saved.marketing) {
        localStorage.setItem('ilyakav-consent-storage-probe', '1');
        localStorage.removeItem('ilyakav-consent-storage-probe');
      }
      choice = saved;
    }
  } catch (_) { /* Storage unavailable or invalid: retain denied defaults. */ }

  function signals(value) {
    return {
      analytics_storage: value.analytics ? 'granted' : 'denied',
      ad_storage: value.marketing ? 'granted' : 'denied',
      ad_user_data: value.marketing ? 'granted' : 'denied',
      ad_personalization: value.marketing ? 'granted' : 'denied'
    };
  }
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  window.gtag('consent', 'default', signals({ analytics: false, marketing: false }));
  window.gtag('set', 'ads_data_redaction', true);
  window.gtag('set', 'url_passthrough', false);
  window.gtag('consent', 'update', signals(choice));

  // Google consent signals do not control Meta. Own the compatible loader so that
  // consent is queued BEFORE any GTM tag calls fbq('init') or fbq('track'). A bare
  // fbq stub alone would make the standard GTM Pixel bootstrap skip its loader.
  var metaEnabled = !document.currentScript || !document.currentScript.getAttribute || document.currentScript.getAttribute('data-meta-enabled') !== 'false';
  setupMeta();

  function setupMeta() {
    var loadMeta = !window.fbq;
    if (loadMeta) {
      var fbq = window.fbq = function () {
        // Preserve explicit GTM events without letting Meta infer button/form
        // events from page text or mailto drafts. GTM remains the source of IDs.
        if (arguments[0] === 'init') dispatchMeta(['set', 'autoConfig', false, String(arguments[1])]);
        dispatchMeta(arguments);
      };
      var dispatchMeta = function (args) {
        if (fbq.callMethod) fbq.callMethod.apply(fbq, args);
        else fbq.queue.push(args);
      };
      if (!window._fbq) window._fbq = fbq;
      fbq.push = fbq;
      fbq.loaded = true;
      fbq.version = '2.0';
      fbq.queue = [];
    }
    window.fbq('consent', 'revoke');
    // Meta stops draining its pre-load queue after revoke. A queued grant behind
    // that revoke would never run, so keep the latest choice outside that queue
    // and apply it directly once the library has installed callMethod.
    var metaConsent = metaEnabled && choice.marketing;
    window.__ilyakavSetMetaConsent = function (granted) {
      metaConsent = metaEnabled && granted === true;
      if (window.fbq.callMethod) window.fbq('consent', metaConsent ? 'grant' : 'revoke');
    };
    window.__ilyakavSetMetaConsent(metaConsent);
    // Keep the revoked compatible stub when disabled: the standard Meta tag in
    // GTM then also skips its loader instead of bypassing this provider switch.
    if (loadMeta && metaEnabled) {
      var script = document.createElement('script');
      script.id = 'ilyakav-meta-library';
      script.async = true;
      script.src = 'https://connect.facebook.net/en_US/fbevents.js';
      script.onload = function () { window.__ilyakavSetMetaConsent(metaConsent); };
      if (document.currentScript && document.currentScript.nonce) script.nonce = document.currentScript.nonce;
      document.head.appendChild(script);
    }
  }
  window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
}());
