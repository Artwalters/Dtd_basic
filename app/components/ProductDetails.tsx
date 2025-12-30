import React, {useState} from 'react';
import {type MappedProductOptions} from '@shopify/hydrogen';
import type {ProductFragment} from 'storefrontapi.generated';
import {ProductPrice} from './ProductPrice';
import {AddToCartButton} from './AddToCartButton';
import {useAside} from './Aside';

interface ProductDetailsProps {
  product: ProductFragment;
  selectedVariant: ProductFragment['selectedOrFirstAvailableVariant'];
  productOptions: MappedProductOptions[];
  onVariantChange: (variantUriQuery: string) => void;
  currentImageIndex?: number;
  totalImages?: number;
}

interface ExpandableSection {
  title: string;
  content: React.ReactNode;
  isOpen: boolean;
}

export function ProductDetails({
  product,
  selectedVariant,
  productOptions,
  onVariantChange,
  currentImageIndex = 0,
  totalImages = 1,
}: ProductDetailsProps) {
  const {open} = useAside();
  const [selectedSize, setSelectedSize] = useState<string>('');

  const sizeOption = productOptions.find(option => 
    option.name.toLowerCase() === 'size'
  );

  const colorOption = productOptions.find(option => 
    option.name.toLowerCase() === 'color'
  );

  const handleSizeSelect = (value: any) => {
    setSelectedSize(value.name);
    onVariantChange(value.variantUriQuery);
  };

  const expandableSections: ExpandableSection[] = [
    {
      title: 'Details',
      isOpen: true,
      content: (
        <div className="product-details-content">
          <p>Premium oversized tee crafted from 100% cotton. Designed for comfort with a relaxed fit.</p>
          <ul>
            <li>100% Cotton</li>
            <li>Oversized fit</li>
            <li>Model: 185cm, 105kg, wears XL</li>
            <li>Made in Portugal</li>
          </ul>
        </div>
      ),
    },
    {
      title: 'Size & Fit',
      isOpen: false,
      content: (
        <div className="product-details-content">
          <p>Runs large. Consider sizing down for a more fitted look.</p>
          <ul>
            <li>S: Chest 92cm, Length 68cm</li>
            <li>M: Chest 96cm, Length 70cm</li>
            <li>L: Chest 100cm, Length 72cm</li>
            <li>XL: Chest 104cm, Length 74cm</li>
          </ul>
        </div>
      ),
    },
    {
      title: 'Shipping & Returns',
      isOpen: false,
      content: (
        <div className="product-details-content">
          <ul>
            <li>Free shipping over €50</li>
            <li>Standard delivery: 3-5 days</li>
            <li>30-day returns</li>
            <li>Items must be unworn with tags</li>
          </ul>
        </div>
      ),
    },
  ];

  return (
    <div className="product-details-wrapper">
      {/* Scroll Indicator - Sticky within this wrapper */}
      {totalImages > 1 && (
        <div className="product-gallery-indicator">
          <div 
            className="product-gallery-indicator-track"
            style={{
              transform: `translateY(${totalImages > 1 ? (currentImageIndex / (totalImages - 1)) * (25 - 3) : 0}em)`
            }}
          />
        </div>
      )}
      
      <div className="product-details">
        <div className="product-details-header">
        <div className="product-brand">Dare to dream</div>
        <div className="product-title-container">
          <h1 className="product-title">{product.title}</h1>
          <button className="product-bookmark">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M12 2H4C3.44772 2 3 2.44772 3 3V14L8 11L13 14V3C13 2.44772 12.5523 2 12 2Z" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Color Selection */}
      {colorOption && colorOption.optionValues.length > 1 && (
        <div className="product-color-selection">
          <div className="color-swatches">
            {colorOption.optionValues.map((value) => (
              <button
                key={value.name}
                className={`color-swatch ${value.selected ? 'selected' : ''}`}
                onClick={() => onVariantChange(value.variantUriQuery)}
                style={{ 
                  backgroundColor: value.swatch?.color || '#5f5c5a',
                  border: value.selected ? '2px solid #4b578e' : '2px solid transparent'
                }}
                title={value.name}
              />
            ))}
          </div>
        </div>
      )}

      {/* Size Selection */}
      <div className="product-size-selection">
        <button 
          className={`size-selector-button ${selectedSize ? 'has-selection' : ''}`}
          onClick={() => setSelectedSize(selectedSize ? '' : 'show-options')}
        >
          <span className="size-selector-text">
            {selectedSize || 'select a size'}
          </span>
          <div className="size-selector-pricing">
            {selectedVariant?.compareAtPrice && (
              <span className="compare-price">
                {selectedVariant.compareAtPrice.currencyCode} {selectedVariant.compareAtPrice.amount}
              </span>
            )}
            <span className="current-price">
              {selectedVariant?.price.currencyCode} {selectedVariant?.price.amount}
            </span>
          </div>
        </button>

        {/* Size Options Popup */}
        {selectedSize === 'show-options' && sizeOption && (
          <div className="size-options-popup">
            {sizeOption.optionValues.map((value) => (
              <button
                key={value.name}
                className={`size-option ${value.selected ? 'selected' : ''} ${!value.available ? 'unavailable' : ''}`}
                onClick={() => handleSizeSelect(value)}
                disabled={!value.available}
              >
                {value.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Add to Cart */}
      <div className="product-add-to-cart">
        <div className="add-to-cart-button">
          <AddToCartButton
            disabled={!selectedVariant || !selectedVariant.availableForSale}
            onClick={() => {
              open('cart');
            }}
            lines={
              selectedVariant
                ? [
                    {
                      merchandiseId: selectedVariant.id,
                      quantity: 1,
                      selectedVariant,
                    },
                  ]
                : []
            }
          >
            <span className="add-to-cart-text">Add to cart</span>
            <div className="add-to-cart-pricing">
              {selectedVariant?.compareAtPrice && (
                <span className="compare-price">
                  {selectedVariant.compareAtPrice.currencyCode}{selectedVariant.compareAtPrice.amount}
                </span>
              )}
              <span className="current-price">
                {selectedVariant?.price.currencyCode}{selectedVariant?.price.amount}
              </span>
            </div>
          </AddToCartButton>
        </div>
      </div>

      {/* Expandable Sections */}
      <div data-accordion-close-siblings="true" data-accordion-css-init="" className="accordion-css">
        <ul className="accordion-css__list">
          {expandableSections.map((section, index) => (
            <li key={section.title} data-accordion-status={section.isOpen ? 'active' : 'not-active'} className="accordion-css__item">
              <div data-accordion-toggle="" className="accordion-css__item-top">
                <h3 className="accordion-css__item-h3">{section.title}</h3>
                <div className="accordion-css__item-icon">
                  <svg className="accordion-css__item-icon-svg" xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 24 24" fill="none">
                    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
              <div className="accordion-css__item-bottom">
                <div className="accordion-css__item-bottom-wrap">
                  <div className="accordion-css__item-bottom-content">
                    {section.content}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
      </div>
    </div>
  );
}