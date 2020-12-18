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

export const AnimationReal = {
  multiset: true,
  properties: {
    duration: 0, //duration of one loop of the animation, in ms
    startTime: 0, //game elapsed time value when Animation component is added to entity
    keyframes: [], //a collection of keyframe objects
    repeat: "none", //options: "loop" or a number
    direction: "forward", //options: "reverse", "alternate", "reverseAlternate"
    easing: "none" //options: "in", "out", "inOut"
  }
}

export interface KeyframeInterface {
  p: number,
  [key: string]: any
}