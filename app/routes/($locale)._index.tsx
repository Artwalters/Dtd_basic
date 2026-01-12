import type {Route} from './+types/_index';
import {useLoaderData} from 'react-router';
import {getPaginationVariables} from '@shopify/hydrogen';
import {HeroSlider} from '~/components/HeroSlider';
import {NewDrop} from '~/components/NewDrop';
import {NewArrivals} from '~/components/NewArrivals';
import {CommunitySection} from '~/components/CommunitySection';
import type {CollectionItemFragment} from 'storefrontapi.generated';

// Hero slides data
const heroSlides = [
  {
    id: '1',
    backgroundImage: '/hero-bg.jpg',
    subtitle: 'our first collection',
    title: 'BE PART OF THE START',
    buttonText: 'SHOP NOW',
    buttonLink: '/collections/all'
  },
  {
    id: '2',
    backgroundImage: '/hero-bg.jpg',
    subtitle: 'new arrivals',
    title: 'FRESH STYLES DAILY',
    buttonText: 'DISCOVER',
    buttonLink: '/collections/new'
  },
  {
    id: '3',
    backgroundImage: '/hero-bg.jpg',
    subtitle: 'limited edition',
    title: 'EXCLUSIVE DROPS',
    buttonText: 'GET YOURS',
    buttonLink: '/collections/limited'
  }
];

export const meta: Route.MetaFunction = () => {
  return [{title: 'Dare to Dream'}];
};

export async function loader(args: Route.LoaderArgs) {
  const deferredData = loadDeferredData(args);
  const criticalData = await loadCriticalData(args);
  return {...deferredData, ...criticalData};
}

async function loadCriticalData({context, request}: Route.LoaderArgs) {
  const {storefront} = context;
  const paginationVariables = getPaginationVariables(request, {
    pageBy: 8,
  });

  const [{products}] = await Promise.all([
    storefront.query(CATALOG_QUERY, {
      variables: {...paginationVariables},
    }),
  ]);
  return {products};
}

function loadDeferredData({context}: Route.LoaderArgs) {
  return {};
}

export default function Homepage() {
  const {products} = useLoaderData<typeof loader>();

  return (
    <>
      <HeroSlider slides={heroSlides} />
      <NewDrop
        products={products.nodes}
        title="Genesis drop"
        featuredImage="/Img/new-drop-featured.jpg"
      />
      <NewArrivals
        products={products.nodes}
        title="New Arrivals"
      />
      <CommunitySection />
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
