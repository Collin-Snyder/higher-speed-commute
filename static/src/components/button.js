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
        onHover: () => { },
        onMouseEnter: () => { },
        onMouseLeave: () => { },
        onMouseDown: () => { },
        onMouseUp: () => { },
        onClick: () => { },
        onDrag: () => { },
        onDragStart: () => { },
        onDragEnd: () => { },
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
export const Clickable = {
    properties: {
        onClick: () => { },
    },
};
export const Draggable = {
    properties: {
        onDragStart: () => { },
        onDragEnd: () => { },
    },
};
export const DragTarget = {
    properties: {
        onDragOver: () => { },
        onDrop: () => { },
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
