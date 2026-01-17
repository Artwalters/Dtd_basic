import {Link} from 'react-router';
import {Image, Money} from '@shopify/hydrogen';
import type {
  ProductItemFragment,
  CollectionItemFragment,
  RecommendedProductFragment,
} from 'storefrontapi.generated';
import {useVariantUrl} from '~/lib/variants';

export function ProductItem({
  product,
  loading,
}: {
  product:
    | CollectionItemFragment
    | ProductItemFragment
    | RecommendedProductFragment;
  loading?: 'eager' | 'lazy';
}) {
  const variantUrl = useVariantUrl(product.handle);
  const image = product.featuredImage;

  // Get tags for display (cast to any to access fields not in generated types)
  const productData = product as any;
  const tags: string[] = productData.tags || [];

  // Check if product has "new" tag
  const isNew = tags.some((tag: string) => tag.toLowerCase() === 'new');

  // Get product type from tags (first tag that's not "new")
  const productTypeTag = tags.find((tag: string) => tag.toLowerCase() !== 'new') || null;

  return (
    <Link
      className="product-item"
      key={product.id}
      prefetch="intent"
      to={variantUrl}
    >
      <div className="product-item-image-wrapper">
        {image && (
          <Image
            alt={image.altText || product.title}
            aspectRatio="1/1"
            data={image}
            loading={loading}
            sizes="(min-width: 45em) 400px, 100vw"
          />
        )}
        {(isNew || productTypeTag) && (
          <div className="product-item-tags">
            {isNew && <span className="product-item-tag btn btn-glass">New</span>}
            {productTypeTag && <span className="product-item-tag btn btn-glass">{productTypeTag}</span>}
          </div>
        )}
      </div>
      <div className="product-item-info">
        <h4>{product.title}</h4>
        {productData.variants?.nodes?.[0]?.title && productData.variants.nodes[0].title !== 'Default Title' && (
          <p className="product-item-variant">{productData.variants.nodes[0].title}</p>
        )}
        <small>
          <Money data={product.priceRange.minVariantPrice} />
        </small>
      </div>
    </Link>
  );
}
