import React, {useState, useEffect, useRef, useCallback} from 'react';
import {Image} from '@shopify/hydrogen';
import type {ProductFragment} from 'storefrontapi.generated';
import gsap from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const TOTAL_FRAMES = 90;

// 360° rotation icon SVG
const RotationIcon = () => (
  <svg
    className="arrow-3d-icon"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 107.98 54.18"
    aria-label="360° view"
  >
    <path
      fill="currentColor"
      d="M107.98,30.36v.81c-.01,12.71-24.18,23.01-53.99,23.01S0,43.88,0,31.17,23.11,8.62,52.01,8.18l-5.51-5.63c-.58-.59-.57-1.54.02-2.12.59-.58,1.54-.57,2.12.02l7.98,8.15c.59.58.6,1.53.02,2.12l-.02.02-7.98,8.15c-.29.29-.68.45-1.07.45s-.76-.15-1.05-.43c-.59-.58-.6-1.53-.02-2.12l5.49-5.61c-13.28.2-25.64,2.49-35,6.48-8.89,3.79-13.99,8.71-13.99,13.51s5.1,9.72,13.99,13.51c9.83,4.19,22.97,6.5,37,6.5s27.16-2.31,36.99-6.5c8.89-3.79,13.99-8.71,13.99-13.51v-.85c.02-.82.7-1.49,1.52-1.48.83.01,1.5.69,1.49,1.52Z"
    />
  </svg>
);

interface ProductGalleryProps {
  product: ProductFragment;
  selectedVariant: ProductFragment['selectedOrFirstAvailableVariant'];
  onImageIndexChange?: (index: number) => void;
}

