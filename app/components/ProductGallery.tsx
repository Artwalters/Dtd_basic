import React from 'react';
import {Image} from '@shopify/hydrogen';
import type {ProductFragment} from 'storefrontapi.generated';

interface ProductGalleryProps {
  product: ProductFragment;
  selectedVariant: ProductFragment['selectedOrFirstAvailableVariant'];
  onImageIndexChange?: (index: number) => void;
}

export function ProductGallery({product, selectedVariant, onImageIndexChange}: ProductGalleryProps) {
  if (!selectedVariant?.image) {
    return (
      <div className="product-gallery">
        <div className="product-gallery-empty">No images available</div>
      </div>
    );
  }

  return (
    <div className="product-gallery">
      <div className="product-gallery-image">
        <Image
          alt={selectedVariant.image.altText || 'Product image'}
          aspectRatio="4/5"
          data={selectedVariant.image}
          sizes="(min-width: 45em) 50vw, 100vw"
        />
      </div>
    </div>
  );
}