export const Map = {
  properties: {
    mapId: null,
    name: "",
    width: 40,
    height: 25,
    map: null,
    background: null
  }
}

export const TileMap = {
  properties: {
    tiles: [],
    tileWidth: 25,
    tileHeight: 25,
  },
};

export const Tile = {
  multiset: true,
  properties: {
    type: "",
    alpha: 1,
    
  }
}

export const ViewBox = {
  properties: {
    x: 0,
    y: 0,
    w: 0,
    h: 0
  }
}

export const Border = {
  properties: {
    weight: 0,
    radius: 0,
  }
}

export const Canvas = {
  properties: {
    canvas: null,
    ctx: null,
  }
};

export const Drawable = {
  properties: {
    onDrawStart: function () {},
    onDraw: function () {},
    onDrawEnd: function () {}
  }
}