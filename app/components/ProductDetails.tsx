import React, {useEffect, useState} from 'react';
import {type MappedProductOptions} from '@shopify/hydrogen';
import type {ProductFragment} from 'storefrontapi.generated';
import {AddToCartButton} from './AddToCartButton';
import {useAside} from './Aside';
import {SizeGuide} from './SizeGuide';

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
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);

  // Initialize accordion functionality when component mounts
  useEffect(() => {
    function initAccordionCSS() {
      const accordionElements = document.querySelectorAll('[data-accordion-css-init]');

      accordionElements.forEach((accordion) => {
        const closeSiblings = accordion.getAttribute('data-accordion-close-siblings') === 'true';

        // Remove existing event listener to avoid duplicates
        const newAccordion = accordion.cloneNode(true);
        accordion.parentNode?.replaceChild(newAccordion, accordion);

        newAccordion.addEventListener('click', (event) => {
          const toggle = (event.target as Element).closest('[data-accordion-toggle]');
          if (!toggle) return;

          const singleAccordion = toggle.closest('[data-accordion-status]');
          if (!singleAccordion) return;

          const isActive = singleAccordion.getAttribute('data-accordion-status') === 'active';
          singleAccordion.setAttribute('data-accordion-status', isActive ? 'not-active' : 'active');

          if (closeSiblings && !isActive) {
            newAccordion.querySelectorAll('[data-accordion-status="active"]').forEach((sibling) => {
              if (sibling !== singleAccordion) {
                sibling.setAttribute('data-accordion-status', 'not-active');
              }
            });
          }
        });
      });
    }

    // Small delay to ensure DOM is fully rendered
    const timeoutId = setTimeout(() => {
      initAccordionCSS();
    }, 100);

    return () => clearTimeout(timeoutId);
  }, []);

  const sizeOption = productOptions.find(option =>
    option.name.toLowerCase() === 'size'
  );

  const colorOption = productOptions.find(option =>
    option.name.toLowerCase() === 'color'
  );

  const expandableSections: ExpandableSection[] = [
    {
      title: 'Details',
      isOpen: false,
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
      title: 'Product care',
      isOpen: false,
      content: (
        <div className="product-details-content">
          <p>Machine wash cold with similar colors. Do not bleach. Tumble dry low. Iron on low heat if needed.</p>
        </div>
      ),
    },
    {
      title: 'Shipping & Return',
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

  // Format price
  const formatPrice = (amount: string, currencyCode: string) => {
    const num = parseFloat(amount);
    return `${Math.round(num)}€`;
  };

  return (
    <div className="product-details-wrapper">
      {/* Scroll Indicator - Desktop only */}
      {totalImages > 1 && (
        <div className="product-gallery-progress desktop-only">
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{
                height: `${100 / totalImages}%`,
                width: '100%',
                transform: `translateY(${currentImageIndex * 100}%)`
              }}
            />
          </div>
        </div>
      )}

      <div className="product-details">
        {/* Header: Title and Price */}
        <div className="product-header">
          <h1 className="product-title">{product.title}</h1>
          <span className="product-price">
            {selectedVariant?.price && formatPrice(selectedVariant.price.amount, selectedVariant.price.currencyCode)}
          </span>
        </div>

        {/* Divider Line with brackets */}
        <div className="section-divider product-section-divider"></div>

        {/* Color Selection */}
        {colorOption && colorOption.optionValues.length > 0 && (
          <div className="product-color-section">
            <span className="section-label">COLOR</span>
            <div className="color-swatches">
              {colorOption.optionValues.map((value) => (
                <button
                  key={value.name}
                  className={`color-swatch ${value.selected ? 'selected' : ''}`}
                  onClick={() => onVariantChange(value.variantUriQuery)}
                  style={{
                    backgroundColor: value.swatch?.color || '#4a6ee0',
                  }}
                  title={value.name}
                />
              ))}
            </div>
          </div>
        )}

        {/* Size Selection */}
        {sizeOption && (
          <div className="product-size-section">
            <div className="size-header">
              <span className="size-model-info">Model is 187cm and 75kg wearing size M</span>
              <button className="size-guide-link" onClick={() => setIsSizeGuideOpen(true)}>
                <span>Size & Fit Guide</span>
              </button>
            </div>
            <div className="size-grid">
              {sizeOption.optionValues.map((value) => (
                <button
                  key={value.name}
                  className={`size-grid-option ${value.selected ? 'selected' : ''} ${!value.available ? 'unavailable' : ''}`}
                  onClick={() => onVariantChange(value.variantUriQuery)}
                  disabled={!value.available}
                >
                  {value.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="product-actions">
          <button className="buy-now-button">
            Buy now
          </button>
          <AddToCartButton
            className="add-to-bag-button"
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
            Add to bag
          </AddToCartButton>
        </div>

        {/* Expandable Sections */}
        <div data-accordion-close-siblings="true" data-accordion-css-init="" className="accordion-css">
          <ul className="accordion-css__list">
            {expandableSections.map((section) => (
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

      <SizeGuide isOpen={isSizeGuideOpen} onClose={() => setIsSizeGuideOpen(false)} />
    </div>
  );
}
