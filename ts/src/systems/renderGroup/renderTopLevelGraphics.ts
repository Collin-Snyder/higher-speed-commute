import EntityComponentSystem, { Entity, ECS } from "@fritzy/ecs";
import { Game } from "../../main";
import { centerWithin, degreesToRadians } from "gameMath";
import { capitalize } from "gameHelpers";
const { abs } = Math;

class RenderTopLevelGraphics extends EntityComponentSystem.System {
  static query: { has?: string[]; hasnt?: string[] } = {
    has: ["Coordinates", "Renderable", "anim"],
  };
  private ctx: CanvasRenderingContext2D;

  constructor(private _game: Game, ecs: ECS, ctx: CanvasRenderingContext2D) {
    super(ecs);
    this.ctx = ctx;
  }

  update(tick: number, entities: Set<Entity>) {
    //will render countdown numbers
    for (let entity of entities) {
      let { x, y } = centerWithin(
        0,
        0,
        window.innerWidth,
        window.innerHeight,
        entity.Renderable.renderW,
        entity.Renderable.renderH
      );
      entity.Coordinates.X = x;
      entity.Coordinates.Y = y;

      this.ctx.save();
      this.ctx.globalAlpha = entity.Renderable.alpha;
      this.ctx.drawImage(
        this._game.spriteSheet,
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
    if (this._game.mode === "designing") this.renderSelectors();
  }

  renderSelectors() {
    let selectors = this.ecs.queryEntities({
      has: ["Selector", "Renderable", "Coordinates"],
    });
    for (let entity of selectors) {
      if (!entity.Selector.focusEntity) continue;
      let {
        Selector: { style, focusEntity, gap },
        Renderable,
        Coordinates,
      } = entity;

      if (this._game.breakpoint === "small") gap = 12

      let selectorWidth = focusEntity.Renderable.renderW + gap * 2;
      let selectorHeight = focusEntity.Renderable.renderH + gap * 2;
      let buttonX = focusEntity.Coordinates.X;
      let buttonY = focusEntity.Coordinates.Y;

      let sprite = <ISprite>(
        this._game.spriteMap.getSprite(
          `${style}Selector${capitalize(this._game.breakpoint)}`
        )
      );

      Renderable.renderW = sprite.w;
      Renderable.renderH = sprite.h;

      Coordinates.X += (buttonX - gap - Coordinates.X) * (1 / 3);
      Coordinates.Y += (buttonY - gap - Coordinates.Y) * (1 / 3);

      let UL = {
        x: Coordinates.X,
        y: Coordinates.Y,
        deg: 0,
      };
      let UR = {
        x: Coordinates.X + selectorWidth - Renderable.renderW,
        y: Coordinates.Y,
        deg: 90,
      };
      let DR = {
        x: UR.x,
        y: Coordinates.Y + selectorHeight - Renderable.renderW,
        deg: 180,
      };
      let DL = {
        x: UL.x,
        y: DR.y,
        deg: 270,
      };

      let corners = [UL, UR, DR, DL];

      for (let corner of corners) {
        this.ctx.save();
        let transX = Math.floor(corner.x + Renderable.renderW / 2);
        let transY = Math.floor(corner.y + Renderable.renderH / 2);

        this.ctx.translate(transX, transY);
        this.ctx.rotate(degreesToRadians(corner.deg));
        this.ctx.translate(-transX, -transY);

        this.ctx.drawImage(
          this._game.spriteSheet,
          sprite.x,
          sprite.y,
          sprite.w,
          sprite.h,
          Math.floor(corner.x),
          Math.floor(corner.y),
          Math.floor(Renderable.renderW),
          Math.floor(Renderable.renderH)
        );
        this.ctx.restore();
      }
    }
  }
}

export default RenderTopLevelGraphics;
