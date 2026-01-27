import {useState, useEffect, useRef} from 'react';
import type {Route} from './+types/collections.all';
import {useLoaderData} from 'react-router';
import {getPaginationVariables} from '@shopify/hydrogen';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import filterIcon from '~/assets/icons/filter.svg';
import {PaginatedResourceSection} from '~/components/PaginatedResourceSection';
import {ProductCard} from '~/components/ProductCard';
import {Footer} from '~/components/Footer';
import {FooterParallax} from '~/components/FooterReveal';
import {getLenis} from '~/hooks/useLenis';
import type {CollectionItemFragment} from 'storefrontapi.generated';

const filterOptions = [
  {id: 'all', label: 'All Products', terms: []},
  {id: 'shirts', label: 'Shirts', terms: ['shirt', 'tee', 't-shirt']},
  {id: 'joggers', label: 'Joggers', terms: ['jogger', 'joggers', 'pants', 'sweatpants']},
];

export const meta: Route.MetaFunction = () => {
  return [{title: `Dare to Dream | All Products`}];
};

export async function loader(args: Route.LoaderArgs) {
  const criticalData = await loadCriticalData(args);
  return {...criticalData};
}

async function loadCriticalData({context, request}: Route.LoaderArgs) {
  const {storefront} = context;
  const paginationVariables = getPaginationVariables(request, {
    pageBy: 12,
  });

  const [{products}] = await Promise.all([
    storefront.query(CATALOG_QUERY, {
      variables: {...paginationVariables},
    }),
  ]);
  return {products};
}

export default function Collection() {
  const {products} = useLoaderData<typeof loader>();
  const [openProductId, setOpenProductId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const sectionRef = useRef<HTMLElement>(null);

  const handleToggle = (productId: string) => {
    setOpenProductId(openProductId === productId ? null : productId);
  };

  const handleFilterClick = (filterId: string) => {
    setActiveFilter(filterId);

    // Scroll to top of section
    const section = sectionRef.current;
    if (section) {
      const lenis = getLenis();
      if (lenis) {
        lenis.scrollTo(section, { offset: -100 });
      } else {
        section.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  // Listen for closeQuickAdd event from header nav clicks
  useEffect(() => {
    const handleCloseQuickAdd = () => {
      setOpenProductId(null);
    };
    window.addEventListener('closeQuickAdd', handleCloseQuickAdd);
    return () => window.removeEventListener('closeQuickAdd', handleCloseQuickAdd);
  }, []);

  // Refresh ScrollTrigger when filter changes (page height may change)
  const isFirstRender = useRef(true);
  useEffect(() => {
    // Skip on initial render
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // Wait for DOM to update and Lenis scroll to complete, then refresh ScrollTrigger
    const timeoutId = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 800);

    return () => clearTimeout(timeoutId);
  }, [activeFilter]);

  // Filter products based on active filter
  const activeFilterOption = filterOptions.find(f => f.id === activeFilter);
  const filterTerms = activeFilterOption?.terms || [];

  const filteredProducts = activeFilter === 'all'
    ? products.nodes
    : products.nodes?.filter((product) => {
        const title = product.title.toLowerCase();
        const tags = product.tags?.map((tag: string) => tag.toLowerCase()) || [];
        const productType = (product as any).productType?.toLowerCase() || '';

        // Check if any filter term matches title, tags, or productType
        return filterTerms.some(term =>
          title.includes(term) ||
          tags.some((tag: string) => tag.includes(term)) ||
          productType.includes(term)
        );
      });

  const totalProducts = filteredProducts?.length || 0;

  // Convert number to circled Unicode character
  const getCircledNumber = (num: number): string => {
    if (num >= 1 && num <= 20) {
      return String.fromCodePoint(0x2460 + num - 1);
    } else if (num >= 21 && num <= 35) {
      return String.fromCodePoint(0x3251 + num - 21);
    } else if (num >= 36 && num <= 50) {
      return String.fromCodePoint(0x32B1 + num - 36);
    }
    return `(${num})`;
  };

  return (
    <>
      <section className="shop-page" ref={sectionRef}>
        <div className="section-divider" />
        <div className="shop-page-header">
          <span className="shop-page-title">
            {filterOptions.find(f => f.id === activeFilter)?.label || 'All Products'}
          </span>
          <span className="shop-page-count">{totalProducts} {totalProducts === 1 ? 'product' : 'products'}</span>
        </div>

        {activeFilter === 'all' ? (
          <PaginatedResourceSection<CollectionItemFragment>
            connection={products}
            resourcesClassName="shop-page-grid"
          >
            {({node: product}) => (
              <ProductCard
                key={product.id}
                product={product}
                isOpen={openProductId === product.id}
                onToggle={() => handleToggle(product.id)}
              />
            )}
          </PaginatedResourceSection>
        ) : (
          <div className="shop-page-grid">
            {filteredProducts?.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                isOpen={openProductId === product.id}
                onToggle={() => handleToggle(product.id)}
              />
            ))}
            {filteredProducts?.length === 0 && (
              <p className="shop-no-results">No products found</p>
            )}
          </div>
        )}

        {/* Filter Bar */}
        <div className="shop-filter-bar">
          <div className="shop-filter-bar__inner">
            <img src={filterIcon} alt="" className="shop-filter-bar__icon" />
            {filterOptions.map((filter) => (
              <button
                key={filter.id}
                className={`shop-filter-bar__btn ${activeFilter === filter.id ? 'active' : ''}`}
                onClick={() => handleFilterClick(filter.id)}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </section>
      <Footer />
      <FooterParallax />
    </>
  );
}

const COLLECTION_ITEM_FRAGMENT = `#graphql
  fragment MoneyCollectionItem on MoneyV2 {
    amount
    currencyCode
  }
  fragment CollectionItem on Product {
    id
    handle
    title
    tags
    productType
    featuredImage {
      id
      altText
      url
      width
      height
    }
    priceRange {
      minVariantPrice {
        ...MoneyCollectionItem
      }
      maxVariantPrice {
        ...MoneyCollectionItem
      }
    }
    pasvorm: metafield(namespace: "custom", key: "pasvorm") {
      value
    }
    pasvormShopify: metafield(namespace: "shopify", key: "pasvorm") {
      value
    }
    productVideo360: metafield(namespace: "custom", key: "productvideo360") {
      value
    }
    variants(first: 10) {
      nodes {
        id
        title
        availableForSale
        selectedOptions {
          name
          value
        }
      }
    }
  }
` as const;

// NOTE: https://shopify.dev/docs/api/storefront/latest/objects/product
const CATALOG_QUERY = `#graphql
  query Catalog(
    $country: CountryCode
    $language: LanguageCode
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
  ) @inContext(country: $country, language: $language) {
    products(first: $first, last: $last, before: $startCursor, after: $endCursor) {
      nodes {
        ...CollectionItem
      }
      pageInfo {
        hasPreviousPage
        hasNextPage
        startCursor
        endCursor
      }
    }
  }
  ${COLLECTION_ITEM_FRAGMENT}
` as const;
