// Color utility helpers
export function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

export function rgbToRgba(r, g, b, a = 1) {
  return `rgba(${r},${g},${b},${a})`;
}

export function hexToRgba(hex, a = 1) {
  const { r, g, b } = hexToRgb(hex);
  return rgbToRgba(r, g, b, a);
}

export function lerpColor(c1, c2, t) {
  const a = hexToRgb(c1);
  const b = hexToRgb(c2);
  return {
    r: Math.round(a.r + (b.r - a.r) * t),
    g: Math.round(a.g + (b.g - a.g) * t),
    b: Math.round(a.b + (b.b - a.b) * t),
  };
}

// Level-based glow intensity
export function glowIntensity(level) {
  return Math.min(0.4 + level * 0.06, 1.0);
}
