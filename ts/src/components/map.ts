export const Map = {
  properties: {
    mapId: null,
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