import React, {useState, useEffect, useRef} from 'react';
import {Image} from '@shopify/hydrogen';
import type {ProductFragment} from 'storefrontapi.generated';

interface ProductGalleryProps {
  product: ProductFragment;
  selectedVariant: ProductFragment['selectedOrFirstAvailableVariant'];
  onImageIndexChange?: (index: number) => void;
}

export function ProductGallery({product, selectedVariant, onImageIndexChange}: ProductGalleryProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);

  // Create image array - many copies to simulate a long product gallery
  const allImages = React.useMemo(() => {
    if (selectedVariant?.image) {
      // Create many copies of the image to simulate a long product gallery
      return Array.from({length: 15}, (_, index) => ({
        image: {
          ...selectedVariant.image,
          id: `${selectedVariant.image.id}-${index}`,
        }
      }));
    }
    return [];
  }, [selectedVariant?.image]);

  // Update scroll position when current image changes (removed automatic scrolling)
  useEffect(() => {
    // We don't auto-scroll when currentImageIndex changes
    // The scroll is now handled by user scrolling through the page
  }, [currentImageIndex]);

  // Handle scroll to update current image index
  useEffect(() => {
    const isMobile = window.innerWidth <= 1000;

    const handleVerticalScroll = () => {
      const scrollTop = window.pageYOffset;
      const windowHeight = window.innerHeight;
      const headerHeight = 64; // Header height
      const contentStart = headerHeight;

      // Calculate which image should be active based on scroll position
      const imageHeight = windowHeight; // 100vh per image
      const scrollProgress = (scrollTop - contentStart) / imageHeight;
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
      handleVerticalScroll(); // Call once on mount
      return () => window.removeEventListener('scroll', handleVerticalScroll);
    }
  }, [allImages.length, onImageIndexChange]);

  if (allImages.length === 0) {
    return (
      <div className="product-gallery">
        <div className="product-gallery-empty">No images available</div>
      </div>
    );
  }

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