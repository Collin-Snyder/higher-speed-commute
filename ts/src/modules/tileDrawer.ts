import { TileInterface, Tile } from "../state/map";

export const drawTileMap = (
  tiles: TileInterface[],
  widthInSquares: number,
  drawFunc: (
    type: Tile,
    x: number,
    y: number,
    w: number,
    h: number,
    a: number,
    deg: number
  ) => void
) => {
  let x = 0,
    y = 0;
  for (let tile of tiles) {
    let { type, w, h, a, deg, display } = tile;
    if (display && type) {
      if (typeof type === "string") {
        drawFunc(type, x, y, w, h, a, deg);
      } else if (Array.isArray(type)) {
        type.forEach((t: Tile) => {
          drawFunc(t, x, y, w, h, a, deg);
        });
      }
    }
    if (++x >= widthInSquares) {
      x = 0;
      y++;
    }
  }
};
