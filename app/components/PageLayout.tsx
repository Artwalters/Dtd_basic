import {Await, Link} from 'react-router';
import {Suspense, useId, useRef, useEffect} from 'react';
import gsap from 'gsap';
import {CustomEase} from 'gsap/CustomEase';
import {useCursor} from '~/hooks/useCursor';

// Register GSAP plugins
gsap.registerPlugin(CustomEase);

// Create custom eases
// Original ease - smooth S-curve
CustomEase.create("menuEase", "M0,0 C0.126,0.382 0.29,0.669 0.44,0.822 0.613,0.998 0.818,1.001 1,1");
// Fast start, slow end (ease-out style)
CustomEase.create("menuEaseOut", "M0,0 C0.25,0.46 0.45,0.94 0.65,0.98 0.85,1 1,1 1,1");
import type {
  CartApiQueryFragment,
  HeaderQuery,
} from 'storefrontapi.generated';
import {Aside, useAside} from '~/components/Aside';
import {Header, HeaderMenu} from '~/components/Header';
import {CartMain} from '~/components/CartMain';
import {
  SEARCH_ENDPOINT,
  SearchFormPredictive,
} from '~/components/SearchFormPredictive';
import {SearchResultsPredictive} from '~/components/SearchResultsPredictive';

interface PageLayoutProps {
  cart: Promise<CartApiQueryFragment | null>;
  header: HeaderQuery;
  isLoggedIn: Promise<boolean>;
  publicStoreDomain: string;
  children?: React.ReactNode;
}

export function PageLayout({
  cart,
  children = null,
  header,
  isLoggedIn,
  publicStoreDomain,
}: PageLayoutProps) {
  const cursorRef = useCursor();

  return (
    <Aside.Provider>
      <CartAside cart={cart} />
      <SearchAside />
      <MobileMenuAside header={header} publicStoreDomain={publicStoreDomain} />
      {/* Header stays fixed, outside of sliding content */}
      {header && (
        <Header
          header={header}
          cart={cart}
          isLoggedIn={isLoggedIn}
          publicStoreDomain={publicStoreDomain}
        />
      )}
      {/* Main content area with sliding page and desktop cart */}
      <MainContentArea cart={cart}>
        <PageContent>{children}</PageContent>
      </MainContentArea>
      {/* Custom cursor tooltip */}
      <div className="cursor" ref={cursorRef}>
        <p></p>
      </div>
    </Aside.Provider>
  );
}

function MainContentArea({children, cart}: {children: React.ReactNode, cart: PageLayoutProps['cart']}) {
  const {type, close} = useAside();
  const isCartOpen = type === 'cart';
  const isMobileMenuOpen = type === 'mobile';

  return (
    <div className="main-content-area" data-cart-open={isCartOpen} data-menu-open={isMobileMenuOpen}>
      <SlidingWrapper>{children}</SlidingWrapper>
      {/* Blocking overlay - closes menu/cart when clicked */}
      <button
        className="sliding-wrapper-overlay"
        onClick={close}
        aria-label="Close menu"
      />
      {/* Desktop cart - rendered next to the page, not as overlay */}
      <div className="desktop-cart-panel">
        <header className="desktop-cart-header">
          <h3>
            <Suspense fallback="Your cart">
              <Await resolve={cart}>
                {(cart) => {
                  const count = cart?.totalQuantity || 0;
                  return count > 0 ? `${count} ${count === 1 ? 'item' : 'items'}` : 'Your cart';
                }}
              </Await>
            </Suspense>
          </h3>
          <button className="desktop-cart-close" onClick={close} aria-label="Close cart">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </header>
        <Suspense fallback={<p>Loading cart ...</p>}>
          <Await resolve={cart}>
            {(cart) => <CartMain cart={cart} layout="aside" />}
          </Await>
        </Suspense>
      </div>
    </div>
  );
}

// Helper to set wrapper as fixed viewport
function setFixedViewport(wrapper: HTMLElement, transformOrigin: string) {
  gsap.set(wrapper, {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    overflow: 'hidden',
    transformOrigin,
  });
}

// Helper to reset inline styles after animation
function resetStyles(elements: {el: HTMLElement | null, props: string[]}[]) {
  elements.forEach(({el, props}) => {
    if (el) props.forEach(prop => (el.style as any)[prop] = '');
  });
}

