import {useState, useEffect, useCallback} from 'react';
import {Link} from 'react-router';
import {useAnalytics} from '@shopify/hydrogen';

interface ConsentToggles {
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
}

const DEFAULT_TOGGLES: ConsentToggles = {
  analytics: true,
  marketing: true,
  preferences: true,
};

export function CookieBanner() {
  const {register, customerPrivacy} = useAnalytics();
  const {ready} = register('CookieBanner');

  const [visible, setVisible] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [toggles, setToggles] = useState<ConsentToggles>(DEFAULT_TOGGLES);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    // Wait for customerPrivacy API to be available
    const check = () => {
      if (customerPrivacy?.shouldShowBanner()) {
        setShouldRender(true);
        setTimeout(() => setVisible(true), 500);
      } else {
        // API ready but banner not needed — signal ready immediately
        ready();
      }
    };

    // The API may not be immediately available; poll briefly
    if (customerPrivacy) {
      check();
    } else {
      const interval = setInterval(() => {
        if (customerPrivacy) {
          check();
          clearInterval(interval);
        }
      }, 200);
      return () => clearInterval(interval);
    }
  }, [customerPrivacy]);

  const handleConsent = useCallback(
    (type: 'acceptAll' | 'rejectAll' | 'custom', custom?: ConsentToggles) => {
      if (!customerPrivacy?.setTrackingConsent) return;

      let consent: Record<string, boolean>;

      switch (type) {
        case 'acceptAll':
          consent = {
            analytics: true,
            marketing: true,
            preferences: true,
            sale_of_data: true,
          };
          break;
        case 'rejectAll':
          consent = {
            analytics: false,
            marketing: false,
            preferences: false,
            sale_of_data: false,
          };
          break;
        case 'custom':
          consent = {
            analytics: custom?.analytics ?? false,
            marketing: custom?.marketing ?? false,
            preferences: custom?.preferences ?? false,
            sale_of_data: custom?.marketing ?? false,
          };
          break;
      }

      customerPrivacy.setTrackingConsent(consent);
      ready();

      // Hide UI
      setVisible(false);
      setShowPreferences(false);
      setTimeout(() => {
        setShouldRender(false);
        window.dispatchEvent(new CustomEvent('cookie-banner-dismissed'));
      }, 500);
    },
    [customerPrivacy, ready],
  );

  const handleToggle = useCallback((key: keyof ConsentToggles) => {
    setToggles((prev) => ({...prev, [key]: !prev[key]}));
  }, []);

  if (!shouldRender) return null;

  return (
    <>
      {/* Layer 1: Compact banner */}
      {!showPreferences && (
        <div
          className={`cookie-banner ${visible ? 'cookie-banner--visible' : ''}`}
        >
          <div className="cookie-banner__inner">
            <p className="cookie-banner__text">
              We use cookies to improve your experience.{' '}
              <Link to="/policies#privacy" className="cookie-banner__link">
                Privacy Policy
              </Link>
            </p>
            <div className="cookie-banner__actions">
              <button
                className="btn btn-glass"
                onClick={() => handleConsent('rejectAll')}
              >
                Reject All
              </button>
              <button
                className="btn btn-solid"
                onClick={() => handleConsent('acceptAll')}
              >
                Accept All
              </button>
            </div>
            <button
              className="cookie-banner__customize"
              onClick={() => setShowPreferences(true)}
            >
              Customize
            </button>
          </div>
        </div>
      )}

      {/* Layer 2: Preferences modal */}
      {showPreferences && (
        <div
          className="cookie-preferences-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowPreferences(false);
          }}
        >
          <div className="cookie-preferences-modal">
            <div className="cookie-preferences-modal__header">
              <h2 className="cookie-preferences-modal__title">
                Cookie Preferences
              </h2>
              <button
                className="cookie-preferences-modal__close"
                onClick={() => setShowPreferences(false)}
                aria-label="Close preferences"
              >
                ✕
              </button>
            </div>

            <div className="cookie-preferences-modal__body">
              {/* Strictly Required */}
              <div className="cookie-toggle-row">
                <div className="cookie-toggle-row__info">
                  <span className="cookie-toggle-row__label">
                    Strictly Required
                  </span>
                  <span className="cookie-toggle-row__desc">
                    Essential for the site to function. Cannot be disabled.
                  </span>
                </div>
                <button
                  className="cookie-toggle cookie-toggle--disabled cookie-toggle--on"
                  aria-label="Strictly Required — always on"
                  disabled
                >
                  <span className="cookie-toggle__thumb" />
                </button>
              </div>

              {/* Analytics */}
              <div className="cookie-toggle-row">
                <div className="cookie-toggle-row__info">
                  <span className="cookie-toggle-row__label">
                    Analytics &amp; Statistics
                  </span>
                  <span className="cookie-toggle-row__desc">
                    Help us understand how visitors interact with the site.
                  </span>
                </div>
                <button
                  className={`cookie-toggle ${toggles.analytics ? 'cookie-toggle--on' : ''}`}
                  onClick={() => handleToggle('analytics')}
                  aria-label="Toggle analytics cookies"
                  aria-pressed={toggles.analytics}
                >
                  <span className="cookie-toggle__thumb" />
                </button>
              </div>

              {/* Marketing */}
              <div className="cookie-toggle-row">
                <div className="cookie-toggle-row__info">
                  <span className="cookie-toggle-row__label">
                    Marketing &amp; Retargeting
                  </span>
                  <span className="cookie-toggle-row__desc">
                    Used to deliver relevant ads and track campaign performance.
                  </span>
                </div>
                <button
                  className={`cookie-toggle ${toggles.marketing ? 'cookie-toggle--on' : ''}`}
                  onClick={() => handleToggle('marketing')}
                  aria-label="Toggle marketing cookies"
                  aria-pressed={toggles.marketing}
                >
                  <span className="cookie-toggle__thumb" />
                </button>
              </div>

              {/* Functional */}
              <div className="cookie-toggle-row">
                <div className="cookie-toggle-row__info">
                  <span className="cookie-toggle-row__label">
                    Functional Cookies
                  </span>
                  <span className="cookie-toggle-row__desc">
                    Enable personalized features like saved preferences.
                  </span>
                </div>
                <button
                  className={`cookie-toggle ${toggles.preferences ? 'cookie-toggle--on' : ''}`}
                  onClick={() => handleToggle('preferences')}
                  aria-label="Toggle functional cookies"
                  aria-pressed={toggles.preferences}
                >
                  <span className="cookie-toggle__thumb" />
                </button>
              </div>
            </div>

            <div className="cookie-preferences-modal__footer">
              <button
                className="btn btn-glass"
                onClick={() => handleConsent('rejectAll')}
              >
                Reject All
              </button>
              <button
                className="btn btn-solid"
                onClick={() => handleConsent('custom', toggles)}
              >
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
