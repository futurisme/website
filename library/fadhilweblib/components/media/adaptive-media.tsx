import type React from 'react';
import type { AdaptiveMediaProps, LayoutElement } from '../../core/types';
import { cx } from '../../core/cx';
import { composeSyntax, resolveSyntax } from '../../core/syntax';
import styles from './adaptive-media-module.css';

function resolveAspectRatioValue(value: AdaptiveMediaProps['aspectRatio']) {
  if (value === undefined) {
    return undefined;
  }

  return typeof value === 'number' ? String(value) : value;
}

export function AdaptiveMedia({
  as = 'figure',
  alt,
  src,
  sources,
  srcSet,
  sizes,
  width,
  height,
  loading = 'lazy',
  decoding = 'async',
  fetchPriority,
  fit = 'cover',
  position = '50% 50%',
  aspectRatio,
  density = 'comfortable',
  caption,
  query = true,
  syntax,
  slotSyntax,
  recipe,
  className,
  style,
  ...props
}: AdaptiveMediaProps) {
  const Component = as as LayoutElement;
  const rootSyntax = resolveSyntax(composeSyntax(recipe?.syntax, syntax));
  const pictureSyntax = resolveSyntax(composeSyntax(recipe?.slotSyntax?.picture, slotSyntax?.picture));
  const mediaSyntax = resolveSyntax(composeSyntax(recipe?.slotSyntax?.media, slotSyntax?.media));
  const captionSyntax = resolveSyntax(composeSyntax(recipe?.slotSyntax?.caption, slotSyntax?.caption));
  const finalDensity = recipe?.logic?.density ?? density;
  const finalQuery = recipe?.logic?.query ?? query;
  const mediaAttrs = mediaSyntax.attrs as Record<string, unknown>;
  const imageSrcSet = srcSet ?? (typeof mediaAttrs.srcSet === 'string' ? mediaAttrs.srcSet : undefined);
  const imageSizes = sizes ?? (typeof mediaAttrs.sizes === 'string' ? mediaAttrs.sizes : undefined);
  const imageFetchPriority = fetchPriority ?? (mediaAttrs.fetchPriority as AdaptiveMediaProps['fetchPriority'] | undefined);
  const imageDecoding = decoding ?? (mediaAttrs.decoding as AdaptiveMediaProps['decoding'] | undefined);

  return (
    <Component
      {...(recipe?.attrs as Record<string, unknown> | undefined)}
      {...(rootSyntax.attrs as Record<string, unknown> | undefined)}
      {...props}
      className={cx(styles.root, className)}
      style={{
        '--fwlb-media-ratio': resolveAspectRatioValue(aspectRatio),
        '--fwlb-media-fit': fit,
        '--fwlb-media-position': position,
        ...rootSyntax.style,
        ...style,
      } as React.CSSProperties}
      data-density={finalDensity}
      data-query={finalQuery ? 'true' : 'false'}
      data-slot={(props as Record<string, unknown>)['data-slot'] ?? 'adaptive-media'}
    >
      <picture className={styles.picture} style={pictureSyntax.style} data-slot="adaptive-media-picture">
        {sources?.map((source) => (
          <source
            key={`${source.media ?? 'default'}:${source.srcSet}`}
            media={source.media}
            sizes={source.sizes}
            srcSet={source.srcSet}
            type={source.type}
          />
        ))}
        <img
          {...mediaAttrs}
          className={styles.media}
          style={mediaSyntax.style}
          src={src}
          srcSet={imageSrcSet}
          sizes={imageSizes}
          width={width}
          height={height}
          alt={alt}
          loading={loading}
          decoding={imageDecoding}
          fetchPriority={imageFetchPriority}
          data-slot="adaptive-media-image"
        />
      </picture>
      {caption ? (
        <figcaption className={styles.caption} style={captionSyntax.style} data-slot="adaptive-media-caption">
          {caption}
        </figcaption>
      ) : null}
    </Component>
  );
}
