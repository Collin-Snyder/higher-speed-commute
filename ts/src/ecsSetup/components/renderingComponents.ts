export const Renderable = {
  properties: {
    spriteX: 0,
    spriteY: 0,
    spriteW: 25,
    spriteH: 25,
    renderW: 25,
    renderH: 25,
    alpha: 1,
    bgColor: `rgba(0, 0, 0, 0)`,
    visible: true,
    prevSpriteName: null,
    degrees: 0,
    radians: 0,
    breakpointScale: 1,
  },
};

export const Breakpoint = {
  multiset: true,
  properties: {
    name: "regularBreakpoint",
    width: 0,
    height: 0,
    tileSize: 0,
    scale: 1,
  },
};

export const ViewBox = {
  properties: {
    x: 0,
    y: 0,
    w: 0,
    h: 0,
  },
};

export const Border = {
  properties: {
    weight: 0,
    radius: 0,
  },
};
