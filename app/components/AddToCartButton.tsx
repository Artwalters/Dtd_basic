import {type FetcherWithComponents} from 'react-router';
import {CartForm, type OptimisticCartLineInput} from '@shopify/hydrogen';
import {useState, useEffect, useRef} from 'react';

function AddToCartButtonInner({
  fetcher,
  children,
  disabled,
  onClick,
  className,
}: {
  fetcher: FetcherWithComponents<any>;
  children: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  const [showSuccess, setShowSuccess] = useState(false);
  const prevStateRef = useRef<string>('idle');
  const isLoading = fetcher.state !== 'idle';

  useEffect(() => {
    if (prevStateRef.current !== 'idle' && fetcher.state === 'idle') {
      setShowSuccess(true);
      const timer = setTimeout(() => {
        setShowSuccess(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
    prevStateRef.current = fetcher.state;
  }, [fetcher.state]);

  return (
    <button
      type="submit"
      onClick={onClick}
      disabled={disabled ?? isLoading}
      className={`${className} ${isLoading ? 'is-loading' : ''} ${showSuccess ? 'is-success' : ''}`}
    >
      {isLoading ? (
        <span className="btn-loader"></span>
      ) : showSuccess ? (
        <span>Added to bag</span>
      ) : (
        children
      )}
    </button>
  );
}

export function AddToCartButton({
  analytics,
  children,
  disabled,
  lines,
  onClick,
  className,
}: {
  analytics?: unknown;
  children: React.ReactNode;
  disabled?: boolean;
  lines: Array<OptimisticCartLineInput>;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <CartForm route="/cart" inputs={{lines}} action={CartForm.ACTIONS.LinesAdd}>
      {(fetcher: FetcherWithComponents<any>) => (
        <>
          <input
            name="analytics"
            type="hidden"
            value={JSON.stringify(analytics)}
          />
          <input
            name="cartAction"
            type="hidden"
            value="LinesAdd"
          />
          <AddToCartButtonInner
            fetcher={fetcher}
            disabled={disabled}
            onClick={onClick}
            className={className}
          >
            {children}
          </AddToCartButtonInner>
        </>
      )}
    </CartForm>
  );
}
