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
        // if (entity.has("toolbar")) {
        // if (entity.Button.name === global.game.designModule.selectedTool) {
        //   this.ctx.beginPath();
        //   this.ctx.lineWidth = 3;
        //   this.ctx.strokeStyle = "yellow";
        //   this.ctx.rect(
        //     entity.Coordinates.X - this.ctx.lineWidth,
        //     entity.Coordinates.Y - this.ctx.lineWidth,
        //     entity.Renderable.renderWidth + 2 * this.ctx.lineWidth,
        //     entity.Renderable.renderHeight + 2 * this.ctx.lineWidth
        //   );
        //   this.ctx.stroke();
        // }
      }
      // }
    }
  }
}

export class RenderButtonModifiers extends EntityComponentSystem.System {
  static query: { has?: string[]; hasnt?: string[] } = { has: ["Button"] };
  private ctx: CanvasRenderingContext2D;

  constructor(ecs: any, ctx: CanvasRenderingContext2D) {
    super(ecs);
    this.ctx = ctx;
  }

  update(tick: number, entities: Set<Entity>) {
    const global = this.ecs.getEntity("global").Global;
    for (let entity of entities) {
      //render selected design tool selection indicator
      if (entity.has("Disabled")) {
        // console.log(entity)
        const image = this.ctx.getImageData(
          entity.Coordinates.X,
          entity.Coordinates.Y,
          entity.Renderable.renderWidth,
          entity.Renderable.renderHeight
        );
        const { data } = image;
        // console.log(data);
        for (let p = 0; p < data.length; p += 4) {
          const r = data[p];
          const g = data[p + 1];
          const b = data[p + 2];
          const a = data[p + 3];

          if (r === 255 && g === 103 && b === 0) {
            let { bgColor } = entity.Disabled;
            data[p] = bgColor.r;
            data[p + 1] = bgColor.g;
            data[p + 2] = bgColor.b;
            data[p + 3] = bgColor.a;
          } else if (r === 255 && g === 255 && b === 255) {
            let { textColor } = entity.Disabled;
            data[p] = textColor.r;
            data[p + 1] = textColor.g;
            data[p + 2] = textColor.b;
            data[p + 3] = textColor.a;
          }
        }
        this.ctx.putImageData(image, entity.Coordinates.X, entity.Coordinates.Y);
      } else if (entity.Button.name === global.game.designModule.selectedTool) {
        this.ctx.beginPath();
        this.ctx.lineWidth = 3;
        this.ctx.strokeStyle = "yellow";
        this.ctx.rect(
          entity.Coordinates.X - this.ctx.lineWidth,
          entity.Coordinates.Y - this.ctx.lineWidth,
          entity.Renderable.renderWidth + 2 * this.ctx.lineWidth,
          entity.Renderable.renderHeight + 2 * this.ctx.lineWidth
        );
        this.ctx.stroke();
      }
    }
  }
}

export class RenderTileMap extends EntityComponentSystem.System {
  static query: { has?: string[]; hasnt?: string[] } = { has: ["TileMap"] };
  private ctx: CanvasRenderingContext2D;

  constructor(ecs: any, ctx: CanvasRenderingContext2D) {
    super(ecs);
    this.ctx = ctx;
  }

  update(tick: number, entities: Set<Entity> | Array<Entity>) {
    const global = this.ecs.getEntity("global").Global;
    let mode = global.mode;
    if (mode === "playing" || mode === "paused" || mode === "designing") {
      const mapEntity = entities.values().next().value;
      const coords = mapEntity.Coordinates;
      const tileMap = mapEntity.TileMap;
      const map = mapEntity.Map.map;
      let x = 0;
      let y = 0;
      this.ctx.fillStyle = mode === "designing" ? "lightgray" : "#e6d093";
      this.ctx.fillRect(coords.X, coords.Y, map.pixelWidth, map.pixelHeight);
      for (let tile of tileMap.tiles) {
        if (tile) {
          if (typeof tile === "string") {
            let tileCoords = global.spriteMap[tile];
            this.ctx.drawImage(
              global.spriteSheet,
              tileCoords.X,
              tileCoords.Y,
              tileMap.tileWidth,
              tileMap.tileHeight,
              x * tileMap.tileWidth + coords.X,
              y * tileMap.tileHeight + coords.Y,
              tileMap.tileWidth,
              tileMap.tileHeight
            );
          } else if (Array.isArray(tile)) {
            for (let t of tile) {
              let tileCoords = global.spriteMap[t];
              this.ctx.drawImage(
                global.spriteSheet,
                tileCoords.X,
                tileCoords.Y,
                tileMap.tileWidth,
                tileMap.tileHeight,
                x * tileMap.tileWidth + coords.X,
                y * tileMap.tileHeight + coords.Y,
                tileMap.tileWidth,
                tileMap.tileHeight
              );
            }
          }
        }
        if (++x >= map.width) {
          x = 0;
          y++;
        }
      }

      if (mode === "designing" && global.game.designModule.gridLoaded) {
        this.ctx.drawImage(
          global.game.designModule.gridOverlay,
          coords.X,
          coords.Y
        );
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
    const mapCoords = global.map.Coordinates;

    if (mode === "playing" || mode === "paused") {
      for (let entity of entities) {
        this.ctx.drawImage(
          global.spriteSheet,
          entity.Renderable.spriteX,
          entity.Renderable.spriteY,
          entity.Renderable.spriteWidth,
          entity.Renderable.spriteHeight,
          entity.Coordinates.X + mapCoords.X,
          entity.Coordinates.Y + mapCoords.Y,
          entity.Renderable.renderWidth,
          entity.Renderable.renderHeight
        );
      }
    }
  }
}