export function ProductGallery({product, selectedVariant, onImageIndexChange}: ProductGalleryProps) {
  // State
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentFrame, setCurrentFrame] = useState(1);
  const [activeView, setActiveView] = useState<'360' | number>('360');
  const [mobileSelectedView, setMobileSelectedView] = useState<'360' | number>('360');

  // Refs
  const galleryContainerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const sequenceContainerRef = useRef<HTMLDivElement>(null);
  const mobileSequenceRef = useRef<HTMLDivElement>(null);
  const imageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const preloadedImages = useRef<HTMLImageElement[]>([]);

  // Drag state refs for 360° rotation
  const isDragging = useRef(false);
  const lastX = useRef(0);
  const velocity = useRef(0);
  const framePosition = useRef(currentFrame);
  const animationId = useRef<number | null>(null);

  // Get sequence base URL from metafield
  const sequenceBaseUrl = (product as any).productVideo360?.value as string | undefined;

  // Get clothing feature tag (pasvorm/fit)
  const clothingFeature = React.useMemo(() => {
    // Check metafields first
    const pasvormMetafield = (product as any).pasvorm?.value || (product as any).pasvormShopify?.value;
    if (pasvormMetafield) return pasvormMetafield;

    // Check variant options
    const variants = (product as any).variants?.nodes || [];
    for (const variant of variants) {
      const featureOption = variant.selectedOptions?.find(
        (opt: {name: string; value: string}) => {
          const name = opt.name.toLowerCase();
          return name === 'kenmerken kleding' || name === 'pasvorm' || name === 'fit';
        }
      );
      if (featureOption?.value) return featureOption.value;
    }
    return '';
  }, [product]);

  // Get all product images from media
  const allImages = React.useMemo(() => {
    const images: Array<{image: {id: string; url: string; altText?: string | null; width?: number; height?: number}}> = [];

    if (product.media?.nodes) {
      product.media.nodes.forEach((media) => {
        if (media.__typename === 'MediaImage' && media.image) {
          images.push({image: media.image});
        }
      });
    }

    // Fallback to selected variant image if no media found
    if (images.length === 0 && selectedVariant?.image) {
      images.push({image: selectedVariant.image});
    }

    return images;
  }, [product.media?.nodes, selectedVariant?.image]);

  // Helper to get frame URL for 360° sequence
  const getFrameUrl = useCallback((frameNum: number) => {
    if (!sequenceBaseUrl) return '';
    const paddedFrame = String(frameNum).padStart(4, '0');
    return `${sequenceBaseUrl}${paddedFrame}.webp`;
  }, [sequenceBaseUrl]);

  // Preload 360° sequence images
  useEffect(() => {
    if (!sequenceBaseUrl) return;

    const images: HTMLImageElement[] = [];
    for (let i = 1; i <= TOTAL_FRAMES; i++) {
      const img = new window.Image();
      img.src = getFrameUrl(i);
      images.push(img);
    }
    preloadedImages.current = images;
  }, [sequenceBaseUrl, getFrameUrl]);

  // Drag-based 360° rotation with momentum
  useEffect(() => {
    if (!sequenceBaseUrl || !sequenceContainerRef.current) return;

    const container = sequenceContainerRef.current;
    const friction = 0.95;
    const sensitivity = 0.15;

    const animate = () => {
      if (!isDragging.current && Math.abs(velocity.current) > 0.01) {
        framePosition.current += velocity.current;
        velocity.current *= friction;

        while (framePosition.current < 1) framePosition.current += TOTAL_FRAMES;
        while (framePosition.current > TOTAL_FRAMES) framePosition.current -= TOTAL_FRAMES;

        const newFrame = Math.round(framePosition.current);
        setCurrentFrame(newFrame);
        onImageIndexChange?.(newFrame - 1);
      }
      animationId.current = requestAnimationFrame(animate);
    };

    animationId.current = requestAnimationFrame(animate);

    const handleMouseDown = (e: MouseEvent) => {
      e.preventDefault();
      isDragging.current = true;
      lastX.current = e.clientX;
      velocity.current = 0;
      framePosition.current = currentFrame;
      container.style.cursor = 'grabbing';
      window.dispatchEvent(new CustomEvent('swiper-drag-start'));
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      e.preventDefault();

      const deltaX = e.clientX - lastX.current;
      lastX.current = e.clientX;
      velocity.current = -deltaX * sensitivity;
      framePosition.current += velocity.current;

      while (framePosition.current < 1) framePosition.current += TOTAL_FRAMES;
      while (framePosition.current > TOTAL_FRAMES) framePosition.current -= TOTAL_FRAMES;

      const newFrame = Math.round(framePosition.current);
      setCurrentFrame(newFrame);
      onImageIndexChange?.(newFrame - 1);
    };

    const handleMouseUp = () => {
      if (isDragging.current) {
        isDragging.current = false;
        container.style.cursor = 'grab';
        window.dispatchEvent(new CustomEvent('swiper-drag-end'));
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      isDragging.current = true;
      lastX.current = e.touches[0].clientX;
      velocity.current = 0;
      framePosition.current = currentFrame;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging.current) return;

      const deltaX = e.touches[0].clientX - lastX.current;
      lastX.current = e.touches[0].clientX;
      velocity.current = -deltaX * sensitivity;
      framePosition.current += velocity.current;

      while (framePosition.current < 1) framePosition.current += TOTAL_FRAMES;
      while (framePosition.current > TOTAL_FRAMES) framePosition.current -= TOTAL_FRAMES;

      const newFrame = Math.round(framePosition.current);
      setCurrentFrame(newFrame);
      onImageIndexChange?.(newFrame - 1);
    };

    const handleTouchEnd = () => {
      isDragging.current = false;
    };

    container.style.cursor = 'grab';
    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mouseleave', handleMouseUp);
    container.addEventListener('touchstart', handleTouchStart, {passive: true});
    container.addEventListener('touchmove', handleTouchMove, {passive: true});
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      if (animationId.current) cancelAnimationFrame(animationId.current);
      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mouseleave', handleMouseUp);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [sequenceBaseUrl, onImageIndexChange, currentFrame]);

  // Mobile horizontal scroll handler
  useEffect(() => {
    if (typeof window === 'undefined' || window.innerWidth > 1000) return;

    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollLeft = container.scrollLeft;
      const containerWidth = container.clientWidth;
      const activeIndex = Math.round(scrollLeft / containerWidth);
      const clampedIndex = Math.max(0, Math.min(activeIndex, allImages.length - 1));

      setCurrentImageIndex(clampedIndex);
      onImageIndexChange?.(clampedIndex);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [allImages.length, onImageIndexChange]);

  // Reset state when product changes
  useEffect(() => {
    window.scrollTo(0, 0);
    setCurrentImageIndex(0);
    setActiveView(sequenceBaseUrl ? '360' : 0);
    setMobileSelectedView(sequenceBaseUrl ? '360' : 0);
    imageRefs.current = [];
    ScrollTrigger.getAll().forEach(trigger => trigger.kill());

    // Reset 360° rotation to frame 1
    setCurrentFrame(1);
    framePosition.current = 1;
    velocity.current = 0;

    // Reset zoom scale on sequence element
    if (sequenceContainerRef.current) {
      const sequenceImg = sequenceContainerRef.current.querySelector('.product-gallery-sequence-element');
      if (sequenceImg) {
        gsap.set(sequenceImg, { scale: 1 });
      }
    }
  }, [product.id, sequenceBaseUrl]);

  // Mobile 360° drag handling
  useEffect(() => {
    if (!sequenceBaseUrl || !mobileSequenceRef.current) return;
    if (typeof window === 'undefined' || window.innerWidth > 1000) return;

    const container = mobileSequenceRef.current;
    const friction = 0.95;
    const sensitivity = 0.15;

    const handleTouchStart = (e: TouchEvent) => {
      isDragging.current = true;
      lastX.current = e.touches[0].clientX;
      velocity.current = 0;
      framePosition.current = currentFrame;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging.current) return;

      const deltaX = e.touches[0].clientX - lastX.current;
      lastX.current = e.touches[0].clientX;
      velocity.current = -deltaX * sensitivity;
      framePosition.current += velocity.current;

      while (framePosition.current < 1) framePosition.current += TOTAL_FRAMES;
      while (framePosition.current > TOTAL_FRAMES) framePosition.current -= TOTAL_FRAMES;

      const newFrame = Math.round(framePosition.current);
      setCurrentFrame(newFrame);
      onImageIndexChange?.(newFrame - 1);
    };

    const handleTouchEnd = () => {
      isDragging.current = false;
    };

    container.addEventListener('touchstart', handleTouchStart, {passive: true});
    container.addEventListener('touchmove', handleTouchMove, {passive: true});
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [sequenceBaseUrl, onImageIndexChange, currentFrame]);

  // GSAP ScrollTrigger stacking animation for desktop
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.innerWidth <= 1000) return;
    if (!galleryContainerRef.current || allImages.length === 0) return;

    const timeoutId = setTimeout(() => {
      const galleryEl = galleryContainerRef.current;
      if (!galleryEl) return;

      const images = imageRefs.current.filter(Boolean) as HTMLDivElement[];
      if (images.length === 0) return;

      const scrollOffset = sequenceBaseUrl ? window.innerHeight : 0;

      // Get 360° sequence element for zoom effect
      const sequenceImg = sequenceContainerRef.current?.querySelector('.product-gallery-sequence-element');
      if (sequenceImg) gsap.set(sequenceImg, { scale: 1 });

      // Set initial state: autoAlpha removes visibility:hidden, yPercent positions off-screen
      images.forEach((img, index) => {
        gsap.set(img, { autoAlpha: 1, yPercent: 100, zIndex: index + 2 });
        // Set initial scale on inner image
        const innerImg = img.querySelector('.product-gallery-img');
        if (innerImg) gsap.set(innerImg, { scale: 1 });
      });

      // Create scroll triggers for stacking animation
      images.forEach((img, index) => {
        ScrollTrigger.create({
          trigger: galleryEl,
          start: () => `top+=${scrollOffset + (index * window.innerHeight)} top`,
          end: () => `top+=${scrollOffset + ((index + 1) * window.innerHeight)} top`,
          scrub: true,
          onUpdate: (self) => {
            gsap.set(img, { yPercent: 100 - (self.progress * 100) });

            // Subtle zoom on 360° view when first image covers it
            if (index === 0 && sequenceImg) {
              const zoomScale = 1 + (self.progress * 0.05);
              gsap.set(sequenceImg, { scale: zoomScale });
            }

            // Subtle zoom on previous image when this one covers it
            if (index > 0) {
              const prevImg = images[index - 1]?.querySelector('.product-gallery-img');
              if (prevImg) {
                // Scale from 1 to 1.05 as this image covers the previous
                const zoomScale = 1 + (self.progress * 0.05);
                gsap.set(prevImg, { scale: zoomScale });
              }
            }

            if (self.progress > 0.5) {
              setCurrentImageIndex(index);
              setActiveView(index);
              onImageIndexChange?.(index);
            } else if (index === 0 && self.progress <= 0.5) {
              setActiveView('360');
            }
          },
        });
      });

      ScrollTrigger.refresh();
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, [product.id, allImages.length, sequenceBaseUrl, onImageIndexChange]);

  // Empty state
  if (allImages.length === 0 && !sequenceBaseUrl) {
    return (
      <div className="product-gallery">
        <div className="product-gallery-empty">No images available</div>
      </div>
    );
  }

  // Combined view: 360° sequence + product images with stacking animation
  if (sequenceBaseUrl && allImages.length > 0) {
    return (
      <div
        ref={galleryContainerRef}
        className="product-gallery product-gallery--combined"
        style={{ height: `${(allImages.length + 2) * 100}vh` }}
      >
        {/* Desktop: Main sticky view area */}
        <div className="product-gallery-stack-wrapper desktop-only">
          {/* Thumbnails sidebar - inside sticky wrapper */}
          <div className="product-gallery-thumbnails">
            <div className={`product-gallery-thumbnail ${activeView === '360' ? 'active' : 'passed'}`}>
              <img
                src={getFrameUrl(1)}
                alt="360° view"
                className="product-gallery-thumbnail-img"
              />
              <span className="thumbnail-360-badge">360°</span>
            </div>

            {allImages.map((media, index) => {
              const isActive = activeView === index;
              const isPassed = typeof activeView === 'number' && index < activeView;
              return (
                <div
                  key={media.image.id || index}
                  className={`product-gallery-thumbnail ${isActive ? 'active' : ''} ${isPassed ? 'passed' : ''}`}
                >
                  <Image
                    alt={media.image.altText || `Thumbnail ${index + 1}`}
                    data={media.image}
                    sizes="80px"
                    className="product-gallery-thumbnail-img"
                  />
                </div>
              );
            })}
          </div>
          {/* 360° viewer layer */}
          <div
            className={`product-gallery-360-layer ${activeView === '360' ? 'active' : ''}`}
            ref={sequenceContainerRef}
            data-cursor="click & drag"
          >
            <img
              src={getFrameUrl(currentFrame)}
              alt={`${product.title} 360° view`}
              className="product-gallery-sequence-element"
              draggable={false}
            />
            <div className="product-gallery-360-icon">
              <RotationIcon />
            </div>
          </div>

          {/* Clothing feature tag - desktop bottom right */}
          {clothingFeature && (
            <div className="product-gallery-tag desktop-tag">
              <span className="btn btn-glass">{clothingFeature}</span>
            </div>
          )}

          {/* Stacking images layer */}
          <div className="product-gallery-stack">
            {allImages.map((media, index) => (
              <div
                key={media.image.id || index}
                className="product-gallery-stack-image"
                ref={(el) => { imageRefs.current[index] = el; }}
              >
                <Image
                  alt={media.image.altText || `Product image ${index + 1}`}
                  data={media.image}
                  sizes="50vw"
                  className="product-gallery-img"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Mobile: Main view + thumbnail row */}
        <div className="product-gallery-mobile mobile-only">
          {/* Clothing feature tag - mobile top left */}
          {clothingFeature && (
            <div className="product-gallery-tag mobile-tag">
              <span className="btn btn-glass">{clothingFeature}</span>
            </div>
          )}

          {/* Main view area */}
          <div className="product-gallery-mobile-main">
            {/* 360° view */}
            <div
              className={`product-gallery-mobile-360 ${mobileSelectedView === '360' ? 'active' : ''}`}
              ref={mobileSequenceRef}
            >
              <img
                src={getFrameUrl(currentFrame)}
                alt={`${product.title} 360° view`}
                className="product-gallery-sequence-element"
                draggable={false}
              />
              <div className="product-gallery-360-icon">
                <RotationIcon />
              </div>
            </div>

            {/* Product images */}
            {allImages.map((media, index) => (
              <div
                key={media.image.id || index}
                className={`product-gallery-mobile-image ${mobileSelectedView === index ? 'active' : ''}`}
              >
                <Image
                  alt={media.image.altText || `Product image ${index + 1}`}
                  data={media.image}
                  sizes="100vw"
                  className="product-gallery-img"
                />
              </div>
            ))}
          </div>

          {/* Thumbnail row */}
          <div className="product-gallery-mobile-thumbnails">
            <button
              type="button"
              className={`product-gallery-mobile-thumb ${mobileSelectedView === '360' ? 'active' : ''}`}
              onClick={() => setMobileSelectedView('360')}
            >
              <img
                src={getFrameUrl(1)}
                alt="360° view"
                className="product-gallery-thumbnail-img"
              />
              <span className="thumbnail-360-badge">360°</span>
            </button>

            {allImages.map((media, index) => (
              <button
                key={media.image.id || index}
                type="button"
                className={`product-gallery-mobile-thumb ${mobileSelectedView === index ? 'active' : ''}`}
                onClick={() => setMobileSelectedView(index)}
              >
                <Image
                  alt={media.image.altText || `Thumbnail ${index + 1}`}
                  data={media.image}
                  sizes="80px"
                  className="product-gallery-thumbnail-img"
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 360° sequence only (no product images)
  if (sequenceBaseUrl) {
    return (
      <div className="product-gallery product-gallery--sticky" ref={sequenceContainerRef} data-cursor="click & drag">
        <img
          src={getFrameUrl(currentFrame)}
          alt={`${product.title} 360° view`}
          className="product-gallery-sequence-element"
          draggable={false}
        />
        <RotationIcon />
      </div>
    );
  }

  // Product images only (no 360° sequence) - stacking on desktop, horizontal scroll on mobile
  const scrollHeight = allImages.length > 1 ? `${(allImages.length + 1) * 100}vh` : '100vh';

  return (
    <div
      ref={galleryContainerRef}
      className="product-gallery product-gallery--stacking"
      style={{ height: scrollHeight }}
    >
      {/* Desktop: Stacking container */}
      <div className="product-gallery-stack-wrapper">
        {/* Thumbnails sidebar - inside sticky wrapper */}
        <div className="product-gallery-thumbnails">
          {allImages.map((media, index) => (
            <div
              key={media.image.id || index}
              className={`product-gallery-thumbnail ${currentImageIndex === index ? 'active' : ''}`}
            >
              <Image
                alt={media.image.altText || `Thumbnail ${index + 1}`}
                data={media.image}
                sizes="80px"
                className="product-gallery-thumbnail-img"
              />
            </div>
          ))}
        </div>

        <div className="product-gallery-stack">
          {allImages.map((media, index) => (
            <div
              key={media.image.id || index}
              className="product-gallery-stack-image"
              ref={(el) => { imageRefs.current[index] = el; }}
            >
              <Image
                alt={media.image.altText || `Product image ${index + 1}`}
                data={media.image}
                sizes="50vw"
                className="product-gallery-img"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Mobile: Horizontal scroll gallery */}
      <div className="product-gallery-scroll-container" ref={scrollContainerRef}>
        {allImages.map((media, index) => (
          <div key={media.image.id || index} className="product-gallery-image">
            <Image
              alt={media.image.altText || `Product image ${index + 1}`}
              data={media.image}
              sizes="100vw"
              className="product-gallery-img"
            />
          </div>
        ))}
      </div>

      {/* Mobile: Scroll progress indicator */}
      {allImages.length > 1 && (
        <div className="product-gallery-progress mobile-only">
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{
                width: `${100 / allImages.length}%`,
                transform: `translateX(${currentImageIndex * 100}%)`
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
