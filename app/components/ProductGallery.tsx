import React, {useState, useEffect, useRef, useCallback} from 'react';
import {Image} from '@shopify/hydrogen';
import type {ProductFragment} from 'storefrontapi.generated';

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
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const sequenceContainerRef = useRef<HTMLDivElement>(null);
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
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      e.preventDefault();

      const deltaX = e.clientX - lastX.current;
      lastX.current = e.clientX;

      velocity.current = deltaX * sensitivity;
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

      velocity.current = deltaX * sensitivity;
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
    window.addEventListener('touchmove', handleTouchMove, {passive: true});
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      if (animationId.current) cancelAnimationFrame(animationId.current);
      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mouseleave', handleMouseUp);
      container.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [sequenceBaseUrl, onImageIndexChange, currentFrame]);

  // Handle scroll to update current image index (for regular images)
  useEffect(() => {
    const isMobile = window.innerWidth <= 1000;

    const handleVerticalScroll = () => {
      const scrollTop = window.pageYOffset;
      const windowHeight = window.innerHeight;
      const headerHeight = 64;
      const contentStart = headerHeight;

      // Account for 360 sequence section (300vh) if it exists
      const sequenceHeight = sequenceBaseUrl ? windowHeight * 3 : 0;
      const adjustedScrollTop = scrollTop - sequenceHeight;

      // Calculate which image should be active based on scroll position
      const imageHeight = windowHeight;
      const scrollProgress = (adjustedScrollTop - contentStart) / imageHeight;
      const activeIndex = Math.max(0, Math.min(Math.floor(scrollProgress), allImages.length - 1));

      setCurrentImageIndex(activeIndex);
      onImageIndexChange?.(activeIndex);
    };

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
    } else {
      window.addEventListener('scroll', handleVerticalScroll);
      handleVerticalScroll();
      return () => window.removeEventListener('scroll', handleVerticalScroll);
    }
  }, [allImages.length, onImageIndexChange, sequenceBaseUrl]);

  if (allImages.length === 0 && !sequenceBaseUrl) {
    return (
      <div className="product-gallery">
        <div className="product-gallery-empty">No images available</div>
      </div>
    );
  }

  // If we have a 360 sequence, show only that (sticky)
  if (sequenceBaseUrl) {
    return (
      <div className="product-gallery product-gallery--sticky" ref={sequenceContainerRef}>
        <img
          src={getFrameUrl(currentFrame)}
          alt={`${product.title} 360° view`}
          className="product-gallery-sequence-element"
          draggable={false}
        />
      </div>
    );
  }

  // Fallback to regular image gallery
  return (
    <div className="product-gallery">
      <div className="product-gallery-scroll-container" ref={scrollContainerRef}>
        {allImages.map((media, index) => (
          <div key={media.image.id || index} className="product-gallery-image">
            <Image
              alt={media.image.altText || `Product image ${index + 1}`}
              data={media.image}
              sizes="50vw"
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
