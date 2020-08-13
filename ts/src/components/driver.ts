export const Coordinates = {
  properties: {
    X: 0,
    Y: 0
  }
}

export const Car = {
  properties: {
    color: ""
  },
};

export const Caffeination = {
  properties: {
    caffeineLevel: 0,
    max: 4,
  },
};

export const Velocity = {
  properties: {
    speedConstant: 2,
    vector: {
      X: 0,
      Y: 0,
    },
  },
};

export const Renderable = {
  properties: {
    spriteWidth: 25,
    spriteHeight: 25,
    renderWidth: 25,
    renderHeight: 25
  },
};

export const Path = {
  properties: {
    driver: "",
    path: [],
  },
};
