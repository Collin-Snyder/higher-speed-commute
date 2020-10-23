export const Coordinates = {
  properties: {
    X: 0,
    Y: 0,
    prevX: 0,
    prevY: 0,
  },
};

export const Car = {
  properties: {
    color: "",
  },
};

// export const Caffeination = {
//   properties: {
//     caffeineLevel: 0,
//     max: 4,
//   },
// };

export const Velocity = {
  properties: {
    speedConstant: 2,
    vector: {
      X: 0,
      Y: 0,
    },
    prevVector: null,
    altVectors: [],
  },
};

export const Renderable = {
  properties: {
    spriteX: 0,
    spriteY: 0,
    spriteWidth: 25,
    spriteHeight: 25,
    renderWidth: 25,
    renderHeight: 25,
    alpha: 1,
    bgColor: `rgba(0, 0, 0, 0)`,
    visible: true,
    prevSpriteName: null,
    degrees: 0,
    radians: 0,
  },
};

export const Path = {
  properties: {
    driver: "",
    path: [],
    nextTarget: "",
  },
};

export const Collision = {
  properties: {
    fudgeFactor: 2,
    hb: [],
    cp: { X: 0, Y: 0 },
    currentHb: () => {},
    currentCp: () => {},
  },
};

export const SchoolZone = {
  properties: {
    multiplier: 0.5,
  },
};

export const CaffeineBoost = {
  properties: {
    wearOff: 5000,
    multiplier: 1.5,
  },
  multiset: true,
};
