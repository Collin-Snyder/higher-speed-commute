import EntityComponentSystem from "@fritzy/ecs";
class RenderBackground extends EntityComponentSystem.System {
    constructor(_game, ecs, ctx) {
        super(ecs);
        this._game = _game;
        this.ctx = ctx;
    }
    update(tick, entities) {
        let layers = this.ecs.getEntity("bg").ParallaxLayer;
        this.ctx.fillStyle = "#b8d5ff";
        this.ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
        if (this._game.backgroundIsLoaded) {
            for (let layer of layers) {
                this.drawLayer(this._game.background, layer);
            }
        }
    }
    drawLayer(bg, l) {
        let { X, Y, width, height, offset } = l;
        let renderH = (height / (width / 2)) * window.innerWidth;
        this.ctx.drawImage(bg, X + offset, Y, width / 2, height, 0, window.innerHeight - renderH, window.innerWidth, renderH);
    }
}
export default RenderBackground;
