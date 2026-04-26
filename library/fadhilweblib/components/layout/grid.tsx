import type React from 'react';
import type { GridProps, LayoutElement } from '../../core/types';
import { cx } from '../../core/cx';
import { resolveLengthValue, resolveSpaceValue } from '../../core/space';
import { composeSyntax, resolveSyntax } from '../../core/syntax';
import styles from './grid-module.css';

function resolveGridColumns(columns: GridProps['columns']) {
  if (typeof columns === 'number') {
    return `repeat(${columns}, minmax(0, 1fr))`;
  }

  return columns;
}

export function Grid({
  as = 'div',
  columns,
  minItemWidth,
  maxItemWidth,
  trackMode = 'fit',
  gap = 'md',
  rowGap,
  columnGap,
  align,
  justify,
  dense = false,
  syntax,
  recipe,
  className,
  style,
  children,
  ...props
}: GridProps) {
  const Component = as as LayoutElement;
  const rootSyntax = resolveSyntax(composeSyntax(recipe?.syntax, syntax));
  const finalAlign = rootSyntax.semantics.align ?? align ?? recipe?.logic?.align ?? 'stretch';
  const finalJustify = rootSyntax.semantics.justify ?? justify ?? recipe?.logic?.justify ?? 'start';
  const finalDense = recipe?.logic?.dense ?? dense;
  const minTrack = resolveLengthValue(minItemWidth);
  const maxTrack = resolveLengthValue(maxItemWidth) ?? '1fr';
  const templateColumns = minItemWidth
    ? `repeat(auto-${trackMode}, minmax(min(100%, ${minTrack}), ${maxTrack}))`
    : resolveGridColumns(columns) ?? 'repeat(1, minmax(0, 1fr))';

  return (
    <Component
      {...(recipe?.attrs as Record<string, unknown> | undefined)}
      {...(rootSyntax.attrs as Record<string, unknown> | undefined)}
      {...props}
      className={cx(styles.root, className)}
      style={{
        '--fwlb-gap': resolveSpaceValue(gap),
        '--fwlb-row-gap': resolveSpaceValue(rowGap ?? gap),
        '--fwlb-column-gap': resolveSpaceValue(columnGap ?? gap),
        gridTemplateColumns: templateColumns,
        gridAutoFlow: finalDense ? 'row dense' : undefined,
        ...rootSyntax.style,
        ...style,
      } as React.CSSProperties}
      data-align={finalAlign}
      data-justify={finalJustify}
      data-dense={finalDense ? 'true' : 'false'}
      data-slot={(props as Record<string, unknown>)['data-slot'] ?? 'grid'}
    >
      {children}
    </Component>
  );
}
