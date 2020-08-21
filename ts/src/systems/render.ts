import EntityComponentSystem, { Entity, ECS } from "@fritzy/ecs";

export class RenderMenu extends EntityComponentSystem.System {
  static query: { has?: string[]; hasnt?: string[] } = {
    has: ["Button", "Coordinates", "Renderable"],
  };
  private ctx: CanvasRenderingContext2D;

  constructor(ecs: any, ctx: CanvasRenderingContext2D) {
    super(ecs);
    this.ctx = ctx;
  }

  update(tick: number, entities: Set<Entity>) {
    const global = this.ecs.getEntity("global").Global;
    let mode = global.mode;
    if (mode === "menu" || mode === "designing") {
      for (let entity of entities) {
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
      }
    }
  }
}

// class RenderDesignUI extends  EntityComponentSystem.System {
//   static query: { has?: string[]; hasnt?: string[] } = {
//     has: ["Button", "Coordinates", "Renderable"],
//   };
// }

export class RenderTileMap extends EntityComponentSystem.System {
  static query: { has?: string[]; hasnt?: string[] } = { has: ["TileMap"] };
  private ctx: CanvasRenderingContext2D;

  constructor(ecs: any, ctx: CanvasRenderingContext2D) {
    super(ecs);
    this.ctx = ctx;
  }

  update(tick: number, entities: Set<Entity> | Array<Entity>) {
    let mode = this.ecs.getEntity("global").Global.mode;
    if (mode === "playing" || mode === "paused" || mode === "designing") {
      // console.log(entities);
      entities = [...entities];
      const mapEntity = mode === "designing" ? entities[1] : entities[0];
      const tileMap = mapEntity.TileMap;
      const map = mapEntity.Map;
      const global = this.ecs.getEntity("global").Global;
      let x = 0;
      let y = 0;
      for (let tile of tileMap.tiles) {
        if (tile) {
          let tileCoords = global.spriteMap[tile];
          this.ctx.drawImage(
            global.spriteSheet,
            tileCoords.X,
            tileCoords.Y,
            tileMap.tileWidth,
            tileMap.tileHeight,
            x * tileMap.tileWidth,
            y * tileMap.tileHeight,
            tileMap.tileWidth,
            tileMap.tileHeight
          );
        }
        if (++x >= map.width) {
          x = 0;
          y++;
        }
      }
      if (mode === "designing" && global.game.designModule.gridLoaded) {
        this.ctx.drawImage(
          global.game.designModule.gridOverlay,
          0,
          0
        )
      }
    }
  }
}

export class RenderEntities extends EntityComponentSystem.System {
  static query: { has?: string[]; hasnt?: string[] } = {
    has: ["Coordinates", "Renderable"],
    hasnt: ["Button"],
  };
  private ctx: CanvasRenderingContext2D;

  constructor(ecs: any, ctx: CanvasRenderingContext2D) {
    super(ecs);
    this.ctx = ctx;
  }

  update(tick: number, entities: Set<Entity>) {
    const global = this.ecs.getEntity("global").Global;
    let mode = global.mode;

    if (mode === "playing" || mode === "paused") {
      for (let entity of entities) {
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
      }
    }
  }
}
