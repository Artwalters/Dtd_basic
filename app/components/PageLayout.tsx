import {Await, Link} from 'react-router';
import {Suspense, useId, useRef, useEffect} from 'react';
import gsap from 'gsap';
import {CustomEase} from 'gsap/CustomEase';
import {useCursor} from '~/hooks/useCursor';

// Register GSAP plugins
gsap.registerPlugin(CustomEase);

// Create custom ease
CustomEase.create("menuEase", "M0,0 C0.126,0.382 0.29,0.669 0.44,0.822 0.613,0.998 0.818,1.001 1,1");
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

function SlidingWrapper({children}: {children: React.ReactNode}) {
  const {type, setIsAnimating} = useAside();
  const isMobileMenuOpen = type === 'mobile';
  const isCartOpen = type === 'cart';
  const wrapperRef = useRef<HTMLDivElement>(null);
  const scrollPosRef = useRef(0);
  const animationRef = useRef<gsap.core.Tween | null>(null);
  const wasCartOpenRef = useRef(false);
  const wasMobileMenuOpenRef = useRef(false);

  // Desktop cart animation
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
        duration: 2.5,
        ease: 'menuEase',
        onComplete: () => {
          // Re-enable buttons when animation completes
          setIsAnimating(false);
        },
      });
    } else if (wasCartOpenRef.current) {
      // Only animate close if cart was previously open
      wasCartOpenRef.current = false;

      // Keep styles during close animation
      document.body.style.background = 'var(--color-cream)';

      // Keep cart panel visible
      const cartPanel = document.querySelector('.desktop-cart-panel') as HTMLElement;
      if (cartPanel) {
        cartPanel.style.opacity = '1';
        cartPanel.style.visibility = 'visible';
      }

      // Keep header styled
      const header = document.querySelector('.header-wrapper') as HTMLElement;
      if (header) {
        header.style.color = 'var(--color-black)';
      }

      // Block buttons during animation
      setIsAnimating(true);

      // Animate back to closed state
      animationRef.current = gsap.to(wrapper, {
        scale: 1,
        x: '0%',
        y: '0%',
        borderRadius: '0px',
        duration: 2.5,
        ease: 'menuEase',
        onComplete: () => {
          // Re-enable buttons and reset
          setIsAnimating(false);
          gsap.set(wrapper, { clearProps: 'all' });
          document.body.style.background = '';
          if (cartPanel) {
            cartPanel.style.opacity = '';
            cartPanel.style.visibility = '';
          }
          if (header) {
            header.style.color = '';
          }
          window.scrollTo(0, scrollPosRef.current);
        },
      });
    }
  }, [isCartOpen, setIsAnimating]);

  // Mobile menu and cart animation
  useEffect(() => {
    if (!wrapperRef.current || typeof window === 'undefined') return;

    // Only use GSAP for mobile animations
    const mediaQuery = window.matchMedia('(max-width: 47.99em)');
    if (!mediaQuery.matches) return;

    const wrapper = wrapperRef.current;

    // Kill any running animation to prevent conflicts
    if (animationRef.current) {
      animationRef.current.kill();
    }

    if (isMobileMenuOpen) {
      wasMobileMenuOpenRef.current = true;

      // Block buttons during animation
      setIsAnimating(true);

      // Animate to open state - slide right
      animationRef.current = gsap.to(wrapper, {
        x: '100%',
        duration: 2.5,
        ease: 'menuEase',
        onComplete: () => {
          setIsAnimating(false);
        },
      });
    } else if (isCartOpen) {
      wasCartOpenRef.current = true;

      // Block buttons during animation
      setIsAnimating(true);

      // Animate to open state - slide left
      animationRef.current = gsap.to(wrapper, {
        x: '-100%',
        duration: 2.5,
        ease: 'menuEase',
        onComplete: () => {
          setIsAnimating(false);
        },
      });
    } else if (wasMobileMenuOpenRef.current || wasCartOpenRef.current) {
      const wasCart = wasCartOpenRef.current;
      const wasMenu = wasMobileMenuOpenRef.current;
      wasMobileMenuOpenRef.current = false;
      wasCartOpenRef.current = false;

      // Keep background cream during close animation
      document.body.style.background = 'var(--color-cream)';

      // Keep cart overlay visible during close animation
      const cartOverlay = document.querySelector('.overlay[data-aside-type="cart"]') as HTMLElement;
      if (wasCart && cartOverlay) {
        cartOverlay.style.opacity = '1';
        cartOverlay.style.visibility = 'visible';
      }

      // Keep mobile menu overlay visible during close animation
      const menuOverlay = document.querySelector('.overlay[data-aside-type="mobile"]') as HTMLElement;
      if (wasMenu && menuOverlay) {
        menuOverlay.style.opacity = '1';
        menuOverlay.style.visibility = 'visible';
      }

      // Block buttons during animation
      setIsAnimating(true);

      // Animate back to closed state
      animationRef.current = gsap.to(wrapper, {
        x: '0%',
        duration: 2.5,
        ease: 'menuEase',
        onComplete: () => {
          setIsAnimating(false);
          gsap.set(wrapper, { clearProps: 'all' });
          document.body.style.background = '';
          if (cartOverlay) {
            cartOverlay.style.opacity = '';
            cartOverlay.style.visibility = '';
          }
          if (menuOverlay) {
            menuOverlay.style.opacity = '';
            menuOverlay.style.visibility = '';
          }
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
