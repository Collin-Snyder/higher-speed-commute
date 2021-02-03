import EntityComponentSystem, { Entity, ECS } from "@fritzy/ecs";
import * as breakpoints from "../modules/breakpoints";

export class BreakpointSystem extends EntityComponentSystem.System {
  static query: { has?: string[]; hasnt?: string[] } = {
    has: ["Breakpoint", "Renderable"],
  };

  constructor(ecs: ECS) {
    super(ecs);
  }
  update(tick: number, entities: Set<Entity>) {
    let bp = window.game.breakpoint;

    for (let entity of entities) {
      let { Breakpoint, Renderable } = entity;
      let breakpoint;

      for (let b of Breakpoint) {
        if (b.name === bp) {
          breakpoint = b;
          break;
        }
      }

      if (!breakpoint)
        throw new Error(
          `Attempting to use an undefined breakpoint with name "${bp}" for Entity "${entity.id}"`
        );

      if (entity.has("Animation")) {
        Renderable.renderWidth = Renderable.renderWidth * breakpoint.scale;
        Renderable.renderHeight = Renderable.renderHeight * breakpoint.scale;
      } else {
        Renderable.renderWidth = breakpoint.width;
        Renderable.renderHeight = breakpoint.height;
      }

    //   if (entity.id === "map") {
    //     let { TileData } = entity;
    //     TileData.tileWidth = breakpoint.tileSize;
    //     TileData.tileHeight = breakpoint.tileSize;
    //   }
    }
  }
}
