import { Entity } from "@fritzy/ecs";
import { couldStartTrivia } from "../../../node_modules/typescript/lib/typescript";
const { abs, cos, sin } = Math;

export interface VectorInterface {
  X: number;
  Y: number;
}

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

export function normalize(vectors: VectorInterface[]): VectorInterface {
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

export function checkVelocityZero(v: VectorInterface): boolean {
  return v.X === 0 && v.Y === 0;
}

export function calculateSurroundingSquareCount(layers: number): number {
  let total = 0;
  while (layers > 0) {
    total += layers * 8;
    layers--;
  }
  return total;
}

export function average(nums: number[]): number {
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
): boolean {
  return mx >= ex && my >= ey && mx <= ex + ew && my <= ey + eh;
}

export function findCenteredElementSpread(
  p: number,
  e: number,
  n: number,
  style: "spaceEvenly" | "spaceBetween",
  c?: number
): { start: number; step: number } {
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
): { x: { start: number; step: number }; y: { start: number; step: number } } {
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

  return { x, y };
}

export function getCenterPoint(x: number, y: number, w: number, h: number) {
  return { X: x + w / 2, Y: y + h / 2 };
}

export function degreesToRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function radiansToDegrees(rad: number): number {
  return (rad * 180) / Math.PI;
}

export function scaleVector(v: VectorInterface, s: number): VectorInterface {
  return { X: v.X * s, Y: v.Y * s };
}

export function multiplyVectors(
  v1: VectorInterface,
  v2: VectorInterface
): VectorInterface {
  return { X: v1.X * v2.X, Y: v1.Y * v2.Y };
}

export function subtractVectors(
  v1: VectorInterface,
  v2: VectorInterface
): VectorInterface {
  return { X: v2.X - v1.X, Y: v2.Y - v1.Y };
}

export function dotProd(v1: VectorInterface, v2: VectorInterface): number {
  return v1.X * v2.X + v1.Y * v2.Y;
}

// export function findDegFromVector(v: VectorInterface): number {
//   //use points A, B, C
//   const a = { X: 0, Y: -1 };
//   const b = { X: 0, Y: 0 };

//   let dot = dotProd(subtractVectors(a, b), subtractVectors(b, v));
//   let ang = Math.asin(dot);
//   return radiansToDegrees(ang);
// }

export function findDegFromVector(v: VectorInterface): number {
  const { X, Y } = v;
  if (X === 0 && Y === 0) return -1;
  if (X > 0 && Y < 0) return 45;
  if (X > 0 && Y > 0) return 135;
  if (X < 0 && Y > 0) return 225;
  if (X < 0 && Y < 0) return 315;
  if (Y < 0) return 0;
  if (X > 0) return 90;
  if (Y > 0) return 180;
  if (X < 0) return 270;
  return -1;
}

// export function findRotatedVertex(
//   vx: number,
//   vy: number,
//   cx: number,
//   cy: number,
//   d: number
// ) {
//   let X = cx - vx;
//   let Y = cy - vy;
//   let r = degreesToRadians(d);

//   let hyp = Math.sqrt(X * X + Y * Y);

//   let asin = Math.asin(Y / hyp);

//   let a = asin + r;

//   X = Math.cos(a) * hyp;
//   Y = Math.sin(a) * hyp;
//   return { X, Y };
// }

export function findRotatedVertex(
  vx: number,
  vy: number,
  cx: number,
  cy: number,
  d: number
) {
  let r = degreesToRadians(d);
  let cr = cos(r);
  let sr = sin(r);
  //use cp to translate vx and vy to origin
  let ox = vx - cx;
  let oy = vy - cy;
  //new x = ox * cos(r) - oy * sin(r)
  //new y = oy * cos(r) + ox * sin(r)
  let nx = ox * cr - oy * sr;
  let ny = oy * cr + ox * sr;
  //use cp to translate new x and y back from origin
  let X = nx + cx;
  let Y = ny + cy;
  //return new vertex
  return { X, Y };
}

export function getTileHitbox(
  x: number,
  y: number,
  w: number,
  h: number
): VectorInterface[] {
  return [
    { X: x, Y: y },
    { X: x + w, Y: y },
    { X: x + w, Y: y + h },
    { X: x, Y: y + h },
  ];
}

export function checkCollision(
  hb1: VectorInterface[],
  hb2: VectorInterface[]
): boolean | VectorInterface {
  let next = 0;
  for (let curr = 0; curr < hb1.length; curr++) {
    next = curr + 1;
    if (next === hb1.length) next = 0;
    let vc = hb1[curr];
    let vn = hb1[next];
    let collision = checkSideCollision(hb2, vc.X, vc.Y, vn.X, vn.Y);
    if (collision) return true;
    collision = checkInteriorCollision(hb2, hb1[0].X, hb1[0].Y);
    if (collision) return true;
  }
  return false;
}

function checkSideCollision(
  hb: VectorInterface[],
  x1: number,
  y1: number,
  x2: number,
  y2: number
): boolean | VectorInterface {
  let next = 0;
  for (let curr = 0; curr < hb.length; curr++) {
    next = curr + 1;
    if (next === hb.length) next = 0;
    let x3 = hb[curr].X;
    let y3 = hb[curr].Y;
    let x4 = hb[next].X;
    let y4 = hb[next].Y;
    let hit = checkLineCollision(x1, y1, x2, y2, x3, y3, x4, y4);
    if (hit) return hit;
  }
  return false;
}

function checkLineCollision(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  x3: number,
  y3: number,
  x4: number,
  y4: number
): boolean | VectorInterface {
  const denominator = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
  if (denominator === 0) return false;

  let ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denominator;
  let ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denominator;
  if (ua < 0 || ua > 1 || ub < 0 || ub > 1) return false;

  let X = x1 + ua * (x2 - x1);
  let Y = y1 + ua * (y2 - y1);

  return { X, Y };
}

function checkInteriorCollision(hb: VectorInterface[], px: number, py: number) {
  let collision = false;
  let next = 0;
  for (let curr = 0; curr < hb.length; curr++) {
    next = curr + 1;
    if (next === hb.length) next = 0;
    let vc = hb[curr];
    let vn = hb[next];
    if (
      ((vc.Y > py && vn.Y < py) || (vc.Y < py && vn.Y > py)) &&
      px < ((vn.X - vc.X) * (py - vc.Y)) / (vn.Y - vc.Y) + vc.X
    ) {
      collision = !collision;
    }
  }
  return collision;
}

//@ts-ignore
Number.prototype.times = function(cb: Function) {
  for (let i = 0; i < this; i++) {
    cb(i);
  }
};
