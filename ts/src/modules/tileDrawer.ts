export const drawTileMap = (
  tiles: any,
  widthInSquares: number,
  drawFunc: Function
) => {
  let x = 0,
    y = 0;
  for (let tile of tiles) {
    let { type } = tile;
    if (type) {
      if (typeof type === "string") {
        drawFunc(type, x, y);
      } else if (Array.isArray(type)) {
        type.forEach((t: string) => {
          drawFunc(t, x, y);
        });
      }
    }
    if (++x >= widthInSquares) {
      x = 0;
      y++;
    }
  }
};
