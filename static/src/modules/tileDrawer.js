export const drawTileMap = (tiles, widthInSquares, drawFunc) => {
    let x = 0, y = 0;
    for (let tile of tiles) {
        let { type, w, h, a, deg, display } = tile;
        if (display && type) {
            if (typeof type === "string") {
                drawFunc(type, x, y, w, h, a, deg);
            }
            else if (Array.isArray(type)) {
                type.forEach((t) => {
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
export const forEachMapTile = (cb) => {
    let x = 0, y = 0, idx = 0, tileSize = 25;
    while (idx < 1000) {
        cb(idx, x, y, tileSize, tileSize);
        x += tileSize;
        if (x >= 1000) {
            x = 0;
            y += tileSize;
        }
        idx++;
    }
};
