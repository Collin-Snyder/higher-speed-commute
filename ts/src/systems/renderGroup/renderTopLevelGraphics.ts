import EntityComponentSystem, { Entity, ECS } from "@fritzy/ecs";
import { Game } from "../../main";
import { centerWithin, degreesToRadians } from "gameMath";
const { abs } = Math;

class RenderTopLevelGraphics extends EntityComponentSystem.System {
  static query: { has?: string[]; hasnt?: string[] } = {
    has: ["Coordinates", "Renderable", "anim"],
  };
  private ctx: CanvasRenderingContext2D;
  private _game: Game;

  constructor(game: Game, ecs: ECS, ctx: CanvasRenderingContext2D) {
    super(ecs);
    this.ctx = ctx;
    this._game = game;
  }

  update(tick: number, entities: Set<Entity>) {
    let { game } = this.ecs.getEntity("global").Global;
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
    if (game.mode === "designing") this.renderSelectors();
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

      let selectorWidth = focusEntity.Renderable.renderW + gap * 2;
      let selectorHeight = focusEntity.Renderable.renderH + gap * 2;
      let buttonX = focusEntity.Coordinates.X;
      let buttonY = focusEntity.Coordinates.Y;

      let sprite = <ISprite>this._game.spriteMap.getSprite(`${style}Selector`);

      Renderable.renderW = selectorWidth / 3;
      Renderable.renderH = selectorHeight / 3;

      Coordinates.X += (buttonX - gap - Coordinates.X) * (1 / 4);
      Coordinates.Y += (buttonY - gap - Coordinates.Y) * (1 / 4);

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
        let transX = corner.x + Renderable.renderW / 2;
        let transY = corner.y + Renderable.renderH / 2;

        this.ctx.translate(transX, transY);
        this.ctx.rotate(degreesToRadians(corner.deg));
        this.ctx.translate(-transX, -transY);

        this.ctx.drawImage(
          this._game.spriteSheet,
          sprite.x,
          sprite.y,
          sprite.w,
          sprite.h,
          Math.round(corner.x),
          Math.round(corner.y),
          Math.round(Renderable.renderW),
          Math.round(Renderable.renderH)
        );
        this.ctx.restore();
      }
    }
  }
}

export default RenderTopLevelGraphics;
