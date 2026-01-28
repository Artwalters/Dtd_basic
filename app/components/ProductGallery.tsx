import React, {useState, useEffect, useRef, useCallback} from 'react';
import {Image} from '@shopify/hydrogen';
import type {ProductFragment} from 'storefrontapi.generated';
import gsap from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const TOTAL_FRAMES = 90;

interface ProductGalleryProps {
  product: ProductFragment;
  selectedVariant: ProductFragment['selectedOrFirstAvailableVariant'];
  onImageIndexChange?: (index: number) => void;
}

export function ProductGallery({product, selectedVariant, onImageIndexChange}: ProductGalleryProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentFrame, setCurrentFrame] = useState(1);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [activeView, setActiveView] = useState<'360' | number>('360');
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const sequenceContainerRef = useRef<HTMLDivElement>(null);
  const stackContainerRef = useRef<HTMLDivElement>(null);
  const imageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const preloadedImages = useRef<HTMLImageElement[]>([]);

  // Get sequence base URL from metafield
  const sequenceBaseUrl = (product as any).productVideo360?.value as string | undefined;

  // Get all product images from media
  const allImages = React.useMemo(() => {
    const images: Array<{image: {id: string; url: string; altText?: string | null; width?: number; height?: number}}> = [];

    // First, add all media images from the product
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

  // Helper to get frame URL
  const getFrameUrl = useCallback((frameNum: number) => {
    if (!sequenceBaseUrl) return '';
    const paddedFrame = String(frameNum).padStart(4, '0');
    return `${sequenceBaseUrl}${paddedFrame}.webp`;
  }, [sequenceBaseUrl]);

  // Preload images for smooth scrolling
  useEffect(() => {
    if (!sequenceBaseUrl) return;

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
  }, [sequenceBaseUrl, getFrameUrl]);

  // Drag-based image sequence rotation with momentum
  const isDragging = useRef(false);
  const lastX = useRef(0);
  const velocity = useRef(0);
  const framePosition = useRef(currentFrame);
  const animationId = useRef<number | null>(null);

  useEffect(() => {
    if (!sequenceBaseUrl || !sequenceContainerRef.current) return;

    const container = sequenceContainerRef.current;
    const friction = 0.95;
    const sensitivity = 0.15;

    // Animation loop with momentum
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

  // Handle scroll to update current image index (for regular images)
  useEffect(() => {
    const isMobile = window.innerWidth <= 1000;

    const handleHorizontalScroll = () => {
      const container = scrollContainerRef.current;
      if (!container) return;

      const scrollLeft = container.scrollLeft;
      const containerWidth = container.clientWidth;
      const activeIndex = Math.round(scrollLeft / containerWidth);

      setCurrentImageIndex(Math.max(0, Math.min(activeIndex, allImages.length - 1)));
      onImageIndexChange?.(Math.max(0, Math.min(activeIndex, allImages.length - 1)));
    };

    if (isMobile) {
      const container = scrollContainerRef.current;
      if (container) {
        container.addEventListener('scroll', handleHorizontalScroll);
        return () => container.removeEventListener('scroll', handleHorizontalScroll);
      }
    }
  }, [allImages.length, onImageIndexChange]);

  // Ref for the main gallery container
  const galleryContainerRef = useRef<HTMLDivElement>(null);

  // Reset scroll position and state when product changes
  useEffect(() => {
    window.scrollTo(0, 0);
    setCurrentImageIndex(0);
    setActiveView(sequenceBaseUrl ? '360' : 0);
    imageRefs.current = [];

    // Kill all existing ScrollTriggers
    ScrollTrigger.getAll().forEach(trigger => trigger.kill());
  }, [product.id]);

  // GSAP ScrollTrigger stacking animation for desktop
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.innerWidth <= 1000) return;
    if (!galleryContainerRef.current || allImages.length === 0) return;

    // Small delay to ensure DOM refs are populated
    const timeoutId = setTimeout(() => {
      const galleryEl = galleryContainerRef.current;
      if (!galleryEl) return;

      const images = imageRefs.current.filter(Boolean) as HTMLDivElement[];
      if (images.length === 0) return;

      const scrollOffset = sequenceBaseUrl ? window.innerHeight : 0;

      // Set initial state: autoAlpha makes visible (removes visibility:hidden), yPercent positions off-screen
      images.forEach((img, index) => {
        gsap.set(img, { autoAlpha: 1, yPercent: 100, zIndex: index + 2 });
      });

      // Create scroll triggers
      images.forEach((img, index) => {
        ScrollTrigger.create({
          trigger: galleryEl,
          start: () => `top+=${scrollOffset + (index * window.innerHeight)} top`,
          end: () => `top+=${scrollOffset + ((index + 1) * window.innerHeight)} top`,
          scrub: true,
          onUpdate: (self) => {
            const progress = self.progress;
            gsap.set(img, { yPercent: 100 - (progress * 100) });

            if (progress > 0.5) {
              setCurrentImageIndex(index);
              setActiveView(index);
              onImageIndexChange?.(index);
            } else if (index === 0 && progress <= 0.5) {
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

  if (allImages.length === 0 && !sequenceBaseUrl) {
    return (
      <div className="product-gallery">
        <div className="product-gallery-empty">No images available</div>
      </div>
    );
  }

  // If we have a 360 sequence WITH product images, show combined view
  // Height: 360 section (100vh) + each image needs 100vh to animate + extra 100vh for last image to complete
  if (sequenceBaseUrl && allImages.length > 0) {
    return (
      <div
        ref={galleryContainerRef}
        className="product-gallery product-gallery--combined"
        style={{ height: `${(allImages.length + 2) * 100}vh` }}
      >
        {/* Thumbnails on the left */}
        <div className="product-gallery-thumbnails">
          {/* 360 thumbnail */}
          <button
            className={`product-gallery-thumbnail ${activeView === '360' ? 'active' : ''}`}
            onClick={() => {
              setActiveView('360');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            type="button"
          >
            <img
              src={getFrameUrl(1)}
              alt="360° view"
              className="product-gallery-thumbnail-img"
            />
            <span className="thumbnail-360-badge">360°</span>
          </button>

          {/* Image thumbnails */}
          {allImages.map((media, index) => (
            <button
              key={media.image.id || index}
              className={`product-gallery-thumbnail ${activeView === index ? 'active' : ''}`}
              onClick={() => {
                setActiveView(index);
                const targetScroll = (index + 1) * window.innerHeight;
                window.scrollTo({ top: targetScroll, behavior: 'smooth' });
              }}
              type="button"
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

        {/* Main view area - sticky */}
        <div className="product-gallery-stack-wrapper">
          {/* 360 viewer */}
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
          </div>

          {/* Stacking images */}
          <div className="product-gallery-stack" ref={stackContainerRef}>
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
      </div>
    );
  }

  // If we have ONLY a 360 sequence (no product images), show just that
  if (sequenceBaseUrl) {
    return (
      <div className="product-gallery product-gallery--sticky" ref={sequenceContainerRef} data-cursor="click & drag">
        <img
          src={getFrameUrl(currentFrame)}
          alt={`${product.title} 360° view`}
          className="product-gallery-sequence-element"
          draggable={false}
        />
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
      </div>
    );
  }

  // Desktop: Stacking cards with thumbnails on left
  // Mobile: Horizontal scroll gallery

  // Calculate scroll height based on number of images
  // Extra 100vh to allow last image to fully animate
  const scrollHeight = allImages.length > 1 ? `${(allImages.length + 1) * 100}vh` : '100vh';

  return (
    <div
      ref={galleryContainerRef}
      className="product-gallery product-gallery--stacking"
      style={{ height: scrollHeight }}
    >
      {/* Desktop: Thumbnails on the left */}
      <div className="product-gallery-thumbnails">
        {allImages.map((media, index) => (
          <button
            key={media.image.id || index}
            className={`product-gallery-thumbnail ${currentImageIndex === index ? 'active' : ''}`}
            onClick={() => {
              // Scroll to the corresponding section
              if (stackContainerRef.current) {
                const targetScroll = index * window.innerHeight;
                window.scrollTo({ top: targetScroll, behavior: 'smooth' });
              }
            }}
            type="button"
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

      {/* Desktop: Stacking container */}
      <div className="product-gallery-stack-wrapper">
        <div
          className="product-gallery-stack"
          ref={stackContainerRef}
        >
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

      {/* Mobile scroll indicator */}
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
