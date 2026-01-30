import {useState, useEffect, useRef} from 'react';
import {useFetcher} from 'react-router';

const STORAGE_KEY = 'discount-popup-dismissed';

export function DiscountPopup() {
  const fetcher = useFetcher<{success: boolean; error: string | null}>();
  const inputRef = useRef<HTMLInputElement>(null);

  const [dismissed, setDismissed] = useState(() => {
    try {
      return !!localStorage.getItem(STORAGE_KEY);
    } catch {
      return false;
    }
  });
  const [triggerVisible, setTriggerVisible] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const isSubmitting = fetcher.state !== 'idle';
  const isSuccess = fetcher.data?.success === true;
  const errorMessage = fetcher.data?.error ?? null;

  // Show trigger button after a short delay
  useEffect(() => {
    if (dismissed) return;
    const timeout = setTimeout(() => setTriggerVisible(true), 1500);
    return () => clearTimeout(timeout);
  }, [dismissed]);

  // On success, clear input and auto-close after delay
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
    setTriggerVisible(false);
    try {
      localStorage.setItem(STORAGE_KEY, '1');
    } catch {}
    setTimeout(() => setDismissed(true), 500);
  }

  if (dismissed) return null;

  return (
    <>
      {/* Trigger button — bottom-left */}
      <button
        className={`btn btn-glass discount-trigger ${triggerVisible && !modalOpen ? 'discount-trigger--visible' : ''}`}
        onClick={() => setModalOpen(true)}
      >
        Get 15% Off
      </button>

      {/* Modal overlay */}
      {modalOpen && (
        <div
          className="discount-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalOpen(false);
          }}
        >
          <div className="discount-modal">
            <button
              className="discount-modal__close"
              onClick={() => setModalOpen(false)}
              aria-label="Close"
            >
              ✕
            </button>

            {isSuccess ? (
              <div className="discount-modal__body">
                <h2 className="discount-modal__title">Welcome!</h2>
                <p className="discount-modal__subtitle">
                  Check your inbox for your 15% discount code.
                </p>
              </div>
            ) : (
              <div className="discount-modal__body">
                <p className="discount-modal__eyebrow">Unlock</p>
                <h2 className="discount-modal__title">15% Off</h2>
                <p className="discount-modal__subtitle">when you subscribe.</p>

                <fetcher.Form
                  method="post"
                  action="/newsletter"
                  className="discount-modal__form"
                >
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
