import { Vec2 } from 'cc';
import { Coordinate } from '../interface/map';

/**
 * Checks whether vec2 is on the left (returns +1) or on the right (returns -1) side of vec1
 * @param vec1
 * @param vec2
 * @returns +1 or -1
 */
export function getOrientationBetweenVector(vec1: Vec2, vec2: Vec2) {
  const value = vec1.x * vec2.y - vec1.y * vec2.x;
  return Math.sign(value) || 1;
}

export function calculateAngleBetweenTwoDots(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
) {
  const deltaX = x1 - x2;
  const deltaY = y1 - y2;
  return Math.atan2(deltaY, deltaX);
}

export function calculateDistanceBetweenTwoDots(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
) {
  const deltaX = x1 - x2;
  const deltaY = y1 - y2;
  return calculateVectorMagnitude(deltaX, deltaY);
}

export function calculateVectorMagnitude(x: number, y: number) {
  return Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
}

export function normalize(x: number, y: number) {
  const magnitude = calculateVectorMagnitude(x, y);
  return {
    x: magnitude === 0 ? 0 : x / magnitude,
    y: magnitude === 0 ? 0 : y / magnitude,
    magnitude,
  };
}

/**
 * Checks axis-aligned bounding box collision between 2 boxes
 * Assumption: origin is (0.5, 0.5)
 * @param x1zero
 * @param y1zero
 * @param width1
 * @param height1
 * @param x2zero
 * @param y2zero
 * @param width2
 * @param height2
 * @returns true if collision happens, false if no collision happens
 */
export function checkAABBCollision(
  x1: number,
  y1: number,
  width1: number,
  height1: number,
  x2: number,
  y2: number,
  width2: number,
  height2: number,
) {
  /**
   * x1 and y1 with origin (0, 0)
   */
  const x1zero = x1 - width1 * 0.5;
  const y1zero = y1 - height1 * 0.5;

  /**
   * x2 and y2 with origin (0, 0)
   */
  const x2zero = x2 - width2 * 0.5;
  const y2zero = y2 - height2 * 0.5;

  const collisionX = x1zero + width1 >= x2zero && x2zero + width2 >= x1zero;

  const collisionY = y1zero + height1 >= y2zero && y2zero + height2 >= y1zero;

  return collisionX && collisionY;
}

export function getCircleOverlap(
  x1: number,
  y1: number,
  radius1: number,
  x2: number,
  y2: number,
  radius2: number,
) {
  const distance = calculateDistanceBetweenTwoDots(x1, y1, x2, y2);

  return radius1 + radius2 - distance;
}

export function checkCircleCollision(
  x1: number,
  y1: number,
  radius1: number,
  x2: number,
  y2: number,
  radius2: number,
) {
  return getCircleOverlap(x1, y1, radius1, x2, y2, radius2) >= 0;
}

export function getPositionInsideRadius(maxRadius: number, coord: Coordinate) {
  const randomRadius = getRandomIntInRange(maxRadius, 0);
  const angle = Math.random() * Math.PI * 2;

  return {
    x: Math.cos(angle) * randomRadius + coord.x,
    y: Math.sin(angle) * randomRadius + coord.y,
  };
}

export function getRandomIntInRange(max: number, min: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}