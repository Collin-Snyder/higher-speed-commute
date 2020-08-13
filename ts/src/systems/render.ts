import ECS from "@fritzy/ecs";

export class RenderTileMap extends ECS.System {
  static query: { has?: string[]; hasnt?: string[] } = { has: ["TileMap"] };
  private ctx: CanvasRenderingContext2D;

  constructor(ecs: any, ctx: CanvasRenderingContext2D) {
    super(ecs);
    this.ctx = ctx;
  }

  update(tick: number, entities: Array<any>) {
    const mapEntity = [...entities][0];
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

export class RenderLights extends ECS.System {
  static query: { has?: string[]; hasnt?: string[] } = {
    has: ["Coordinates", "Renderable"],
    hasnt: ["Car"],
  };
  private ctx: CanvasRenderingContext2D;

  constructor(ecs: any, ctx: CanvasRenderingContext2D) {
    super(ecs);
    this.ctx = ctx;
  }

  update(tick: number, entities: Array<any>) {
    let lightEntities = [...entities];
    const global = this.ecs.getEntity("global").Global;

    for (let lightEntity of lightEntities) {
      let lightCoords: { X: number; Y: number } =
        global.spriteMap[`${lightEntity.Color.color}Light`];
      this.ctx.drawImage(
        global.spriteSheet,
        lightCoords.X,
        lightCoords.Y,
        lightEntity.Renderable.spriteWidth,
        lightEntity.Renderable.spriteHeight,
        lightEntity.Coordinates.X,
        lightEntity.Coordinates.Y,
        lightEntity.Renderable.renderWidth,
        lightEntity.Renderable.renderHeight
      );
    }
  }
}

export class RenderCars extends ECS.System {
  static query: { has?: string[]; hasnt?: string[] } = { has: ["Car"] };
  private ctx: CanvasRenderingContext2D;

  constructor(ecs: any, ctx: CanvasRenderingContext2D) {
    super(ecs);
    this.ctx = ctx;
  }

  update(tick: number, entities: Array<any>) {
    let driverEntities = [...entities];
    const global = this.ecs.getEntity("global").Global;

    for (let driver of driverEntities) {
      //@ts-ignore
      let tileCoords: { X: number; Y: number } =
        global.spriteMap[`${driver.Car.color}Car`];
      this.ctx.drawImage(
        global.spriteSheet,
        tileCoords.X,
        tileCoords.Y,
        driver.Renderable.spriteWidth,
        driver.Renderable.spriteHeight,
        driver.Coordinates.X,
        driver.Coordinates.Y,
        driver.Renderable.renderWidth,
        driver.Renderable.renderHeight
      );
    }
  }
}
