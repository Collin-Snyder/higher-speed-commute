import EntityComponentSystem, { Entity, ECS } from "@fritzy/ecs";
import { Game } from "../../main";
import { centerWithin } from "../../modules/gameMath";

class RenderTopLevelGraphics extends EntityComponentSystem.System {
  static query: { has?: string[]; hasnt?: string[] } = {
    has: ["Coordinates", "Renderable", "anim"],
  };
  private ctx: CanvasRenderingContext2D;

  constructor(ecs: ECS, ctx: CanvasRenderingContext2D) {
    super(ecs);
    this.ctx = ctx;
  }

  update(tick: number, entities: Set<Entity>) {
    const global = this.ecs.getEntity("global").Global;
    //will render countdown numbers
    for (let entity of entities) {
      if (entity.Coordinates.X === 0 && entity.Coordinates.Y === 0) {
        let { x, y } = centerWithin(
          0,
          0,
          window.innerWidth,
          window.innerHeight,
          entity.Renderable.renderWidth,
          entity.Renderable.renderHeight,
          1,
          "vertical",
          "spaceEvenly"
        );
        entity.Coordinates.X = x.start;
        entity.Coordinates.Y = y.start;
      }
      this.ctx.save();
      this.ctx.globalAlpha = entity.Renderable.alpha;
      this.ctx.drawImage(
        global.spriteSheet,
        entity.Renderable.spriteX,
        entity.Renderable.spriteY,
        entity.Renderable.spriteWidth,
        entity.Renderable.spriteHeight,
        entity.Coordinates.X,
        entity.Coordinates.Y,
        entity.Renderable.renderWidth,
        entity.Renderable.renderHeight
      );
      this.ctx.restore();
    }
  }
}

export default RenderTopLevelGraphics;
