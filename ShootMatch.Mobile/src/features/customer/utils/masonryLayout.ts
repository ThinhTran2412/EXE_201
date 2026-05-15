export type MasonryInput = { key: string; aspectRatio: number };
export type MasonryPosition = MasonryInput & {
  top: number;
  left: number;
  width: number;
  height: number;
};

/** Bố cục 2 cột theo chiều cao cột — giống portfolio photographer */
export function buildTwoColumnMasonry(
  items: MasonryInput[],
  colWidth: number,
  gap: number,
): { positions: MasonryPosition[]; containerHeight: number } {
  let col1Height = 0;
  let col2Height = 0;
  const positions: MasonryPosition[] = [];

  for (const item of items) {
    const ratio = item.aspectRatio > 0 ? item.aspectRatio : 1;
    const height = colWidth / ratio;
    const useCol1 = col1Height <= col2Height;

    positions.push({
      ...item,
      width: colWidth,
      height,
      top: useCol1 ? col1Height : col2Height,
      left: useCol1 ? 0 : colWidth + gap,
    });

    if (useCol1) col1Height += height + gap;
    else col2Height += height + gap;
  }

  return {
    positions,
    containerHeight: Math.max(col1Height, col2Height) - gap,
  };
}

/** Bố cục 3 cột — Khoảnh khắc (giống web columns:3) */
export function buildThreeColumnMasonry(
  items: MasonryInput[],
  colWidth: number,
  gap: number,
): { positions: MasonryPosition[]; containerHeight: number } {
  const heights = [0, 0, 0];
  const positions: MasonryPosition[] = [];

  for (const item of items) {
    const ratio = item.aspectRatio > 0 ? item.aspectRatio : 1;
    const h = colWidth / ratio;
    const col = heights.indexOf(Math.min(...heights));

    positions.push({
      ...item,
      width: colWidth,
      height: h,
      top: heights[col],
      left: col * (colWidth + gap),
    });

    heights[col] += h + gap;
  }

  return {
    positions,
    containerHeight: Math.max(...heights, 0) - gap,
  };
}
