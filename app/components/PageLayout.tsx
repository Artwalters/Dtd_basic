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

  useEffect(() => {
    if (!wrapperRef.current || typeof window === 'undefined') return;

    // Only use GSAP for desktop cart animation
    const mediaQuery = window.matchMedia('(min-width: 48em)');
    if (!mediaQuery.matches) return;

    const wrapper = wrapperRef.current;

    if (isCartOpen && !prevCartOpenRef.current) {
      // Opening cart: set height first, then animate
      gsap.set(wrapper, { height: '100vh', overflow: 'hidden' });
      gsap.to(wrapper, {
        scale: 0.85,
        x: '-15%',
        borderRadius: '8px',
        boxShadow: '0 25px 100px rgba(0, 0, 0, 0.2)',
        duration: 0.5,
        ease: 'power2.out',
      });
    } else if (!isCartOpen && prevCartOpenRef.current) {
      // Closing cart: animate first, then reset height
      gsap.to(wrapper, {
        scale: 1,
        x: '0%',
        borderRadius: '0px',
        boxShadow: 'none',
        duration: 0.5,
        ease: 'power2.out',
        onComplete: () => {
          gsap.set(wrapper, { height: 'auto', overflow: 'visible', clearProps: 'all' });
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
