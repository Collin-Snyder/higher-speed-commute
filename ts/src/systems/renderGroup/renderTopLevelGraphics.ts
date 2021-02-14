import EntityComponentSystem, { Entity, ECS } from "@fritzy/ecs";
import { Game } from "../../main";
import { alignCenter, centerWithin } from "../../modules/gameMath";

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
    let { game } = this.ecs.getEntity("global").Global;
    //will render countdown numbers
    for (let entity of entities) {
        let { x, y } = alignCenter(
          0,
          0,
          window.innerWidth,
          window.innerHeight,
          entity.Renderable.renderW,
          entity.Renderable.renderH,
        );
        entity.Coordinates.X = x;
        entity.Coordinates.Y = y;

      this.ctx.save();
      this.ctx.globalAlpha = entity.Renderable.alpha;
      this.ctx.drawImage(
        game.spriteSheet,
        entity.Renderable.spriteX,
        entity.Renderable.spriteY,
        entity.Renderable.spriteW,
        entity.Renderable.spriteH,
        entity.Coordinates.X,
        entity.Coordinates.Y,
        entity.Renderable.renderW,
        entity.Renderable.renderH
      );
      this.ctx.restore();
    }
  }
}

export default RenderTopLevelGraphics;
