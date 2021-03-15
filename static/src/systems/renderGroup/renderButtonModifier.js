import EntityComponentSystem from "@fritzy/ecs";
class RenderButtonModifiers extends EntityComponentSystem.System {
    constructor(ecs, ctx) {
        super(ecs);
        this.ctx = ctx;
    }
    update(tick, entities) {
        const global = this.ecs.getEntity("global").Global;
        for (let entity of entities) {
            //render selected design tool selection indicator
            if (entity.has("Disabled")) {
                const image = this.ctx.getImageData(entity.Coordinates.X, entity.Coordinates.Y, entity.Renderable.renderWidth, entity.Renderable.renderHeight);
                const { data } = image;
                for (let p = 0; p < data.length; p += 4) {
                    const r = data[p];
                    const g = data[p + 1];
                    const b = data[p + 2];
                    const a = data[p + 3];
                    if (r === 255 && g === 103 && b === 0) {
                        let { bgColor } = entity.Disabled;
                        data[p] = bgColor.r;
                        data[p + 1] = bgColor.g;
                        data[p + 2] = bgColor.b;
                        data[p + 3] = bgColor.a;
                    }
                    else if (r === 255 && g === 255 && b === 255) {
                        let { textColor } = entity.Disabled;
                        data[p] = textColor.r;
                        data[p + 1] = textColor.g;
                        data[p + 2] = textColor.b;
                        data[p + 3] = textColor.a;
                    }
                }
                this.ctx.putImageData(image, entity.Coordinates.X, entity.Coordinates.Y);
            }
            else if (entity.Button.name === global.game.designModule.selectedTool &&
                global.game.mode === "designing") {
                this.ctx.beginPath();
                this.ctx.lineWidth = 3;
                this.ctx.strokeStyle = "yellow";
                this.ctx.rect(entity.Coordinates.X - this.ctx.lineWidth, entity.Coordinates.Y - this.ctx.lineWidth, entity.Renderable.renderWidth + 2 * this.ctx.lineWidth, entity.Renderable.renderHeight + 2 * this.ctx.lineWidth);
                this.ctx.stroke();
            }
        }
    }
}
RenderButtonModifiers.query = { has: ["Button"] };
export default RenderButtonModifiers;
