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

export const Clickable = {
  properties: {
    onClick: () => {},
  },
};

export const Draggable = {
  properties: {
    onDragStart: () => {},
    onDragEnd: () => {},
  },
};

export const DragTarget = {
  properties: {
    onDragOver: () => {},
    onDrop: () => {},
  },
};

export const Disabled = {
  properties: {
    bgColor: { r: 0, g: 0, b: 0, a: 1 },
    textColor: { r: 255, g: 255, b: 255, a: 1 },
    width: 0,
    height: 0,
  },
};
