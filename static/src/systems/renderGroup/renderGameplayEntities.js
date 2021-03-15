import EntityComponentSystem from "@fritzy/ecs";
class RenderGameplayEntities extends EntityComponentSystem.System {
    constructor(_game, ecs, ctx, canvas) {
        super(ecs);
        this._game = _game;
        this.ctx = ctx;
        this.canvas = canvas;
    }
    update(tick, entities) {
        const mode = this._game.mode;
        if (mode === "playing" || mode === "levelStartAnimation") {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            for (let entity of entities) {
                let { Renderable: { visible, renderW, renderH, spriteX, spriteY, spriteW, spriteH, }, Coordinates: { X, Y }, } = entity;
                if (spriteX === 0 && spriteY === 0)
                    continue;
                if (visible && entity.id !== "countdown") {
                    if (entity.Color) {
                        this.drawLightTile(entity.Color.color, X, Y, renderW, renderH);
                    }
                    this.ctx.drawImage(this._game.spriteSheet, spriteX, spriteY, spriteW, spriteH, X, Y, renderW, renderH);
                }
            }
        }
    }
    drawLightTile(color, x, y, w, h) {
        this.ctx.save();
        this.ctx.globalAlpha = 0.3;
        switch (color) {
            case "red":
                this.ctx.fillStyle = "#ff0000";
                break;
            case "yellow":
                this.ctx.fillStyle = "#ffcc00";
                break;
            case "green":
            default:
                this.ctx.fillStyle = "#00ff00";
        }
        this.ctx.fillRect(x, y, w, h);
        this.ctx.restore();
    }
}
RenderGameplayEntities.query = {
    has: ["Coordinates", "Renderable"],
    hasnt: ["Button", "Car", "MapData"],
};
export default RenderGameplayEntities;
