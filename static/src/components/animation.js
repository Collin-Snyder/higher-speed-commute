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
        aOffset: 0,
        degOffset: 0,
        xStep: 0,
        yStep: 0,
        degStep: 0,
        aStep: 0,
    },
};
export const AnimationReal = {
    multiset: true,
    properties: {
        duration: 0,
        startTime: 0,
        keyframes: [],
        repeat: "none",
        direction: "forward",
        easing: "none" //options: "in", "out", "inOut"
    }
};
