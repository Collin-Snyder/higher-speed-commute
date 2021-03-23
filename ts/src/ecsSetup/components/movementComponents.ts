export const Coordinates = {
  properties: {
    X: 0,
    Y: 0,
    prevX: 0,
    prevY: 0,
  },
};

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
    prevHb: [],
    cp: { X: 0, Y: 0 },
    currentHb: () => {},
    currentCp: () => {},
  },
};
