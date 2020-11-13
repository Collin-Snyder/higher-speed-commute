interface AnimationFrameInterface {
  spriteX: number;
  spriteY: number;
  spriteW: number;
  spriteH: number;
  alpha: number;
  frameAction: Function;
}

export const ParallaxLayer = {
  properties: {
    name: null,
    X: 0,
    Y: 0,
    height: 0,
    width: 0,
    step: 0,
    offset: 0,
  },
  multiset: true,
};

export const Animation = {
  properties: {
    currentFrame: 0,
    frameStep: 0,
    frames: [],
    loop: false,
    startSprite: { X: 0, Y: 0 },
    xOffset: 0,
    yOffset: 0,
    degOffset: 0,
    xStep: 0,
    yStep: 0,
    degStep: 0,
  },
};

//maybe have separate animation components - Animation vs AnimationFrame
//all animating entities have an Animation component
//some entities can have AnimationFrame components - discrete system for handling frame-based animation

export const AnimationFrame = {
  multiset: true,
  properties: {
    spriteX: 0,
    spriteY: 0,
    spriteW: 0,
    spriteH: 0,
    alpha: 1,
    frameAction: null, //can pass function here to be run in lieu of subbing out sprites
  },
};
