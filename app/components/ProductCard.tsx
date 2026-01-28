import {useState, useEffect, useRef, useCallback} from 'react';
import {Link, useFetcher} from 'react-router';
import type {CollectionItemFragment} from 'storefrontapi.generated';
import {Image, Money, CartForm} from '@shopify/hydrogen';
import {useAside} from './Aside';
import {MobileQuickAdd} from './MobileQuickAdd';

const TOTAL_FRAMES = 90;
const FRAME_DURATION = 20; // ~50fps animation - faster rotation

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

  // Image sequence 360 state
  const [currentFrame, setCurrentFrame] = useState(1);
  const [isAnimating, setIsAnimating] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const animationRef = useRef<number | null>(null);
  const preloadedImages = useRef<HTMLImageElement[]>([]);

  // Get sequence base URL from metafield
  const sequenceBaseUrl = (product as any).productVideo360?.value as string | undefined;

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
      (opt) => opt.name.toLowerCase() === 'color' || opt.name.toLowerCase() === 'colour' || opt.name.toLowerCase() === 'kleur'
    );
    if (colorOption?.value) {
      uniqueColors.add(colorOption.value);
    }
  });
  const colorCount = uniqueColors.size;
  const firstColor = uniqueColors.values().next().value || '';

  // Get clothing characteristics from variants or metafields
  const clothingFeatures = new Set<string>();
  variants.forEach((variant) => {
    const featureOption = variant.selectedOptions?.find(
      (opt) => {
        const name = opt.name.toLowerCase();
        return name === 'kenmerken kleding' || name === 'pasvorm' || name === 'fit';
      }
    );
    if (featureOption?.value) {
      clothingFeatures.add(featureOption.value);
    }
  });
  // Also check for pasvorm metafield (from Shopify category metafields)
  const pasvormMetafield = (product as any).pasvorm?.value || (product as any).pasvormShopify?.value;
  const clothingFeature = clothingFeatures.values().next().value || pasvormMetafield || '';

  // Helper to get frame URL
  const getFrameUrl = useCallback((frameNum: number) => {
    if (!sequenceBaseUrl) return '';
    const paddedFrame = String(frameNum).padStart(4, '0');
    return `${sequenceBaseUrl}${paddedFrame}.webp`;
  }, [sequenceBaseUrl]);

  // Preload images for smooth animation
  useEffect(() => {
    if (!sequenceBaseUrl || imagesLoaded) return;

    const images: HTMLImageElement[] = [];
    let loadedCount = 0;

    for (let i = 1; i <= TOTAL_FRAMES; i++) {
      const img = new window.Image();
      img.src = getFrameUrl(i);
      img.onload = () => {
        loadedCount++;
        if (loadedCount === TOTAL_FRAMES) {
          setImagesLoaded(true);
        }
      };
      images.push(img);
    }

    preloadedImages.current = images;
  }, [sequenceBaseUrl, getFrameUrl, imagesLoaded]);

  // Image sequence hover handlers
  const frameRef = useRef(1);
  const directionRef = useRef<'forward' | 'reverse' | 'complete' | 'idle'>('idle');
  const speedRef = useRef(1);

  const runAnimation = () => {
    if (directionRef.current === 'idle') return;

    if (directionRef.current === 'forward') {
      // Phase 1: Rotate from front (1) to back (45) with easing
      const targetFrame = 45;
      const startFrame = 1;
      const totalFrames = targetFrame - startFrame;
      const currentProgress = frameRef.current - startFrame;

      // Ease out: start fast, end slow
      const progress = currentProgress / totalFrames;
      const easeDelay = 10 + (progress * progress * 30); // 10ms -> 40ms

      frameRef.current++;
      if (frameRef.current >= targetFrame) {
        frameRef.current = targetFrame;
        setCurrentFrame(frameRef.current);
        directionRef.current = 'pauseBack';
        animationRef.current = window.setTimeout(runAnimation, 2000);
        return;
      }
      setCurrentFrame(frameRef.current);
      animationRef.current = window.setTimeout(runAnimation, easeDelay);
    } else if (directionRef.current === 'pauseBack') {
      // After pause at back, go to front
      directionRef.current = 'toFront';
      animationRef.current = window.setTimeout(runAnimation, 20);
    } else if (directionRef.current === 'toFront') {
      // Phase 2: Rotate from back (45) to front (90/1) with easing
      const startFrame = 45;
      const endFrame = 90;
      const totalFrames = endFrame - startFrame;
      const currentProgress = frameRef.current - startFrame;

      // Ease out: start fast, end slow
      const progress = currentProgress / totalFrames;
      const easeDelay = 10 + (progress * progress * 30); // 10ms -> 40ms

      frameRef.current++;
      if (frameRef.current >= endFrame) {
        frameRef.current = 1; // Loop back to frame 1
        setCurrentFrame(frameRef.current);
        directionRef.current = 'pauseFront';
        animationRef.current = window.setTimeout(runAnimation, 2000);
        return;
      }
      setCurrentFrame(frameRef.current);
      animationRef.current = window.setTimeout(runAnimation, easeDelay);
    } else if (directionRef.current === 'pauseFront') {
      // After pause at front, go to back again
      directionRef.current = 'forward';
      animationRef.current = window.setTimeout(runAnimation, 20);
    } else if (directionRef.current === 'complete') {
      // Complete rotation with acceleration (reversed direction)
      speedRef.current = Math.min(speedRef.current + 0.15, 3);
      frameRef.current -= Math.ceil(speedRef.current);

      if (frameRef.current <= 1) {
        frameRef.current = 1;
        directionRef.current = 'idle';
        speedRef.current = 1;
        setIsAnimating(false);
        setCurrentFrame(1);
        return;
      }
      setCurrentFrame(frameRef.current);
      animationRef.current = window.setTimeout(runAnimation, FRAME_DURATION);
    } else if (directionRef.current === 'reverse') {
      // Reverse with acceleration (reversed direction - go back up to frame 1)
      speedRef.current = Math.min(speedRef.current + 0.15, 3);
      frameRef.current += Math.ceil(speedRef.current);

      if (frameRef.current >= TOTAL_FRAMES) {
        frameRef.current = 1;
        directionRef.current = 'idle';
        speedRef.current = 1;
        setIsAnimating(false);
        setCurrentFrame(1);
        return;
      }
      setCurrentFrame(frameRef.current);
      animationRef.current = window.setTimeout(runAnimation, FRAME_DURATION);
    }
  };

  const handleSequenceMouseEnter = () => {
    if (!sequenceBaseUrl || isMobile) return;

    // Stop any existing animation
    if (animationRef.current) {
      clearTimeout(animationRef.current);
    }

    // Start at frame 1 (front) and rotate to back after 0.5s delay
    frameRef.current = 1;
    speedRef.current = 1;
    setCurrentFrame(1);
    directionRef.current = 'forward';
    setIsAnimating(true);
    animationRef.current = window.setTimeout(runAnimation, 500);
  };

  const handleSequenceMouseLeave = () => {
    if (animationRef.current) {
      clearTimeout(animationRef.current);
      animationRef.current = null;
    }

    if (frameRef.current <= 1) {
      directionRef.current = 'idle';
      setIsAnimating(false);
      return;
    }

    speedRef.current = 1;

    // Past halfway? Reverse back to 1 with acceleration. Before halfway? Complete rotation.
    if (frameRef.current < TOTAL_FRAMES / 2) {
      directionRef.current = 'complete';
    } else {
      directionRef.current = 'reverse';
    }

    animationRef.current = window.setTimeout(runAnimation, FRAME_DURATION);
  };

  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        clearTimeout(animationRef.current);
      }
    };
  }, []);

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
        {(sequenceBaseUrl || product.featuredImage) && (
          <div
            className={`new-drop-image-wrapper ${showSuccess ? 'new-drop-image-wrapper--success' : ''}`}
            onMouseEnter={sequenceBaseUrl ? handleSequenceMouseEnter : undefined}
            onMouseLeave={sequenceBaseUrl ? handleSequenceMouseLeave : undefined}
          >
            {sequenceBaseUrl ? (
              <img
                src={getFrameUrl(currentFrame)}
                alt={product.title}
                className="new-drop-video"
              />
            ) : product.featuredImage && (
              <Image
                data={product.featuredImage}
                sizes="(min-width: 45em) 20vw, 40vw"
                className="new-drop-image"
              />
            )}

            {/* Product Tags */}
            {(isNew || clothingFeature) && (
              <div className="product-item-tags">
                {isNew && <span className="product-item-tag btn btn-glass">New</span>}
                {clothingFeature && <span className="product-item-tag btn btn-glass">{clothingFeature}</span>}
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
                <div
                  className={`size-selector ${isOpen && !showSuccess && fetcher.state === 'idle' ? 'size-selector-open' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                >
                  <div
                    className={`size-selector-content ${isOpen && !showSuccess && fetcher.state === 'idle' ? 'size-selector-content-open' : ''}`}
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