function SlidingWrapper({children}: {children: React.ReactNode}) {
  const {type, setIsAnimating} = useAside();
  const isMobileMenuOpen = type === 'mobile';
  const isCartOpen = type === 'cart';
  const wrapperRef = useRef<HTMLDivElement>(null);
  const scrollPosRef = useRef(0);
  const animationRef = useRef<gsap.core.Tween | null>(null);
  const wasCartOpenRef = useRef(false);
  const wasMobileMenuOpenRef = useRef(false);
  const isNavigatingRef = useRef(false);

  // Listen for menu navigation event (dispatched when clicking menu links)
  useEffect(() => {
    const handleMenuNavigation = () => { isNavigatingRef.current = true; };
    window.addEventListener('menuNavigation', handleMenuNavigation);
    return () => window.removeEventListener('menuNavigation', handleMenuNavigation);
  }, []);

  // Kill animation helper
  const killAnimation = () => {
    if (animationRef.current) {
      animationRef.current.kill();
      setIsAnimating(false);
    }
  };

  // Save scroll position on fresh open
  const saveScrollOnFreshOpen = (wasOpenRef: React.MutableRefObject<boolean>) => {
    if (!wasOpenRef.current) {
      scrollPosRef.current = window.scrollY;
    }
  };

  // Desktop cart animation
  useEffect(() => {
    if (!wrapperRef.current || typeof window === 'undefined') return;
    if (!window.matchMedia('(min-width: 48em)').matches) return;

    const wrapper = wrapperRef.current;
    killAnimation();

    if (isCartOpen) {
      saveScrollOnFreshOpen(wasCartOpenRef);
      setFixedViewport(wrapper, 'left center');
      if (!wasCartOpenRef.current) wrapper.scrollTop = scrollPosRef.current;
      wasCartOpenRef.current = true;
      setIsAnimating(true);

      animationRef.current = gsap.to(wrapper, {
        scale: 0.65, x: '1em', y: '7.5%', borderRadius: '12px',
        duration: 1.5, ease: 'power3.out',
        onComplete: () => setIsAnimating(false),
      });
    } else if (wasCartOpenRef.current) {
      wasCartOpenRef.current = false;
      const navigating = isNavigatingRef.current;
      isNavigatingRef.current = false;
      if (navigating) wrapper.scrollTop = 0;

      // Keep elements visible during close
      document.body.style.background = 'var(--color-cream)';
      const cartPanel = document.querySelector('.desktop-cart-panel') as HTMLElement;
      const header = document.querySelector('.header-wrapper') as HTMLElement;
      if (cartPanel) { cartPanel.style.opacity = '1'; cartPanel.style.visibility = 'visible'; }
      if (header) header.style.color = 'var(--color-black)';

      setIsAnimating(true);
      animationRef.current = gsap.to(wrapper, {
        scale: 1, x: '0%', y: '0%', borderRadius: '0px',
        duration: 1.5, ease: 'power3.out',
        onComplete: () => {
          setIsAnimating(false);
          gsap.set(wrapper, { clearProps: 'all' });
          resetStyles([
            {el: document.body, props: ['background']},
            {el: cartPanel, props: ['opacity', 'visibility']},
            {el: header, props: ['color']},
          ]);
          window.scrollTo(0, navigating ? 0 : scrollPosRef.current);
        },
      });
    }
  }, [isCartOpen, setIsAnimating]);

  // Mobile menu and cart animation
  useEffect(() => {
    if (!wrapperRef.current || typeof window === 'undefined') return;
    if (!window.matchMedia('(max-width: 47.99em)').matches) return;

    const wrapper = wrapperRef.current;
    killAnimation();

    if (isMobileMenuOpen || isCartOpen) {
      // Mobile menu or cart opening - same animation for both
      const wasOpenRef = isMobileMenuOpen ? wasMobileMenuOpenRef : wasCartOpenRef;
      saveScrollOnFreshOpen(wasOpenRef);
      setFixedViewport(wrapper, 'center top');
      if (!wasOpenRef.current) wrapper.scrollTop = scrollPosRef.current;
      wasOpenRef.current = true;
      setIsAnimating(true);

      animationRef.current = gsap.to(wrapper, {
        y: '100vh', scale: 0.95, borderRadius: '12px',
        duration: 1.5, ease: 'power3.out',
        onComplete: () => setIsAnimating(false),
      });
    } else if (wasMobileMenuOpenRef.current || wasCartOpenRef.current) {
      // Closing menu or cart
      const wasCart = wasCartOpenRef.current;
      const wasMenu = wasMobileMenuOpenRef.current;
      wasMobileMenuOpenRef.current = false;
      wasCartOpenRef.current = false;

      const navigating = isNavigatingRef.current;
      isNavigatingRef.current = false;
      if (navigating) wrapper.scrollTop = 0;

      // Keep overlays visible during close
      document.body.style.background = 'var(--color-cream)';
      const cartOverlay = document.querySelector('.overlay[data-aside-type="cart"]') as HTMLElement;
      const menuOverlay = document.querySelector('.overlay[data-aside-type="mobile"]') as HTMLElement;
      if (wasCart && cartOverlay) { cartOverlay.style.opacity = '1'; cartOverlay.style.visibility = 'visible'; }
      if (wasMenu && menuOverlay) { menuOverlay.style.opacity = '1'; menuOverlay.style.visibility = 'visible'; }

      setIsAnimating(true);
      // Both menu and cart use the same animation
      animationRef.current = gsap.to(wrapper, {
        y: '0%', scale: 1, borderRadius: '0px', duration: 1.5, ease: 'power3.out',
        onComplete: () => {
          setIsAnimating(false);
          gsap.set(wrapper, { clearProps: 'all' });
          resetStyles([
            {el: document.body, props: ['background']},
            {el: cartOverlay, props: ['opacity', 'visibility']},
            {el: menuOverlay, props: ['opacity', 'visibility']},
          ]);
          window.scrollTo(0, navigating ? 0 : scrollPosRef.current);
        },
      });
    }
  }, [isMobileMenuOpen, isCartOpen, setIsAnimating]);

  return (
    <div
      ref={wrapperRef}
      className="sliding-wrapper"
      data-cart-open={isCartOpen}
      data-menu-open={isMobileMenuOpen}
    >
      {children}
    </div>
  );
}

