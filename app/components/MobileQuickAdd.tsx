import {useEffect, useState} from 'react';
import {createPortal} from 'react-dom';
import {useFetcher} from 'react-router';
import type {CollectionItemFragment} from 'storefrontapi.generated';
import {Image, Money, CartForm} from '@shopify/hydrogen';
import {useAside} from './Aside';
import {getLenis} from '~/hooks/useLenis';

interface MobileQuickAddProps {
  product: CollectionItemFragment;
  isOpen: boolean;
  onClose: () => void;
}

export function MobileQuickAdd({product, isOpen, onClose}: MobileQuickAddProps) {
  const fetcher = useFetcher();
  const {open: openAside} = useAside();
  const [mounted, setMounted] = useState(false);
  const [selectedSize, setSelectedSize] = useState<{id: string; name: string} | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Wait for client-side mount for portal
  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset selection when opening
  useEffect(() => {
    if (isOpen) {
      setSelectedSize(null);
      setShowSuccess(false);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  // Show success message when cart is updated (only if we submitted)
  useEffect(() => {
    if (isSubmitting && fetcher.state === 'idle') {
      setIsSubmitting(false);
      setShowSuccess(true);
      const timer = setTimeout(() => {
        setShowSuccess(false);
        onClose();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [fetcher.state, isSubmitting, onClose]);

  // Get variants and sizes
  const variants = product.variants?.nodes || [];
  const uniqueSizes = new Map<string, {id: string; name: string; available: boolean}>();

  // Extract just the size (S, M, L, XL, etc.) from values like "Boxy Fit S"
  const extractSize = (value: string): string => {
    // Match sizes including numeric prefixes (2XL, 3XL) and standard sizes
    const sizePattern = /\b(3XL|2XL|XXXL|XXL|XL|XXS|XS|S|M|L|\d+)\b/i;
    const match = value.match(sizePattern);
    return match ? match[1].toUpperCase() : value;
  };

  variants.forEach((variant) => {
    const sizeOption = variant.selectedOptions?.find(
      (opt) => opt.name.toLowerCase() === 'size'
    );
    const rawSize = sizeOption?.value || variant.title;
    const sizeName = extractSize(rawSize);

    if (!uniqueSizes.has(sizeName) || (variant.availableForSale && !uniqueSizes.get(sizeName)?.available)) {
      uniqueSizes.set(sizeName, {
        id: variant.id,
        name: sizeName,
        available: variant.availableForSale,
      });
    }
  });

  const sizeOptions = Array.from(uniqueSizes.values());
  const hasAvailableSizes = sizeOptions.some(size => size.available);

  // Get color info
  const uniqueColors = new Set<string>();
  variants.forEach((variant) => {
    const colorOption = variant.selectedOptions?.find(
      (opt) => opt.name.toLowerCase() === 'color' || opt.name.toLowerCase() === 'colour'
    );
    if (colorOption?.value) {
      uniqueColors.add(colorOption.value);
    }
  });
  const firstColor = uniqueColors.values().next().value || '';

  // Lock body scroll when open
  useEffect(() => {
    if (!isOpen) return;

    const lenis = getLenis();
    lenis?.stop();

    // Lock scroll on body
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';

    return () => {
      lenis?.start();
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, [isOpen]);

  const handleAddToCart = () => {
    if (!selectedSize) return;

    setIsSubmitting(true);

    const formData = new FormData();
    formData.append(
      'cartFormInput',
      JSON.stringify({
        action: CartForm.ACTIONS.LinesAdd,
        inputs: {
          lines: [{merchandiseId: selectedSize.id, quantity: 1}],
        },
      }),
    );
    formData.append('cartAction', 'LinesAdd');

    fetcher.submit(formData, {method: 'POST', action: '/cart'});
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Don't render on server
  if (!mounted) return null;

  const content = (
    <div
      className={`mobile-quick-add-backdrop ${isOpen ? 'mobile-quick-add-backdrop--open' : ''}`}
      onClick={handleBackdropClick}
    >
      <div className={`mobile-quick-add ${isOpen ? 'mobile-quick-add--open' : ''}`}>
        {/* Header */}
        <div className="mobile-quick-add__header">
          <h2 className="mobile-quick-add__title">Quick Add</h2>
          <button
            className="mobile-quick-add__close"
            onClick={onClose}
            aria-label="Close"
          >
            CLOSE
          </button>
        </div>

        {/* Divider with brackets */}
        <div className="mobile-quick-add__divider-bracket" />

        {/* Product Info */}
        <div className="mobile-quick-add__product">
          {product.featuredImage && (
            <div className="mobile-quick-add__image">
              <Image
                data={product.featuredImage}
                sizes="80px"
                className="mobile-quick-add__image-img"
              />
            </div>
          )}
          <div className="mobile-quick-add__info">
            <div className="mobile-quick-add__info-row">
              <h3 className="mobile-quick-add__product-title">{product.title}</h3>
              <Money
                data={product.priceRange.minVariantPrice}
                className="mobile-quick-add__price"
              />
            </div>
            {firstColor && (
              <span className="mobile-quick-add__color">{firstColor}</span>
            )}
          </div>
        </div>

        {/* Size Selector */}
        <div className="mobile-quick-add__sizes">
          <span className="mobile-quick-add__sizes-label">
            Size: {selectedSize ? selectedSize.name : (hasAvailableSizes ? 'Select' : 'Sold Out')}
          </span>
          <div className="mobile-quick-add__sizes-grid">
            {sizeOptions.map((size) => (
              <button
                key={size.id}
                className={`mobile-quick-add__size-btn ${!size.available ? 'mobile-quick-add__size-btn--disabled' : ''} ${selectedSize?.id === size.id ? 'mobile-quick-add__size-btn--selected' : ''}`}
                disabled={!size.available || fetcher.state !== 'idle'}
                onClick={() => setSelectedSize({id: size.id, name: size.name})}
              >
                {size.name}
              </button>
            ))}
          </div>
        </div>

        {/* Bottom divider with brackets */}
        <div className="mobile-quick-add__divider-bracket divider-bottom" />

        {/* Footer */}
        <div className="mobile-quick-add__footer">
          {showSuccess ? (
            <div className="mobile-quick-add__success">
              Added to cart
            </div>
          ) : fetcher.state !== 'idle' ? (
            <div className="mobile-quick-add__loading">
              <span className="mobile-quick-add__loader" />
            </div>
          ) : hasAvailableSizes ? (
            <button
              className={`btn mobile-quick-add__add-btn ${!selectedSize ? 'mobile-quick-add__add-btn--disabled' : ''}`}
              disabled={!selectedSize}
              onClick={handleAddToCart}
            >
              {selectedSize ? 'ADD TO CART' : 'SELECT A SIZE'}
            </button>
          ) : (
            <button className="btn mobile-quick-add__notify-btn">
              NOTIFY ME
            </button>
          )}
        </div>
      </div>
    </div>
  );

  // Use portal to render at body level, outside any Swiper containers
  return createPortal(content, document.body);
}
