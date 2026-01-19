import {Await, Link} from 'react-router';
import {Suspense, useId, useRef, useEffect} from 'react';
import gsap from 'gsap';
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
      {/* Only page content slides */}
      <SlidingWrapper>
        <PageContent>{children}</PageContent>
      </SlidingWrapper>
    </Aside.Provider>
  );
}

function SlidingWrapper({children}: {children: React.ReactNode}) {
  const {type} = useAside();
  const isMobileMenuOpen = type === 'mobile';
  const isCartOpen = type === 'cart';
  const wrapperRef = useRef<HTMLDivElement>(null);
  const prevCartOpenRef = useRef(false);
  const scrollPosRef = useRef(0);
  const animationRef = useRef<gsap.core.Tween | null>(null);

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

    if (isCartOpen && !prevCartOpenRef.current) {
      // Save scroll position before opening
      scrollPosRef.current = window.scrollY;

      // Set up the wrapper as a fixed viewport-sized frame
      // This clips the content to only show what was visible
      gsap.set(wrapper, {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        overflowY: 'scroll',
        transformOrigin: 'left center',
      });

      // Set scrollTop to maintain the same visible content
      wrapper.scrollTop = scrollPosRef.current;

      // Hide scrollbar after positioning
      gsap.set(wrapper, { overflow: 'hidden' });

      // Always animate to the same fixed end position
      animationRef.current = gsap.to(wrapper, {
        scale: 0.85,
        x: '5%',
        y: '7.5%',
        borderRadius: '12px',
        boxShadow: '0 25px 100px rgba(0, 0, 0, 0.25)',
        duration: 0.5,
        ease: 'power2.out',
      });
    } else if (!isCartOpen && prevCartOpenRef.current) {
      // Closing cart: animate back to original state
      animationRef.current = gsap.to(wrapper, {
        scale: 1,
        x: '0%',
        y: '0%',
        borderRadius: '0px',
        boxShadow: 'none',
        duration: 0.5,
        ease: 'power2.out',
        onComplete: () => {
          // Reset all properties and restore scroll
          gsap.set(wrapper, { clearProps: 'all' });
          window.scrollTo(0, scrollPosRef.current);
        },
      });
    }

    prevCartOpenRef.current = isCartOpen;
  }, [isCartOpen]);

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
