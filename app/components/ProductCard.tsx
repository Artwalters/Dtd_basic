import {Link, useFetcher} from 'react-router';
import type {CollectionItemFragment} from 'storefrontapi.generated';
import {Image, Money, CartForm} from '@shopify/hydrogen';
import {useAside} from './Aside';

interface ProductCardProps {
  product: CollectionItemFragment;
  isOpen?: boolean;
  onToggle?: () => void;
}

export function ProductCard({product, isOpen = false, onToggle}: ProductCardProps) {
  const fetcher = useFetcher();
  const {open: openAside} = useAside();

  // Get unique sizes from variants
  const variants = product.variants?.nodes || [];
  const uniqueSizes = new Map<string, {id: string; name: string; available: boolean}>();

  variants.forEach((variant) => {
    const sizeOption = variant.selectedOptions?.find(
      (opt) => opt.name.toLowerCase() === 'size'
    );
    const sizeName = sizeOption?.value || variant.title;

    // Only add if we haven't seen this size yet, or if this one is available
    if (!uniqueSizes.has(sizeName) || (variant.availableForSale && !uniqueSizes.get(sizeName)?.available)) {
      uniqueSizes.set(sizeName, {
        id: variant.id,
        name: sizeName,
        available: variant.availableForSale,
      });
    }
  });

  const sizeOptions = Array.from(uniqueSizes.values());

  const handlePlusClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggle?.();
  };

  const handleAddToCart = (variantId: string) => {
    // Close panel and open cart immediately
    onToggle?.();
    openAside('cart');

    const formData = new FormData();
    formData.append(
      'cartFormInput',
      JSON.stringify({
        action: CartForm.ACTIONS.LinesAdd,
        inputs: {
          lines: [{merchandiseId: variantId, quantity: 1}],
        },
      }),
    );
    formData.append('cartAction', 'LinesAdd');

    fetcher.submit(formData, {method: 'POST', action: '/cart'});
  };

  return (
    <Link
      to={`/products/${product.handle}`}
      className="new-drop-card"
    >
      {product.featuredImage && (
        <div className="new-drop-image-wrapper">
          <Image
            data={product.featuredImage}
            sizes="(min-width: 45em) 20vw, 40vw"
            className="new-drop-image"
          />

          {/* Size Selector Popup */}
          <div
            className={`size-selector ${isOpen ? 'size-selector-open' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <div
              className={`size-selector-content ${isOpen ? 'size-selector-content-open' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              {sizeOptions.map((size) => (
                <button
                  key={size.id}
                  className="size-option"
                  disabled={!size.available}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleAddToCart(size.id);
                  }}
                >
                  {size.name}
                  {!size.available && ' (Sold out)'}
                </button>
              ))}
            </div>
          </div>

          {/* Plus Button */}
          <button
            className="product-plus-btn"
            onClick={handlePlusClick}
            aria-label="Quick add"
          >
            <span className={`plus-icon ${isOpen ? 'plus-icon-rotated' : ''}`}>+</span>
          </button>
        </div>
      )}
      <div className="new-drop-info">
        <span className="new-drop-product-title">{product.title}</span>
        <Money
          data={product.priceRange.minVariantPrice}
          className="new-drop-price"
        />
      </div>
    </Link>
  );
}
