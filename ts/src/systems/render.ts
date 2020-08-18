import EntityComponentSystem, { Entity, ECS } from "@fritzy/ecs";


export class RenderTileMap extends EntityComponentSystem.System {
  static query: { has?: string[]; hasnt?: string[] } = { has: ["TileMap"] };
  private ctx: CanvasRenderingContext2D;

  constructor(ecs: any, ctx: CanvasRenderingContext2D) {
    super(ecs);
    this.ctx = ctx;
  }

  update(tick: number, entities: Set<Entity>) {
    const mapEntity = entities.values().next().value;
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
  }
}

export class RenderEntities extends EntityComponentSystem.System {
  static query: { has?: string[]; hasnt?: string[] } = {
    has: ["Coordinates", "Renderable"],
  };
  private ctx: CanvasRenderingContext2D;

  constructor(ecs: any, ctx: CanvasRenderingContext2D) {
    super(ecs);
    this.ctx = ctx;
  }

  update(tick: number, entities: Set<Entity>) {
    const global = this.ecs.getEntity("global").Global;

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

// export class RenderItems extends EntityComponentSystem.System {
//   static query: { has?: string[]; hasnt?: string[] } = { has: ["Caffeine", "Coordinates", "Renderable"] };
//   private ctx: CanvasRenderingContext2D;

//   constructor (ecs: ECS, ctx: CanvasRenderingContext2D) {
//     super(ecs);
//     this.ctx = ctx;
//   }

//   update(tick: number, entities: Set<Entity>) {
//     let coffeeEntities = [...entities];
//     const global = this.ecs.getEntity("global").Global;

//     for (let coffeEntity of )
//   }
// }

// export class RenderCars extends ECS.System {
//   static query: { has?: string[]; hasnt?: string[] } = { has: ["Car"] };
//   private ctx: CanvasRenderingContext2D;

//   constructor(ecs: any, ctx: CanvasRenderingContext2D) {
//     super(ecs);
//     this.ctx = ctx;
//   }

//   update(tick: number, entities: Set<Entity>) {
//     let driverEntities = [...entities];
//     const global = this.ecs.getEntity("global").Global;

//     for (let driver of driverEntities) {
//       //@ts-ignore
//       let tileCoords: { X: number; Y: number } =
//         global.spriteMap[`${driver.Car.color}Car`];
//       this.ctx.drawImage(
//         global.spriteSheet,
//         tileCoords.X,
//         tileCoords.Y,
//         driver.Renderable.spriteWidth,
//         driver.Renderable.spriteHeight,
//         driver.Coordinates.X,
//         driver.Coordinates.Y,
//         driver.Renderable.renderWidth,
//         driver.Renderable.renderHeight
//       );
//     }
//   }
// }
