import {useState, useEffect, useRef} from 'react';
import {useFetcher} from 'react-router';

export function DiscountPopup() {
  const fetcher = useFetcher<{success: boolean; error: string | null; discountCode: string | null}>();
  const inputRef = useRef<HTMLInputElement>(null);

  const [triggerVisible, setTriggerVisible] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const isSubmitting = fetcher.state !== 'idle';
  const isSuccess = fetcher.data?.success === true;
  const errorMessage = fetcher.data?.error ?? null;
  const discountCode = fetcher.data?.discountCode ?? null;

  // Show trigger button after a short delay
  useEffect(() => {
    const timeout = setTimeout(() => setTriggerVisible(true), 1500);
    return () => clearTimeout(timeout);
  }, []);

  // On success without discount code, auto-close after delay
  useEffect(() => {
    if (isSuccess && !discountCode) {
      if (inputRef.current) inputRef.current.value = '';
      const timeout = setTimeout(() => {
        handleDismiss();
      }, 2500);
      return () => clearTimeout(timeout);
    }
  }, [isSuccess, discountCode]);

  // Focus input when modal opens
  useEffect(() => {
    if (modalOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [modalOpen]);

  function handleDismiss() {
    setModalOpen(false);
  }

  async function handleCopy() {
    if (!discountCode) return;
    try {
      await navigator.clipboard.writeText(discountCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select text
    }
  }

  return (
    <>
      {/* Trigger button — bottom-left */}
      <button
        className={`btn btn-glass discount-trigger ${triggerVisible && !modalOpen ? 'discount-trigger--visible' : ''}`}
        onClick={() => setModalOpen(true)}
      >
        {discountCode ? 'Get your 10% Off' : 'Get 10% Off'}
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

            {isSuccess && discountCode ? (
              <div className="discount-modal__body">
                <h2 className="discount-modal__title">Your Code</h2>
                <p className="discount-modal__subtitle">
                  Use this code at checkout for 10% off:
                </p>
                <div className="discount-modal__code-wrapper">
                  <span className="discount-modal__code">{discountCode}</span>
                  <button
                    className="btn btn-glass discount-modal__copy-btn"
                    onClick={handleCopy}
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <button
                  className="discount-modal__decline"
                  onClick={handleDismiss}
                >
                  Close
                </button>
              </div>
            ) : isSuccess ? (
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
