// src/utils/splineInterpolation.ts

/**
 * Catmull-Rom Spline Interpolation
 * Calculates the position at time t (0 to 1) between p1 and p2,
 * using p0 and p3 as control points.
 */
export function catmullRom(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const v0 = (p2 - p0) * 0.5;
  const v1 = (p3 - p1) * 0.5;
  const t2 = t * t;
  const t3 = t * t2;
  
  return (2 * p1 - 2 * p2 + v0 + v1) * t3 
       + (-3 * p1 + 3 * p2 - 2 * v0 - v1) * t2 
       + v0 * t 
       + p1;
}

/**
 * Calculates the instantaneous velocity (derivative) at time t.
 * Essential for making your arrows/vectors point in the direction of the curve.
 */
export function catmullRomDerivative(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const v0 = (p2 - p0) * 0.5;
  const v1 = (p3 - p1) * 0.5;
  const t2 = t * t;

  return (2 * p1 - 2 * p2 + v0 + v1) * 3 * t2 
       + (-3 * p1 + 3 * p2 - 2 * v0 - v1) * 2 * t 
       + v0;
}
