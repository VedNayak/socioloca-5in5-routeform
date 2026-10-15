/** Camera, projection and wave adapted from the user's 21st.dev Contribution Skyline.
 * The consumer assembles original cargo geometry, rather than chart data. */
export const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const easeInOutCubic = (x: number) => {
  const t = clamp01(x);
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};
export const riseAt = (
  t: number,
  column: number,
  columns: number,
  row: number,
  rows: number,
) => {
  const delay =
    (column / Math.max(1, columns - 1)) * 0.36 +
    (row / Math.max(1, rows - 1)) * 0.06;
  return 1 - Math.pow(1 - clamp01((t - delay) / 0.58), 3);
};
export const camera = (e: number, yaw = 0, elevation = 0) => {
  const y = lerp(0, Math.PI / 4 + yaw, e);
  const a = lerp(Math.PI / 2, (34 * Math.PI) / 180 + elevation, e);
  return { cs: Math.cos(y), sn: Math.sin(y), se: Math.sin(a), ce: Math.cos(a) };
};
export type Camera = ReturnType<typeof camera>;
export const project = (
  c: Camera,
  x: number,
  y: number,
  z: number,
): [number, number] => [
  x * c.cs - y * c.sn,
  (x * c.sn + y * c.cs) * c.se - z * c.ce,
];
