import EntityComponentSystem, { Entity, ECS } from "@fritzy/ecs";
import { centerWithin } from "../modules/gameMath";

//systems must be added in this order

export class RenderBackground extends EntityComponentSystem.System {
  private ctx: CanvasRenderingContext2D;
  constructor(ecs: ECS, ctx: CanvasRenderingContext2D) {
    super(ecs);
    this.ctx = ctx;
  }
  update(tick: number, entities: Set<Entity>) {
    let game = this.ecs.getEntity("global").Global.game;
    if (game.backgroundIsLoaded) {
      this.ctx.drawImage(
        game.background,
        0,
        0,
        window.innerWidth,
        window.innerHeight
      );
    } else {
      this.ctx.fillStyle = "#50cdff";
      this.ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
    }
  }
}

export class RenderMap extends EntityComponentSystem.System {
  static query: { has?: string[]; hasnt?: string[] } = { has: ["TileMap"] };
  private ctx: CanvasRenderingContext2D;
  private modeNames: string[];

  constructor(ecs: ECS, ctx: CanvasRenderingContext2D) {
    super(ecs);
    this.ctx = ctx;
    this.modeNames = [
      "playing",
      "paused",
      "won",
      "lost",
      "designing",
      "levelStartAnimation",
    ];
  }

  update(tick: number, entities: Set<Entity> | Array<Entity>) {
    const global = this.ecs.getEntity("global").Global;
    let mode = global.game.mode;
    if (!this.modeNames.includes(mode)) return;

    const mapEntity = entities.values().next().value;
    const coords = mapEntity.Coordinates;
    const tileMap = mapEntity.TileMap;
    const map = mapEntity.Map.map;
    let x = 0;
    let y = 0;
    // switch (mode) {
    //   case "playing":
    //   case "won":
    //     this.ctx.fillStyle = "#81c76d";
    //     break;
    //   case "lost":
    //     this.ctx.fillStyle = "#eb5555";
    //     break;
    //   case "paused":
    //   case "designing":
    //   default:
    //     this.ctx.fillStyle = "lightgray";
    // }
    this.ctx.fillStyle = mapEntity.Map.background;
    this.ctx.fillRect(coords.X, coords.Y, map.pixelWidth, map.pixelHeight);

    if (
      mode === "playing" ||
      mode === "designing" ||
      mode === "levelStartAnimation"
    ) {
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

export class RenderGameplayEntities extends EntityComponentSystem.System {
  static query: { has?: string[]; hasnt?: string[] } = {
    has: ["Coordinates", "Renderable"],
    hasnt: ["Button", "Car"],
  };
  private ctx: CanvasRenderingContext2D;

  constructor(ecs: ECS, ctx: CanvasRenderingContext2D) {
    super(ecs);
    this.ctx = ctx;
  }

  update(tick: number, entities: Set<Entity>) {
    const global = this.ecs.getEntity("global").Global;
    const mode = global.game.mode;
    const mapCoords = global.map.Coordinates;

    if (mode === "playing") {
      let bossEntity = this.ecs.getEntity("boss");
      let playerEntity = this.ecs.getEntity("player");

      entities.add(this.updateCarSprite(bossEntity, global.spriteMap));
      entities.add(this.updateCarSprite(playerEntity, global.spriteMap));

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

  updateCarSprite(entity: Entity, spriteMap: any) {
    let spriteName;

    if (entity.Velocity.vector.X > 0) spriteName = `${entity.Car.color}CarR`;
    else if (entity.Velocity.vector.X < 0)
      spriteName = `${entity.Car.color}CarL`;

    if (spriteName) {
      let { X, Y } = spriteMap[spriteName];
      entity.Renderable.spriteX = X;
      entity.Renderable.spriteY = Y;
    }

    return entity;
  }
}

export class RenderMenus extends EntityComponentSystem.System {
  static query: { has?: string[]; hasnt?: string[] } = {
    has: ["Button", "Coordinates", "Renderable"],
  };
  private ctx: CanvasRenderingContext2D;
  private spriteSheet: HTMLImageElement;
  private menuTags: { [key: string]: Array<string> };
  private modeNames: string[];
  private buttonEntities: Entity[];

  constructor(ecs: ECS, ctx: CanvasRenderingContext2D) {
    super(ecs);
    this.ctx = ctx;
    this.spriteSheet = this.ecs.getEntity("global").Global.spriteSheet;
    this.menuTags = {
      menu: ["main"],
      designing: ["design"],
      paused: ["gameplay", "paused"],
      won: ["gameplay", "won"],
      lost: ["gampeplay", "lost"],
    };
    this.modeNames = Object.keys(this.menuTags);
    this.buttonEntities = [];
  }

  update(tick: number, entities: Set<Entity>) {
    let global = this.ecs.getEntity("global").Global;
    let mode = global.game.mode;

    //calculate coordinates for buttons using button spacing logic and current state/size of game
    if (this.modeNames.includes(mode)) {
      this.buttonEntities = this.selectButtons(entities, mode);
      let { pixelWidth, pixelHeight } = global.map.Map.map ?? {
        pixelHeight: 0,
        pixelWidth: 0,
      };
      let { X, Y } = global.map.Coordinates ?? { X: 0, Y: 0 };

      switch (mode) {
        case "menu":
          this.renderMainMenu();
          break;
        case "paused":
          this.renderPausedMenu(X, Y, pixelWidth, pixelHeight);
          break;
        case "won":
          this.renderWonMenu(X, Y, pixelWidth, pixelHeight);
          break;
        case "lost":
          this.renderLostMenu(X, Y, pixelWidth, pixelHeight);
          break;
        case "designing":
          this.renderDesignMenus(X, Y, pixelWidth, pixelHeight);
          return;
        default:
          return;
      }
    }
  }

  selectButtons(buttonEntities: Set<Entity>, mode: string) {
    const selected = [
      ...this.ecs.queryEntities({ has: ["menu", ...this.menuTags[mode]] }),
    ];

    return selected;
  }

  positionButtons(
    cx: number,
    cy: number,
    cw: number,
    ch: number,
    ew: number,
    eh: number,
    dir: "horizontal" | "vertical",
    buttons: Array<Entity | Array<Entity>>,
    style: "spaceBetween" | "spaceEvenly" = "spaceEvenly"
  ) {
    let { x, y } = centerWithin(
      cx,
      cy,
      cw,
      ch,
      ew,
      eh,
      buttons.length,
      dir,
      style
    );
    let newCoord = dir === "horizontal" ? x.start : y.start;
    for (let btn of buttons) {
      if (Array.isArray(btn)) {
        console.log("Detected subarray and running recursion");
        let subx = dir === "horizontal" ? newCoord : x.start;
        let suby = dir === "vertical" ? newCoord : y.start;
        let subw = dir === "horizontal" ? x.step : ew;
        let subh = dir === "vertical" ? y.step : eh;
        let subew = btn[0].Renderable.renderWidth;
        let subeh = btn[0].Renderable.renderHeight;
        this.positionButtons(
          subx,
          suby,
          subw,
          subh,
          subew,
          subeh,
          dir === "horizontal" ? "vertical" : "horizontal",
          btn,
          "spaceBetween"
        );
      } else {
        btn.Coordinates.Y = dir === "vertical" ? newCoord : y.start;
        btn.Coordinates.X = dir === "horizontal" ? newCoord : x.start;
      }
      if (dir === "vertical") newCoord += y.step;
      else if (dir === "horizontal") newCoord += x.step;
    }
  }

  drawButtons(buttonEntities: Entity[]) {
    for (let entity of buttonEntities) {
      // console.log(`Drawing ${entity.id} at {${entity.Coordinates.X}, ${entity.Coordinates.Y}} with height ${entity.Renderable.renderHeight} and width ${entity.Renderable.renderWidth}`)
      this.ctx.drawImage(
        this.spriteSheet,
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

  renderMainMenu() {
    this.positionButtons(
      window.innerWidth / 2 - window.innerWidth / 4,
      window.innerHeight / 2 - window.innerHeight / 4,
      window.innerWidth / 2,
      window.innerHeight / 2,
      200,
      75,
      "vertical",
      this.buttonEntities,
      "spaceEvenly"
    );
    this.drawButtons(this.buttonEntities);
  }

  renderPausedMenu(
    mapX: number,
    mapY: number,
    mapWidth: number,
    mapHeight: number
  ) {
    this.positionButtons(
      mapX,
      mapY,
      mapWidth,
      mapHeight,
      200,
      75,
      "vertical",
      this.buttonEntities,
      "spaceEvenly"
    );
    this.drawButtons(this.buttonEntities);
  }

  renderWonMenu(
    mapX: number,
    mapY: number,
    mapWidth: number,
    mapHeight: number
  ) {
    this.positionButtons(
      mapX,
      mapY,
      mapWidth,
      mapHeight,
      200,
      75,
      "vertical",
      this.buttonEntities,
      "spaceEvenly"
    );
    this.drawButtons(this.buttonEntities);
  }

  renderLostMenu(
    mapX: number,
    mapY: number,
    mapWidth: number,
    mapHeight: number
  ) {
    this.positionButtons(
      mapX,
      mapY,
      mapWidth,
      mapHeight,
      200,
      75,
      "vertical",
      this.buttonEntities,
      "spaceEvenly"
    );
    this.drawButtons(this.buttonEntities);
  }

  renderDesignToolbarMenu(
    toolbarBtns: Entity[],
    mapX: number,
    mapY: number,
    mapWidth: number,
    mapHeight: number
  ) {
    this.positionButtons(
      mapX,
      0,
      mapWidth,
      (window.innerHeight - mapHeight) / 2,
      75,
      75,
      "horizontal",
      toolbarBtns,
      "spaceEvenly"
    );
    this.drawButtons(toolbarBtns);
  }

  renderDesignAdminMenu(
    adminBtns: Entity[],
    mapX: number,
    mapY: number,
    mapWidth: number,
    mapHeight: number
  ) {
    let formattedBtns = this.formatDesignAdminButtons(adminBtns);
    this.positionButtons(
      mapX + mapWidth,
      (window.innerHeight - mapHeight) / 2,
      (window.innerWidth - mapWidth) / 2,
      mapHeight,
      200,
      75,
      "vertical",
      formattedBtns,
      "spaceEvenly"
    );
    this.drawButtons(adminBtns);
  }

  renderDesignMenus(
    mapX: number,
    mapY: number,
    mapWidth: number,
    mapHeight: number
  ) {
    const toolbarBtns = this.buttonEntities.filter((e) => e.has("toolbar"));
    const adminBtns = this.buttonEntities.filter((e) => e.has("admin"));
    // const configBtns = this.buttonEntities.filter(e => e.has("config"));

    this.renderDesignToolbarMenu(toolbarBtns, mapX, mapY, mapWidth, mapHeight);
    this.renderDesignAdminMenu(adminBtns, mapX, mapY, mapWidth, mapHeight);
  }

  formatDesignAdminButtons(adminBtns: Entity[]) {
    const undoredo = adminBtns.filter(
      (b) => b.Button.name === "undo" || b.Button.name === "redo"
    );
    const erasereset = adminBtns.filter(
      (b) => b.Button.name === "eraser" || b.Button.name === "reset"
    );
    let btns: Array<Entity | Array<Entity>> = adminBtns.slice();
    btns.splice(4, 2, undoredo);
    btns.splice(5, 2, erasereset);

    return btns;
  }
}

export class RenderButtonModifiers extends EntityComponentSystem.System {
  static query: { has?: string[]; hasnt?: string[] } = { has: ["Button"] };
  private ctx: CanvasRenderingContext2D;

  constructor(ecs: ECS, ctx: CanvasRenderingContext2D) {
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
        this.ctx.putImageData(
          image,
          entity.Coordinates.X,
          entity.Coordinates.Y
        );
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

export class RenderTopLevelGraphics extends EntityComponentSystem.System {
  static query: { has?: string[]; hasnt?: string[] } = {
    has: ["Coordinates", "Renderable", "anim"],
  };
  private ctx: CanvasRenderingContext2D;

  constructor(ecs: ECS, ctx: CanvasRenderingContext2D) {
    super(ecs);
    this.ctx = ctx;
  }

  update(tick: number, entities: Set<Entity>) {
    const global = this.ecs.getEntity("global").Global;
    //will render countdown numbers
    for (let entity of entities) {
      if (entity.Coordinates.X === 0 && entity.Coordinates.Y === 0) {
        let { x, y } = centerWithin(
          0,
          0,
          window.innerWidth,
          window.innerHeight,
          entity.Renderable.renderWidth,
          entity.Renderable.renderHeight,
          1,
          "vertical",
          "spaceEvenly"
        );
        entity.Coordinates.X = x.start;
        entity.Coordinates.Y = y.start;
      }
      this.ctx.save();
      this.ctx.globalAlpha = entity.Renderable.alpha;
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
      this.ctx.restore();
    }
  }
}
