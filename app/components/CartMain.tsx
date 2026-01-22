import {useOptimisticCart, Money, CartForm} from '@shopify/hydrogen';
import {Link, useFetchers} from 'react-router';
import type {CartApiQueryFragment} from 'storefrontapi.generated';
import {useAside} from '~/components/Aside';
import {CartLineItem} from '~/components/CartLineItem';
import {CartSummary, CartCheckoutActions} from './CartSummary';

export type CartLayout = 'page' | 'aside';

export type CartMainProps = {
  cart: CartApiQueryFragment | null;
  layout: CartLayout;
};

/**
 * The main cart component that displays the cart items and summary.
 * It is used by both the /cart route and the cart aside dialog.
 */
export function CartMain({layout, cart: originalCart}: CartMainProps) {
  const cart = useOptimisticCart(originalCart);
  const fetchers = useFetchers();

  // Check if any fetcher is adding items to cart (but not removing or updating)
  const isAddingToCart = fetchers.some(
    (fetcher) =>
      fetcher.state !== 'idle' &&
      fetcher.formAction === '/cart' &&
      fetcher.formData?.get('cartAction') === 'LinesAdd'
  );

  const linesCount = Boolean(cart?.lines?.nodes?.length || 0);
  const withDiscount =
    cart &&
    Boolean(cart?.discountCodes?.filter((code) => code.applicable)?.length);
  const className = `cart-main ${withDiscount ? 'with-discount' : ''}`;
  const cartHasItems = cart?.totalQuantity ? cart.totalQuantity > 0 : false;

  return (
    <div className={className}>
      <div className="cart-divider" />
      <div className="cart-content-scrollable">
        {isAddingToCart && (
          <div className="cart-loading">
            <div className="cart-loading-spinner" />
            <span>Adding to cart...</span>
          </div>
        )}
        {!linesCount && !isAddingToCart ? (
          <CartEmpty layout={layout} />
        ) : (
          <div className="cart-details">
            <div aria-labelledby="cart-lines">
              <ul>
                {(cart?.lines?.nodes ?? []).map((line) => (
                  <CartLineItem key={line.id} line={line} layout={layout} />
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
      {cartHasItems && (
        <div className="cart-footer-sticky">
          <div className="cart-divider divider-bottom" />
          <dl className="cart-subtotal">
            <dt>Total:</dt>
            <dd>
              {cart?.cost?.subtotalAmount?.amount ? (
                <Money data={cart?.cost?.subtotalAmount} />
              ) : (
                '-'
              )}
            </dd>
          </dl>
          <CartCheckoutActions checkoutUrl={cart?.checkoutUrl} />
          <p className="cart-disclaimer">
            Shipping and discounts calculated at checkout.
          </p>
        </div>
      )}
      {/* Fixed corner elements - desktop only */}
      <span className="cart-copyright">©Dare to Dream 2026. All rights reserved.</span>
      <div className="cart-payment-badges">
        <img src="/app/assets/icons/apple-pay-badge-1.svg" alt="Apple Pay" />
        <img src="/app/assets/icons/shop-pay-badge.svg" alt="Shop Pay" />
        <img src="/app/assets/icons/google-pay-badge-1.svg" alt="Google Pay" />
        <img src="/app/assets/icons/mastercard-badge-2.svg" alt="Mastercard" />
        <img src="/app/assets/icons/paypal-badge-1.svg" alt="PayPal" />
      </div>
    </div>
  );
}

function CartEmpty({
  layout,
}: {
  layout?: CartMainProps['layout'];
}) {
  const {close} = useAside();

  return (
    <div className="cart-empty-container">
      <div className="cart-empty">
        <p className="cart-empty-message">
          Your cart is empty
        </p>
        <Link 
          to="/collections/all" 
          onClick={close} 
          prefetch="viewport"
          className="cart-empty-button"
        >
          See all products
        </Link>
      </div>
    </div>
  );
}
