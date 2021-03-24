import ECS, { Entity } from "@fritzy/ecs";
import { Game } from "../main";

export class TooltipSystem extends ECS.System {
  static query: { has?: string[]; hasnt?: string[] } = {
    has: ["Tooltip", "Coordinates", "Renderable"],
  };

  constructor(private _game: Game, ecs: any, private step: number) {
    super(ecs);
  }

  update(tick: number, entities: Set<Entity>): void {
    for (let entity of entities) {
      let { Tooltip } = entity;
      if (!this.coordinatesSet(Tooltip.coordinates))
        this.setTooltipCoordinates(entity);
      if (Tooltip.fadeOut) {
        if (Tooltip.opacity <= 0) {
          entity.removeComponentByType("Tooltip");
          continue;
        } else {
          Tooltip.opacity -= Tooltip.fadeStep;
          if (Tooltip.opacity < 0) Tooltip.opacity = 0;
        }
      } else {
        if (Tooltip.waitTime > 0) {
          Tooltip.waitTime -= this.step;
          if (Tooltip.waitTime < 0) Tooltip.waitTime = 0;
        } else if (Tooltip.opacity < 1) {
          Tooltip.opacity += Tooltip.fadeStep;
          if (Tooltip.opacity > 1) Tooltip.opacity = 1;
        }
      }
    }
  }

  coordinatesSet({ x, y }: { x: number; y: number }): boolean {
    return x >= 0 && y >= 0;
  }

  calculateTooltipDimensions() {}

  setTooltipCoordinates(entity: Entity) {
    this._game.uictx.font = "20";
    let textDimentions;
    //calculate tooltip dimensions based on text size and text content
    //align center of tooltip with center of entity
    //set tooltip x = tooltip center - tooltip width / 2
    //set tooltip y = entity y + entity height
    //return entity
  }
}
