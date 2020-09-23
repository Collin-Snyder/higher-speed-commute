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

export function checkForMouseCollision(
  mx: number,
  my: number,
  ex: number,
  ey: number,
  ew: number,
  eh: number
) {
  return mx >= ex && my >= ey && mx <= ex + ew && my <= ey + eh;
}

export function findCenteredElementSpread(
  p: number,
  e: number,
  n: number,
  style: "spaceEvenly" | "spaceBetween",
  c?: number
) {
  //requires that elements have uniform dimension - either height or width
  //p is parent dimension - either the width or height of containing element, depending on if centering horizontally or vertically
  //e is element dimension - either width or height of elements to be centered
  //n is number of elements to be arranged
  //c is container dimension - if it's present, center elements according to container and adjust to center container within parent element
  let output = { start: 0, step: 0 };
  let container = c ? (c < p ? c : p) : p;
  let total = n * e;
  if (total > container) {
    console.log(
      "You are trying to place too many elements into too small of a container."
    );
    return output;
  }
  let space = container - total;

  if (style === "spaceBetween") {
    output.step = space / (n - 1);
  } else if (style === "spaceEvenly") {
    output.step = space / (n + 1);
    output.start = output.step;
  }
  output.step += e;

  if (c && c < p) {
    let cStart = (p - c) / 2;
    output.start += cStart;
  }

  output.start = Math.floor(output.start);
  output.step = Math.floor(output.step);

  return output;
}

export function randomNumBtwn(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

export function centerWithin(
  cx: number,
  cy: number,
  cw: number,
  ch: number,
  ew: number,
  eh: number,
  n: number,
  dir: "vertical" | "horizontal",
  style: "spaceEvenly" | "spaceBetween" = "spaceEvenly"
) {
  let x = findCenteredElementSpread(
    cw,
    ew,
    dir === "horizontal" ? n : 1,
    dir === "horizontal" ? style : "spaceEvenly"
  );
  let y = findCenteredElementSpread(
    ch,
    eh,
    dir === "vertical" ? n : 1,
    dir === "vertical" ? style : "spaceEvenly"
  );

  x.start += cx;
  y.start += cy;

  // let x = dir === "horizontal" ? horiz : horiz.start;
  // let y = dir === "vertical" ? vert : vert.start;

  return {x, y};
};
