import { Entity } from "@fritzy/ecs";
const abs = Math.abs;

export function calculateSpeedConstant(entity: Entity): number {
  let speed = entity.Velocity.speedConstant;
  if (entity.has("SchoolZone")) {
    return speed * entity.SchoolZone.multiplier;
  }
  if (entity.has("CaffeineBoost")) {
    for (let cb of entity.CaffeineBoost) {
      speed *= cb.multiplier;
    }
  }
  return speed;
}

export function canHasFudge(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  fudge: number
): boolean {
  return abs(x2 - x1) <= fudge && abs(y2 - y1) <= fudge;
}

export function normalize(vectors: { X: number; Y: number }[]) {
  let megaVector = vectors.reduce(
    (acc, v) => {
      return { X: acc.X + v.X, Y: acc.Y + v.Y };
    },
    { X: 0, Y: 0 }
  );
  let { X, Y } = megaVector;
  let hyp = Math.sqrt(X * X + Y * Y);
  let scale = 1 / hyp;
  return { X: X * scale, Y: Y * scale };
}

export function checkVelocityZero(v: { X: number; Y: number }) {
  return v.X === 0 && v.Y === 0;
}

export function calculateSurroundingSquareCount(layers: number) {
  let total = 0;
  while (layers > 0) {
    total += layers * 8;
    layers--;
  }
  return total;
}

export function average(nums: number[]) {
  let sum = nums.reduce((sum, n) => n + sum);
  return sum / nums.length;
}
