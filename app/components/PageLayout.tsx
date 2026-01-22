import {Await, Link} from 'react-router';
import {Suspense, useId, useRef, useEffect} from 'react';
import gsap from 'gsap';
import {useCursor} from '~/hooks/useCursor';
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
                  return `Your cart${count > 0 ? ` (${count})` : ''}`;
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

function SlidingWrapper({children}: {children: React.ReactNode}) {
  const {type, setIsAnimating} = useAside();
  const isMobileMenuOpen = type === 'mobile';
  const isCartOpen = type === 'cart';
  const wrapperRef = useRef<HTMLDivElement>(null);
  const scrollPosRef = useRef(0);
  const animationRef = useRef<gsap.core.Tween | null>(null);
  const wasCartOpenRef = useRef(false);

  useEffect(() => {
    if (!wrapperRef.current || typeof window === 'undefined') return;

    // Only use GSAP for desktop cart animation
    const mediaQuery = window.matchMedia('(min-width: 48em)');
    if (!mediaQuery.matches) return;

    const wrapper = wrapperRef.current;

    // Kill any running animation to prevent conflicts
    if (animationRef.current) {
      animationRef.current.kill();
    }

    if (isCartOpen) {
      // Only save scroll position on fresh open
      if (!wasCartOpenRef.current) {
        scrollPosRef.current = window.scrollY;
      }

      // Set up the wrapper as a fixed viewport-sized frame
      gsap.set(wrapper, {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        transformOrigin: 'left center',
      });

      // Set scrollTop to maintain the same visible content (only on fresh open)
      if (!wasCartOpenRef.current) {
        wrapper.scrollTop = scrollPosRef.current;
      }

      wasCartOpenRef.current = true;

      // Block buttons during animation
      setIsAnimating(true);

      // Animate to open state
      animationRef.current = gsap.to(wrapper, {
        scale: 0.65,
        x: '1em',
        y: '7.5%',
        borderRadius: '12px',
        duration: 0.5,
        ease: 'power2.out',
        onComplete: () => {
          // Re-enable buttons when animation completes
          setIsAnimating(false);
        },
      });
    } else if (wasCartOpenRef.current) {
      // Only animate close if cart was previously open
      wasCartOpenRef.current = false;

      // Block buttons during animation
      setIsAnimating(true);

      // Animate back to closed state
      animationRef.current = gsap.to(wrapper, {
        scale: 1,
        x: '0%',
        y: '0%',
        borderRadius: '0px',
        duration: 0.5,
        ease: 'power2.out',
        onComplete: () => {
          // Re-enable buttons and reset
          setIsAnimating(false);
          gsap.set(wrapper, { clearProps: 'all' });
          window.scrollTo(0, scrollPosRef.current);
        },
      });
    }
  }, [isCartOpen, setIsAnimating]);

  // For mobile, still use CSS classes
  const mobileClasses = isMobileMenuOpen ? 'mobile-menu-open' : '';

  return (
    <div
      ref={wrapperRef}
      className={`sliding-wrapper ${mobileClasses}`}
      data-cart-open={isCartOpen}
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
            return `Your cart${count > 0 ? ` (${count})` : ''}`;
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