function PageContent({children}: {children: React.ReactNode}) {
  return (
    <div className="page-content">
      <main>{children}</main>
    </div>
  );
}

function CartAside({cart}: {cart: PageLayoutProps['cart']}) {
  return (
    <Aside type="cart" heading={(
      <Suspense fallback="Your cart">
        <Await resolve={cart}>
          {(cart) => {
            const count = cart?.totalQuantity || 0;
            return count > 0 ? `${count} ${count === 1 ? 'item' : 'items'}` : 'Your cart';
          }}
        </Await>
      </Suspense>
    )}>
      <Suspense fallback={<p>Loading cart ...</p>}>
        <Await resolve={cart}>
          {(cart) => {
            return <CartMain cart={cart} layout="aside" />;
          }}
        </Await>
      </Suspense>
    </Aside>
  );
}

function SearchAside() {
  const queriesDatalistId = useId();
  return (
    <Aside type="search" heading="SEARCH">
      <div className="predictive-search">
        <br />
        <SearchFormPredictive>
          {({fetchResults, goToSearch, inputRef}) => (
            <>
              <input
                name="q"
                onChange={fetchResults}
                onFocus={fetchResults}
                placeholder="Search"
                ref={inputRef}
                type="search"
                list={queriesDatalistId}
              />
              &nbsp;
              <button onClick={goToSearch}>Search</button>
            </>
          )}
        </SearchFormPredictive>

        <SearchResultsPredictive>
          {({items, total, term, state, closeSearch}) => {
            const {articles, collections, pages, products, queries} = items;

            if (state === 'loading' && term.current) {
              return <div>Loading...</div>;
            }

            if (!total) {
              return <SearchResultsPredictive.Empty term={term} />;
            }

            return (
              <>
                <SearchResultsPredictive.Queries
                  queries={queries}
                  queriesDatalistId={queriesDatalistId}
                />
                <SearchResultsPredictive.Products
                  products={products}
                  closeSearch={closeSearch}
                  term={term}
                />
                <SearchResultsPredictive.Collections
                  collections={collections}
                  closeSearch={closeSearch}
                  term={term}
                />
                <SearchResultsPredictive.Pages
                  pages={pages}
                  closeSearch={closeSearch}
                  term={term}
                />
                <SearchResultsPredictive.Articles
                  articles={articles}
                  closeSearch={closeSearch}
                  term={term}
                />
                {term.current && total ? (
                  <Link
                    onClick={closeSearch}
                    to={`${SEARCH_ENDPOINT}?q=${term.current}`}
                  >
                    <p>
                      View all results for <q>{term.current}</q>
                      &nbsp; →
                    </p>
                  </Link>
                ) : null}
              </>
            );
          }}
        </SearchResultsPredictive>
      </div>
    </Aside>
  );
}

function MobileMenuAside({
  header,
  publicStoreDomain,
}: {
  header: PageLayoutProps['header'];
  publicStoreDomain: PageLayoutProps['publicStoreDomain'];
}) {
  return (
    header.menu &&
    header.shop.primaryDomain?.url && (
      <Aside type="mobile" heading="MENU">
        <HeaderMenu
          menu={header.menu}
          viewport="mobile"
          primaryDomainUrl={header.shop.primaryDomain.url}
          publicStoreDomain={publicStoreDomain}
        />
      </Aside>
    )
  );
}
