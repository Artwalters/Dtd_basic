import {useState, useEffect, useRef} from 'react';
import {useFetcher} from 'react-router';

export function DiscountPopup() {
  const fetcher = useFetcher<{success: boolean; error: string | null; discountCode: string | null}>();
  const inputRef = useRef<HTMLInputElement>(null);

  const [triggerVisible, setTriggerVisible] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const isSubmitting = fetcher.state !== 'idle';
  const isSuccess = fetcher.data?.success === true;
  const errorMessage = fetcher.data?.error ?? null;

  // Detect mobile once on mount
  useEffect(() => {
    setIsMobile(window.matchMedia('(max-width: 767px)').matches);
  }, []);

  // Desktop: show trigger button after delay
  // Mobile: auto-open modal after cookie banner is dismissed
  useEffect(() => {
    if (dismissed) return;

    const show = () => {
      if (isMobile) {
        setModalOpen(true);
      } else {
        setTriggerVisible(true);
      }
    };

    // Always listen for the cookie-banner-dismissed event first
    let fallbackTimeout: ReturnType<typeof setTimeout>;
    let showed = false;

    const handleDismissed = () => {
      if (showed) return;
      showed = true;
      clearTimeout(fallbackTimeout);
      setTimeout(() => show(), 500);
    };

    window.addEventListener('cookie-banner-dismissed', handleDismissed);

    // Fallback: if no cookie banner appears within 3s, show the popup
    fallbackTimeout = setTimeout(() => {
      const bannerEl = document.querySelector('.cookie-banner');
      if (!bannerEl && !showed) {
        showed = true;
        show();
      }
    }, 3000);

    return () => {
      clearTimeout(fallbackTimeout);
      window.removeEventListener('cookie-banner-dismissed', handleDismissed);
    };
  }, [dismissed, isMobile]);

  // On success, auto-close after delay
  useEffect(() => {
    if (isSuccess) {
      if (inputRef.current) inputRef.current.value = '';
      const timeout = setTimeout(() => {
        handleDismiss();
      }, 2500);
      return () => clearTimeout(timeout);
    }
  }, [isSuccess]);

  // Focus input when modal opens
  useEffect(() => {
    if (modalOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [modalOpen]);

  function handleDismiss() {
    setModalOpen(false);
    setDismissed(true);
  }

  return (
    <>
      {/* Desktop trigger button — bottom-left */}
      <button
        className={`btn btn-glass discount-trigger ${triggerVisible && !modalOpen ? 'discount-trigger--visible' : ''}`}
        onClick={() => setModalOpen(true)}
      >
        Get 10% Off
      </button>

      {/* Modal overlay */}
      {modalOpen && (
        <div
          className="discount-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleDismiss();
          }}
        >
          <div className="discount-modal">
            <button
              className="discount-modal__close"
              onClick={handleDismiss}
              aria-label="Close"
            >
              ✕
            </button>

            {isSuccess ? (
              <div className="discount-modal__body">
                <h2 className="discount-modal__title">Welcome!</h2>
                <p className="discount-modal__subtitle">
                  Check your inbox for your 10% discount code.
                </p>
              </div>
            ) : (
              <div className="discount-modal__body">
                <p className="discount-modal__eyebrow">Unlock</p>
                <h2 className="discount-modal__title">10% Off</h2>
                <p className="discount-modal__subtitle">when you subscribe.</p>

                <fetcher.Form
                  method="post"
                  action="/newsletter"
                  className="discount-modal__form"
                >
                  <input type="hidden" name="source" value="discount" />
                  <input
                    ref={inputRef}
                    type="email"
                    name="email"
                    placeholder="Email Address"
                    className="discount-modal__input"
                    required
                    disabled={isSubmitting}
                  />
                  <button
                    type="submit"
                    className="btn-glass btn-glass--icon discount-modal__arrow-btn"
                    aria-label="Subscribe"
                    disabled={isSubmitting}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M15 10L20 15L15 20" stroke="currentColor" strokeMiterlimit="10" />
                      <path d="M4 4V12L7 15H20" stroke="currentColor" strokeMiterlimit="10" />
                    </svg>
                  </button>
                </fetcher.Form>

                {errorMessage && (
                  <p className="discount-modal__error">{errorMessage}</p>
                )}

                <button
                  className="discount-modal__decline"
                  onClick={handleDismiss}
                >
                  No, I'll pay full price
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
