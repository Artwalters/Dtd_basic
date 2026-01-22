import {useState, useEffect} from 'react';
import {Link, useFetcher} from 'react-router';
import type {CollectionItemFragment} from 'storefrontapi.generated';
import {Image, Money, CartForm} from '@shopify/hydrogen';
import {useAside} from './Aside';
import {MobileQuickAdd} from './MobileQuickAdd';

interface ProductCardProps {
  product: CollectionItemFragment;
  isOpen?: boolean;
  onToggle?: () => void;
}

export function ProductCard({product, isOpen = false, onToggle}: ProductCardProps) {
  const fetcher = useFetcher();
  const {open: openAside} = useAside();
  const [isMobile, setIsMobile] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Show success message when cart is updated (only if we submitted)
  useEffect(() => {
    if (isSubmitting && fetcher.state === 'idle') {
      setIsSubmitting(false);
      setShowSuccess(true);
    }
  }, [fetcher.state, isSubmitting]);

  // Auto-hide success message after 2 seconds
  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => setShowSuccess(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [showSuccess]);

  // Get tags for display (cast to any to access fields not in generated types)
  const productData = product as any;
  const tags: string[] = productData.tags || [];

  // Check if product has "new" tag
  const isNew = tags.some((tag: string) => tag.toLowerCase() === 'new');

  // Get product type from tags (first tag that's not "new")
  const productTypeTag = tags.find((tag: string) => tag.toLowerCase() !== 'new') || null;

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

  // Get unique colors from variants
  const uniqueColors = new Set<string>();
  variants.forEach((variant) => {
    const colorOption = variant.selectedOptions?.find(
      (opt) => opt.name.toLowerCase() === 'color' || opt.name.toLowerCase() === 'colour'
    );
    if (colorOption?.value) {
      uniqueColors.add(colorOption.value);
    }
  });
  const colorCount = uniqueColors.size;
  const firstColor = uniqueColors.values().next().value || '';

  const handlePlusClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggle?.();
  };

  const handleAddToCart = (variantId: string) => {
    // Close panel
    onToggle?.();
    setIsSubmitting(true);

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
    <>
      <Link
        to={`/products/${product.handle}`}
        className="new-drop-card"
        data-cursor="more details"
        data-cursor-delayed
      >
        {product.featuredImage && (
          <div className="new-drop-image-wrapper">
            <Image
              data={product.featuredImage}
              sizes="(min-width: 45em) 20vw, 40vw"
              className="new-drop-image"
            />

            {/* Product Tags */}
            {(isNew || productTypeTag) && (
              <div className="product-item-tags">
                {isNew && <span className="product-item-tag btn btn-glass">New</span>}
                {productTypeTag && <span className="product-item-tag btn btn-glass">{productTypeTag}</span>}
              </div>
            )}

            {/* Quick Add Hover Zone */}
            {!isMobile && (
              <div
                className="quick-add-zone"
                onMouseEnter={() => {
                  window.dispatchEvent(new CustomEvent('quickadd-open'));
                  if (!isOpen && !showSuccess && fetcher.state === 'idle') {
                    onToggle?.();
                  }
                }}
                onMouseLeave={() => isOpen && onToggle?.()}
              >
                {/* Loading State */}
                {fetcher.state !== 'idle' && (
                  <div className="quick-add-status">
                    <span className="quick-add-loader" />
                  </div>
                )}

                {/* Success Message */}
                {showSuccess && fetcher.state === 'idle' && (
                  <div className="quick-add-status quick-add-status--success">
                    Added to cart
                  </div>
                )}

                {/* Desktop Size Selector Popup */}
                {isOpen && !showSuccess && fetcher.state === 'idle' && (
                  <div
                    className="size-selector size-selector-open"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                  >
                    <div
                      className="size-selector-content size-selector-content-open"
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
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Plus Button - hide during loading/success */}
                {fetcher.state === 'idle' && !showSuccess && (
                  <button
                    className="product-plus-btn"
                    onClick={handlePlusClick}
                    aria-label="Quick add"
                  >
                    <span className={`plus-icon ${isOpen ? 'plus-icon-rotated' : ''}`} />
                  </button>
                )}
              </div>
            )}

            {/* Mobile Plus Button */}
            {isMobile && (
              <button
                className="product-plus-btn"
                onClick={handlePlusClick}
                aria-label="Quick add"
              >
                <span className="plus-icon" />
              </button>
            )}
          </div>
        )}
        <div className="new-drop-info">
          <div className="new-drop-info-row">
            <span className="new-drop-product-title">{product.title}</span>
            <Money
              data={product.priceRange.minVariantPrice}
              className="new-drop-price"
            />
          </div>
          {colorCount > 0 && (
            <span className="new-drop-product-meta">
              {firstColor}{colorCount > 1 ? `  ${colorCount} Colours` : ''}
            </span>
          )}
        </div>
      </Link>

      {/* Mobile Quick Add Bottom Sheet */}
      {isMobile && (
        <MobileQuickAdd
          product={product}
          isOpen={isOpen}
          onClose={() => onToggle?.()}
        />
      )}
    </>
  );
}
