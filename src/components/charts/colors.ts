import { useTheme } from '@/theme/ThemeProvider';

/** Class colours (validated for colour-vision deficiency in both themes) as RGB for canvas use. */
const CLASS_RGB = {
  dark: [
    [15, 165, 150],
    [196, 114, 6],
    [139, 92, 246],
    [236, 72, 153],
  ],
  light: [
    [13, 148, 136],
    [217, 119, 6],
    [124, 58, 237],
    [219, 39, 119],
  ],
} as const;

export const classVar = (c: number) => `var(--c-class-${((c % 4) + 4) % 4})`;

export function usePalette() {
  const { theme } = useTheme();
  const rgb = CLASS_RGB[theme];
  return {
    theme,
    classRGB: rgb,
    /** Pre-blended plot background for heatmaps. */
    plotRGB: theme === 'dark' ? ([10, 19, 38] as const) : ([251, 252, 254] as const),
    regionAlpha: theme === 'dark' ? 0.34 : 0.22,
  };
}

/** Linear blend of class colours by probability weights, composited onto the plot background. */
export function blendClasses(
  weights: readonly number[],
  rgb: readonly (readonly number[])[],
  bg: readonly number[],
  alpha: number,
): [number, number, number] {
  let r = 0;
  let g = 0;
  let b = 0;
  weights.forEach((w, c) => {
    r += w * rgb[c % rgb.length][0];
    g += w * rgb[c % rgb.length][1];
    b += w * rgb[c % rgb.length][2];
  });
  return [bg[0] * (1 - alpha) + r * alpha, bg[1] * (1 - alpha) + g * alpha, bg[2] * (1 - alpha) + b * alpha];
}
