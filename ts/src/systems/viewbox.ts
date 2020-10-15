import EntityComponentSystem, { ECS, Entity } from "@fritzy/ecs";
import { findCenteredElementSpread } from "../modules/gameMath";

export class ViewBoxSystem extends EntityComponentSystem.System {
  static query: { has?: string[]; hasnt?: string[] } = {
    has: ["ViewBox"],
  };
  private mapOffscreen: HTMLCanvasElement;
  constructor(ecs: ECS) {
    super(ecs);
    this.mapOffscreen = <HTMLCanvasElement>(
      document.getElementById("map-offscreen")
    );
  }

  update(tick: number, entities: Set<Entity>) {
    let mapEntity = <Entity>entities.values().next().value;
    let { ViewBox } = mapEntity;
    let map = mapEntity.Map.map;
    // console.log(this.mapOffscreen);

    ViewBox.w = this.mapOffscreen.width / 4;
    ViewBox.h = this.mapOffscreen.height / 4;
    ViewBox.x = map.get(map.playerHome).coordinates().X - ViewBox.w / 2;
    ViewBox.y = map.get(map.playerHome).coordinates().Y - ViewBox.h / 2;

    if (ViewBox.x < 0) ViewBox.x = 0;
    if (ViewBox.y < 0) ViewBox.y = 0;
    if (ViewBox.x + ViewBox.w > this.mapOffscreen.width) ViewBox.x = this.mapOffscreen.width - ViewBox.w;
    if (ViewBox.y + ViewBox.h > this.mapOffscreen.height) ViewBox.y = this.mapOffscreen.width - ViewBox.h;
  }
}
