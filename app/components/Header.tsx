import {Suspense} from 'react';
import {Await, NavLink, useAsyncValue} from 'react-router';
import {
  type CartViewPayload,
  useAnalytics,
  useOptimisticCart,
} from '@shopify/hydrogen';
import type {HeaderQuery, CartApiQueryFragment} from 'storefrontapi.generated';
import {useAside} from '~/components/Aside';
import {useHeaderScroll} from '~/hooks/useHeaderScroll';
import {useTheme} from '~/contexts/ThemeContext';
import logoHorizontalWhite from '~/assets/logo-full-text-horizontal-white.svg';

interface HeaderProps {
  header: HeaderQuery;
  cart: Promise<CartApiQueryFragment | null>;
  isLoggedIn: Promise<boolean>;
  publicStoreDomain: string;
}

export function Header({
  header,
  isLoggedIn,
  cart,
  publicStoreDomain,
}: HeaderProps) {
  const headerRef = useHeaderScroll();

  return (
    <header ref={headerRef} className="header">
      <nav className="header-nav-left">
        <NavLink to="/community" className="header-nav-item">
          Community
        </NavLink>
        <NavLink to="/collections/all" className="header-nav-item">
          Shop
        </NavLink>
      </nav>

      <NavLink to="/" className="header-logo">
        <img src={logoHorizontalWhite} alt="Dare to Dream" className="header-logo-image" />
      </NavLink>

      <nav className="header-nav-right">
        <SearchToggle />
        <Suspense fallback="Account">
          <Await resolve={isLoggedIn} errorElement={<NavLink to="/account" className="header-nav-item">Account</NavLink>}>
            {(isLoggedIn) => (
              <NavLink to="/account" className="header-nav-item">
                Account
              </NavLink>
            )}
          </Await>
        </Suspense>
        <CartToggle cart={cart} />
      </nav>
    </header>
  );
}

function SearchToggle() {
  const {open} = useAside();
  return (
    <button className="header-nav-item reset" onClick={() => open('search')}>
      Search
    </button>
  );
}

function ThemeToggle() {
  const {theme, toggleTheme} = useTheme();
  return (
    <button 
      className="header-nav-item reset" 
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  );
}

function CartBadge({count}: {count: number | null}) {
  const {open} = useAside();
  const {publish, shop, cart, prevCart} = useAnalytics();

  return (
    <a
      href="/cart"
      className="header-nav-item"
      onClick={(e) => {
        e.preventDefault();
        open('cart');
        publish('cart_viewed', {
          cart,
          prevCart,
          shop,
          url: window.location.href || '',
        } as CartViewPayload);
      }}
    >
      Cart{count !== null && count > 0 ? ` (${count})` : ''}
    </a>
  );
}

function CartToggle({cart}: Pick<HeaderProps, 'cart'>) {
  return (
    <Suspense fallback={<CartBadge count={null} />}>
      <Await resolve={cart}>
        <CartBanner />
      </Await>
    </Suspense>
  );
}

function CartBanner() {
  const originalCart = useAsyncValue() as CartApiQueryFragment | null;
  const cart = useOptimisticCart(originalCart);
  return <CartBadge count={cart?.totalQuantity ?? 0} />;
}

// Keep HeaderMenu for mobile aside menu
export function HeaderMenu({
  menu,
  primaryDomainUrl,
  viewport,
  publicStoreDomain,
}: {
  menu: HeaderProps['header']['menu'];
  primaryDomainUrl: HeaderProps['header']['shop']['primaryDomain']['url'];
  viewport: 'desktop' | 'mobile';
  publicStoreDomain: HeaderProps['publicStoreDomain'];
}) {
  const className = `header-menu-${viewport}`;
  const {close} = useAside();

  return (
    <nav className={className} role="navigation">
      <NavLink
        className="header-menu-item"
        onClick={close}
        prefetch="intent"
        to="/collections/all"
      >
        Shop
      </NavLink>
      <NavLink
        className="header-menu-item"
        onClick={close}
        prefetch="intent"
        to="/community"
      >
        Community
      </NavLink>
    </nav>
  );
}
