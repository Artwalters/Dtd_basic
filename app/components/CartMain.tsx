import {useOptimisticCart, Money, CartForm} from '@shopify/hydrogen';
import {Link, useFetchers} from 'react-router';
import type {CartApiQueryFragment} from 'storefrontapi.generated';
import {useAside} from '~/components/Aside';
import {CartLineItem} from '~/components/CartLineItem';
import {CartSummary, ShippingReturnsAccordion, CartCheckoutActions} from './CartSummary';
import {RecommendedProducts} from './RecommendedProducts';
import {useState} from 'react';

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
  // The useOptimisticCart hook applies pending actions to the cart
  // so the user immediately sees feedback when they modify the cart.
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
      <div className="cart-content-scrollable">
        <div className="cart-divider" />
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
            <ShippingReturnsAccordion />
          </div>
        )}
        <RecommendedProducts />
      </div>
      {cartHasItems && (
        <div className="cart-footer-sticky">
          <div className="cart-divider divider-bottom" />
          <dl className="cart-subtotal">
            <dt>Total*:</dt>
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
            * Shipping and discounts calculated at checkout.
          </p>
        </div>
      )}
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
