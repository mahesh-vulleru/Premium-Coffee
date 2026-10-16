import React from 'react';

export const DEFAULT_PRODUCT_FALLBACK_IMAGE = '/images/product-espresso.jpg';

export const handleImageError = (
  e: React.SyntheticEvent<HTMLImageElement, Event>,
  fallbackSrc = DEFAULT_PRODUCT_FALLBACK_IMAGE
) => {
  const target = e.currentTarget;
  if (target.src !== fallbackSrc && !target.dataset.hasFallenBack) {
    target.dataset.hasFallenBack = 'true';
    target.src = fallbackSrc;
  }
};

