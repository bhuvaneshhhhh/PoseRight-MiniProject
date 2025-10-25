
import type { Landmark } from '@mediapipe/tasks-vision';

/**
 * Calculates the angle between three 3D points.
 * @param p1 The first point (e.g., shoulder).
 * @param p2 The second point, the vertex of the angle (e.g., elbow).
 * @param p3 The third point (e.g., wrist).
 * @returns The angle in degrees.
 */
export function calculateAngle(p1: Landmark, p2: Landmark, p3: Landmark): number {
  // Vectors
  const v1 = { x: p1.x - p2.x, y: p1.y - p2.y, z: p1.z - p2.z };
  const v2 = { x: p3.x - p2.x, y: p3.y - p2.y, z: p3.z - p2.z };

  // Dot product
  const dotProduct = v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;

  // Magnitudes
  const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y + v1.z * v1.z);
  const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y + v2.z * v2.z);

  // Cosine of the angle
  const cosAngle = dotProduct / (mag1 * mag2);

  // Angle in radians
  const angleRad = Math.acos(cosAngle);

  // Convert to degrees
  const angleDeg = angleRad * (180 / Math.PI);

  return angleDeg;
}
