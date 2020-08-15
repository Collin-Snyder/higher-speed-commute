import { Entity } from "@fritzy/ecs";
const abs = Math.abs;

export function calculateSpeedConstant(entity: Entity): number {
  return entity.SchoolZone
    ? entity.Velocity.speedConstant * entity.SchoolZone.multiplier
    : entity.Velocity.speedConstant;
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
