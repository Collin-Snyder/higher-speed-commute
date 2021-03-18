export const Button = {
  properties: {
    name: "",
    enabled: true,
    selectable: false,
    depressed: false,
  },
};

export const Text = {
  properties: {
    textSpriteX: -1,
    textSpriteY: -1,
    textSpriteW: 0,
    textSpriteH: 0,
    textRenderX: -1,
    textRenderY: -1,
    textRenderW: 0,
    textRenderH: 0,
  },
};

export const Interactable = {
  properties: {
    enabled: true,
    onHover: () => {},
    onMouseEnter: () => {},
    onMouseLeave: () => {},
    onMouseDown: () => {},
    onMouseUp: () => {},
    onClick: () => {},
    onDrag: () => {},
    onDragStart: () => {},
    onDragEnd: () => {},
  },
};

export const Selector = {
  properties: {
    style: "default",
    focusEntity: null,
    gap: 0,
  },
};

export const Tooltip = {
  properties: {
    text: "",
    textSize: 10,
    waitTime: 1000,
    fadeStep: 0.1,
    fadeOut: false,
    opacity: 0,
    coordinates: { x: -1, y: -1 },
  },
};
