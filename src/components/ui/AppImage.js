'use client';

import Image from 'next/image';

const FALLBACK_SIZES = {
  avatar: '(max-width: 768px) 40px, 48px',
  thumb: '(max-width: 768px) 96px, 120px',
  full: '100vw',
  icon: '32px',
};

function isObjectUrl(src) {
  return typeof src === 'string' && src.startsWith('blob:');
}

export default function AppImage({
  src,
  alt,
  fill = false,
  width,
  height,
  sizes,
  className = '',
  style,
  priority = false,
  unoptimized,
  fallback = null,
  objectFit = 'cover',
}) {
  if (!src) return fallback;

  const computedFill = fill || isObjectUrl(src);
  const computedUnoptimized = typeof unoptimized === 'boolean' ? unoptimized : isObjectUrl(src) || src.startsWith('data:');

  return (
    <Image
      src={src}
      alt={alt || ''}
      fill={computedFill}
      width={computedFill ? undefined : width}
      height={computedFill ? undefined : height}
      sizes={sizes || (computedFill ? FALLBACK_SIZES.full : undefined)}
      priority={priority}
      unoptimized={computedUnoptimized}
      className={className}
      style={{
        objectFit,
        ...style,
      }}
    />
  );
}
