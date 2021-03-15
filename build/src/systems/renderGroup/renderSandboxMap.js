import EntityComponentSystem from "@fritzy/ecs";
import { drawTileMap } from "../../modules/tileDrawer";
class RenderSandboxMap extends EntityComponentSystem.System {
    constructor(_game, ecs, ctx) {
        super(ecs);
        this._game = _game;
        this.ctx = ctx;
        this.tileColors = {
            street: "#1e1e1e",
            schoolZone: "#988612",
            playerHome: "#0058cf",
            bossHome: "#eb3626",
            office: "#f0d31a",
        };
    }
    update(tick, entities) {
        let { mode, designModule, spriteSheet, spriteMap } = this._game;
        if (this.changes.length > 0)
            console.log(this.changes);
        if (mode !== "designing")
            return;
        let mapEntity = this.ecs.getEntity("map");
        let { TileData: { tiles, tileWidth, tileHeight }, MapData: { map }, Coordinates: { X, Y }, Renderable: { renderW, renderH }, } = mapEntity;
        this.ctx.fillStyle = "lightgray";
        this.ctx.fillRect(X, Y, renderW, renderH);
        tiles = tiles.map((t) => {
            t.w = tileWidth;
            t.h = tileHeight;
            return t;
        });
        drawTileMap(tiles, map.width, (type, x, y, w, h, a, deg) => {
            if (type === "greenLight" || type === "coffee")
                return;
            this.ctx.fillStyle = this.tileColors[type];
            this.ctx.fillRect(x * tileWidth + X, y * tileHeight + Y, w, h);
        });
        if (designModule.gridLoaded) {
            this.ctx.drawImage(designModule.gridOverlay, X, Y, renderW, renderH);
        }
        drawTileMap(tiles, map.width, (type, x, y, w, h, a, deg) => {
            if (type !== "greenLight" && type !== "coffee")
                return;
            let sprite = type === "greenLight" ? spriteMap.getSprite("designLight") : spriteMap.getSprite("coffee");
            this.ctx.drawImage(spriteSheet, sprite.x, sprite.y, sprite.w, sprite.h, x * tileWidth + X, y * tileHeight + Y, w, h);
        });
    }
}
export default RenderSandboxMap;
