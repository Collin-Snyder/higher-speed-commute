import EntityComponentSystem, { Entity, ECS, BaseComponent } from "@fritzy/ecs";
import {
  centerWithin,
  getCenterPoint,
  degreesToRadians,
} from "../modules/gameMath";

//systems must be added in this order

export class RenderBackground extends EntityComponentSystem.System {
  private ctx: CanvasRenderingContext2D;
  constructor(ecs: ECS, ctx: CanvasRenderingContext2D) {
    super(ecs);
    this.ctx = ctx;
  }
  update(tick: number, entities: Set<Entity>) {
    let game = this.ecs.getEntity("global").Global.game;
    let layers = this.ecs.getEntity("bg").ParallaxLayer;

    this.ctx.fillStyle = "#8edbfa";
    this.ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

    if (game.backgroundIsLoaded) {
      for (let layer of layers) {
        this.drawLayer(game.background, layer);
      }
    }
  }

  drawLayer(
    bg: HTMLImageElement,
    l: {
      X: number;
      Y: number;
      width: number;
      height: number;
      offset: number;
      [key: string]: any;
    }
  ) {
    let { X, Y, width, height, offset } = l;
    let renderHeight = (height / (width / 2)) * window.innerWidth;
    this.ctx.drawImage(
      bg,
      X + offset,
      Y,
      width / 2,
      height,
      0,
      window.innerHeight - renderHeight,
      window.innerWidth,
      renderHeight
    );
  }
}

export class RenderBorders extends EntityComponentSystem.System {
  static query: { has?: string[]; hasnt?: string[] } = {
    has: ["Border", "Renderable"],
  };
  private ctx: CanvasRenderingContext2D;
  private canvases: { [entityId: string]: HTMLCanvasElement };

  constructor(ecs: ECS, ctx: CanvasRenderingContext2D) {
    super(ecs);
    this.ctx = ctx;
    this.canvases = {};
  }

  update(tick: number, entities: Set<Entity>) {
    const global = this.ecs.getEntity("global").Global;

    this.ctx.save();
    for (let entity of entities) {
      if (!entity.Renderable.visible) continue;
      const { renderWidth, renderHeight, alpha } = entity.Renderable;
      const { X, Y } = entity.Coordinates;
      const { weight, radius } = entity.Border;
      this.ctx.globalAlpha = alpha;
      if (!this.canvases[entity.id])
        this.initializeCanvas(
          entity.id,
          renderWidth,
          renderHeight,
          weight,
          radius
        );
      // this.drawChrome(X, Y, renderWidth, renderHeight, weight, radius);
      this.ctx.drawImage(
        this.canvases[entity.id],
        X - weight,
        Y - weight,
        renderWidth + weight * 2,
        renderHeight + weight * 2
      );
    }
    this.ctx.restore();
  }

  initializeCanvas(
    id: string,
    w: number,
    h: number,
    weight: number,
    r: number
  ) {
    const sweight = weight / 8;
    const sw = w / 8;
    const sh = h / 8;
    const sr = r / 8;

    const canv = document.createElement("canvas");
    canv.id = id;
    canv.width = sw + sweight * 2;
    canv.height = sh + sweight * 2;

    this.canvases[id] = canv;

    const ctx = <CanvasRenderingContext2D>canv.getContext("2d");
    // ctx.fillStyle = "#fff";
    // ctx.fillRect(0, 0, 125, 78);
    this.drawChrome(ctx, sweight, sweight, sw, sh, sweight, sr);
    // document.body.appendChild(canv);
    // canv.style.position = "absolute";
  }

  roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();
  }

  drawChrome(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    t: number,
    r: number
  ) {
    let grd = ctx.createLinearGradient(x + w, y, x, y);
    grd.addColorStop(0, "#808080");
    grd.addColorStop(0.38, "#202020");
    grd.addColorStop(0.4, "#242424");
    grd.addColorStop(0.66, "#fff");
    grd.addColorStop(1, "#808080");

    ctx.fillStyle = grd;
    this.roundRect(ctx, x - t, y - t, w + 2 * t, h + 2 * t, r);

    //30% down/up
    //15% in
    grd = ctx.createLinearGradient(
      x + w * 0.15,
      y + h * 0.33,
      x + 0.85 * w,
      y + h * 0.66
    );
    grd.addColorStop(0, "#676767");
    grd.addColorStop(0.38, "#202020");
    grd.addColorStop(0.4, "#242424");
    grd.addColorStop(0.66, "#fff");
    grd.addColorStop(1, "#acacac");

    ctx.fillStyle = grd;
    this.roundRect(ctx, x - t / 2, y - t / 2, w + t, h + t, r / 2);

    let pixels = ctx.getImageData(x - t, y - t, w + 2 * t, h + 2 * t);

    for (let p = 3; p < pixels.data.length; p += 4) {
      if (pixels.data[p] < 128) pixels.data[p] = 0;
      else pixels.data[p] = 255;
    }

    ctx.putImageData(pixels, x - t, y - t);
  }
}

export class RenderMap extends EntityComponentSystem.System {
  static query: { has?: string[]; hasnt?: string[] } = {
    has: ["TileMap", "Map"],
  };
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

    this.ctx.save();
    this.ctx.globalAlpha = mapEntity.Renderable.alpha;
    this.ctx.fillStyle = mapEntity.Renderable.bgColor;
    this.ctx.fillRect(coords.X, coords.Y, map.pixelWidth, map.pixelHeight);

    if (
      // mode === "playing" ||
      mode === "designing" ||
      mode === "levelStartAnimation" ||
      mode === "won" ||
      mode === "lost"
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
    this.ctx.restore();

    // if (mode === "playing") {
    //   let vb = mapEntity.ViewBox;
    //   this.ctx.drawImage(
    //     <HTMLCanvasElement>document.getElementById("map-offscreen"),
    //     vb.x,
    //     vb.y,
    //     vb.w,
    //     vb.h,
    //     coords.X,
    //     coords.Y,
    //     map.pixelWidth,
    //     map.pixelHeight
    //   );
    // }

    if (mode === "won" || mode === "lost") {
      this.ctx.save();
      this.ctx.globalAlpha = 0.75;
      this.ctx.fillStyle = "#000";
      this.ctx.fillRect(coords.X, coords.Y, map.pixelWidth, map.pixelHeight);
      this.ctx.restore();
    }
  }
}

export class RenderGameplayEntities extends EntityComponentSystem.System {
  static query: { has?: string[]; hasnt?: string[] } = {
    has: ["Coordinates", "Renderable"],
    hasnt: ["Button", "Car", "Map"],
  };
  private ctx: CanvasRenderingContext2D;

  constructor(ecs: ECS, ctx: CanvasRenderingContext2D) {
    super(ecs);
    //@ts-ignore
    this.ctx = document.getElementById("ents-offscreen").getContext("2d");
  }

  update(tick: number, entities: Set<Entity>) {
    const global = this.ecs.getEntity("global").Global;
    const mode = global.game.mode;
    const mapCoords = global.map.Coordinates;

    if (mode === "playing") {
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

export class RenderViewBox extends EntityComponentSystem.System {
  static query: { has?: string[]; hasnt?: string[] } = {
    has: ["ViewBox"],
  };
  private ctx: CanvasRenderingContext2D;
  private playerEntity: Entity;
  private bossEntity: Entity;

  constructor(ecs: ECS, ctx: CanvasRenderingContext2D) {
    super(ecs);
    this.ctx = ctx;
    this.playerEntity = this.ecs.getEntity("player");
    this.bossEntity = this.ecs.getEntity("boss");
  }

  update(tick: number, entities: Set<Entity>) {
    const global = this.ecs.getEntity("global").Global;
    let mode = global.game.mode;
    let zoom = global.game.zoomFactor;
    if (mode !== "playing") return;

    let mapEntity = <Entity>entities.values().next().value;
    this.updateViewbox(mapEntity, global);
    let vb = mapEntity.ViewBox;
    const coords = mapEntity.Coordinates;
    const map = mapEntity.Map.map;
    this.ctx.drawImage(
      <HTMLCanvasElement>document.getElementById("map-offscreen"),
      vb.x,
      vb.y,
      vb.w,
      vb.h,
      coords.X,
      coords.Y,
      map.pixelWidth,
      map.pixelHeight
    );
    this.ctx.drawImage(
      <HTMLCanvasElement>document.getElementById("ents-offscreen"),
      vb.x,
      vb.y,
      vb.w,
      vb.h,
      coords.X,
      coords.Y,
      map.pixelWidth,
      map.pixelHeight
    );

    this.renderCarSprite(
      this.bossEntity,
      global.spriteSheet,
      global.spriteMap,
      coords,
      zoom,
      mapEntity
    );
    this.renderCarSprite(
      this.playerEntity,
      global.spriteSheet,
      global.spriteMap,
      coords,
      zoom,
      mapEntity
    );
  }

  updateViewbox(mapEntity: Entity, global: BaseComponent) {
    let { ViewBox } = mapEntity;
    let mapOffscreen = <HTMLCanvasElement>(
      document.getElementById("map-offscreen")
    );
    let focusEnt = this.ecs.getEntity(global.game.focusView);
    let { X, Y } = focusEnt.Coordinates;
    let center = getCenterPoint(
      X,
      Y,
      focusEnt.Renderable.renderWidth,
      focusEnt.Renderable.renderHeight
    );
    let vbCenter = getCenterPoint(ViewBox.x, ViewBox.y, ViewBox.w, ViewBox.h);

    ViewBox.x += (center.X - vbCenter.X) * (3 / 4);
    ViewBox.y += (center.Y - vbCenter.Y) * (3 / 4);

    if (ViewBox.x < 0) ViewBox.x = 0;
    if (ViewBox.y < 0) ViewBox.y = 0;
    if (ViewBox.x + ViewBox.w > mapOffscreen.width)
      ViewBox.x = mapOffscreen.width - ViewBox.w;
    if (ViewBox.y + ViewBox.h > mapOffscreen.height)
      ViewBox.y = mapOffscreen.width - ViewBox.h;
  }

  getCarRotationRadians(entity: Entity) {
    let { X, Y } = entity.Velocity.vector;

    if (X === 0 && Y === 0) return -1;
    //will need to update vector/altVector calculation and collision handling to make this work
    // if (X > 0 && Y < 0) return degreesToRadians(45);
    // if (X > 0 && Y > 0) return degreesToRadians(135);
    // if (X < 0 && Y > 0) return degreesToRadians(225);
    // if (X < 0 && Y < 0) return degreesToRadians(315);
    if (Y < 0) return 0;
    if (X > 0) return degreesToRadians(90);
    if (Y > 0) return degreesToRadians(180);
    if (X < 0) return degreesToRadians(270);
    return -1;
  }

  renderCarSprite(
    entity: Entity,
    spriteSheet: any,
    spriteMap: any,
    mapCoords: any,
    scaleFactor: number,
    mapEntity: Entity
  ) {
    let { ViewBox } = mapEntity;

    // entity = this.updateCarSprite(entity, spriteMap);

    let X = entity.Coordinates.X - ViewBox.x;
    let Y = entity.Coordinates.Y - ViewBox.y;

    //rotate car sprite
    let r = this.getCarRotationRadians(entity);
    if (r >= 0) entity.Renderable.radians = r;

    let dx = mapCoords.X + X * scaleFactor;
    let dy = mapCoords.Y + Y * scaleFactor;
    let dw = entity.Renderable.renderWidth * scaleFactor;
    let dh = entity.Renderable.renderHeight * scaleFactor;
    let trans = getCenterPoint(dx, dy, dw, dh);
    
    this.ctx.save();
    this.ctx.translate(trans.X, trans.Y);
    this.ctx.rotate(entity.Renderable.radians);
    this.ctx.translate(-trans.X, -trans.Y);
    this.ctx.drawImage(
      spriteSheet,
      entity.Renderable.spriteX,
      entity.Renderable.spriteY,
      entity.Renderable.spriteWidth,
      entity.Renderable.spriteHeight,
      dx,
      dy,
      dw,
      dh
    );
    this.ctx.restore();

    //update car's hitbox
  }
}

export class RenderMenus extends EntityComponentSystem.System {
  static query: { has?: string[]; hasnt?: string[] } = {
    has: ["Button", "Coordinates", "Renderable"],
  };
  private ctx: CanvasRenderingContext2D;
  private spriteSheet: HTMLImageElement;
  private spriteMap: { [key: string]: { X: number; Y: number } };
  private menuTags: { [key: string]: Array<string> };
  private modeNames: string[];
  private buttonEntities: Entity[];
  private global: Entity;

  constructor(ecs: ECS, ctx: CanvasRenderingContext2D) {
    super(ecs);
    this.ctx = ctx;
    this.global = this.ecs.getEntity("global");
    let { spriteSheet, spriteMap } = this.global.Global;
    this.spriteSheet = spriteSheet;
    this.spriteMap = spriteMap;
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
          // this.renderPausedMenu(X, Y, pixelWidth, pixelHeight);
          this.renderGameplayMenu("paused", X, Y, pixelWidth, pixelHeight);
          break;
        case "won":
          // this.renderWonMenu(X, Y, pixelWidth, pixelHeight);
          this.renderGameplayMenu("won", X, Y, pixelWidth, pixelHeight);
          break;
        case "lost":
          // this.renderLostMenu(X, Y, pixelWidth, pixelHeight);
          this.renderGameplayMenu("lost", X, Y, pixelWidth, pixelHeight);
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

  drawTitle() {
    let spriteCoords = this.spriteMap.title;
    let spriteW = 195;
    let spriteH = 53;
    let renderH = window.innerHeight / 4;
    let renderW = renderH * (spriteW / spriteH);

    let { x, y } = centerWithin(
      0,
      0,
      window.innerWidth,
      window.innerHeight / 3,
      renderW,
      renderH,
      1,
      "vertical",
      "spaceEvenly"
    );

    this.ctx.drawImage(
      this.spriteSheet,
      spriteCoords.X,
      spriteCoords.Y,
      spriteW,
      spriteH,
      x.start,
      window.innerHeight / 8,
      renderW,
      renderH
    );

    return { titleY: window.innerHeight / 8, titleHeight: renderH };
  }

  renderMainMenu() {
    let { titleY, titleHeight } = this.drawTitle();
    let menuY = titleY + titleHeight;
    let menuH = (window.innerHeight / 3) * 2 - window.innerHeight / 8;
    this.positionButtons(
      window.innerWidth / 2 - window.innerWidth / 4,
      menuY,
      window.innerWidth / 2,
      menuH,
      200,
      75,
      "vertical",
      this.buttonEntities,
      "spaceEvenly"
    );
    this.drawButtons(this.buttonEntities);
  }

  drawShine(
    graphicX: number,
    graphicY: number,
    graphicW: number,
    graphicH: number
  ) {
    let { degOffset } = this.global.Global.game.ecs.getEntity(
      "wonGraphic"
    ).Animation;
    let shineCoords = this.spriteMap.shiny;
    let spriteW = 75;
    let spriteH = 75;
    let radians = (degOffset * Math.PI) / 180;
    let transX = graphicX + graphicW / 2;
    let transY = graphicY + graphicH / 2;

    //rotate and draw clockwise shine
    this.ctx.save();
    this.ctx.translate(transX, transY);
    this.ctx.rotate(radians);
    this.ctx.translate(-transX, -transY);
    this.ctx.drawImage(
      this.spriteSheet,
      shineCoords.X,
      shineCoords.Y,
      spriteW,
      spriteH,
      graphicX,
      graphicY,
      graphicW,
      graphicH
    );
    this.ctx.restore();

    //rotate and draw counterclockwise shine
    this.ctx.save();
    this.ctx.translate(transX, transY);
    this.ctx.rotate(-radians);
    this.ctx.translate(-transX, -transY);
    this.ctx.drawImage(
      this.spriteSheet,
      shineCoords.X,
      shineCoords.Y,
      spriteW,
      spriteH,
      graphicX,
      graphicY,
      graphicW,
      graphicH
    );
    this.ctx.restore();

    //calculate position of trophy graphic within shine
    let trophyPosition = centerWithin(
      graphicX,
      graphicY,
      graphicW,
      graphicH,
      (graphicW *= 0.7),
      (graphicH *= 0.7),
      1,
      "vertical",
      "spaceEvenly"
    );

    graphicX = trophyPosition.x.start;
    graphicY = trophyPosition.y.start;

    //return position/dimensions of inner trophy graphic
    return { ix: graphicX, iy: graphicY, iw: graphicW, ih: graphicH };
  }

  drawGameplayMenuGraphic(
    menu: "paused" | "won" | "lost" | "crashed",
    mapX: number,
    mapY: number,
    mapW: number,
    mapH: number
  ) {
    let spriteCoords = this.spriteMap[`${menu}Graphic`];
    let hasShine = menu === "won";
    let spriteW = 75;
    let spriteH = 75;
    let graphicH = mapH / 3;
    let graphicW = graphicH;
    let graphicX, graphicY;
    let containerH = mapH / 2.5;

    let { x, y } = centerWithin(
      mapX,
      mapY,
      mapW,
      containerH,
      graphicW,
      graphicH,
      1,
      "vertical",
      "spaceEvenly"
    );

    graphicX = x.start;
    graphicY = y.start;

    if (hasShine) {
      let { ix, iy, ih, iw } = this.drawShine(
        graphicX,
        graphicY,
        graphicW,
        graphicH
      );
      graphicX = ix;
      graphicY = iy;
      graphicW = iw;
      graphicH = ih;
    }

    this.ctx.drawImage(
      this.spriteSheet,
      spriteCoords.X,
      spriteCoords.Y,
      spriteW,
      spriteH,
      graphicX,
      graphicY,
      graphicW,
      graphicH
    );

    return containerH;
  }

  renderGameplayMenu(
    menu: "won" | "lost" | "paused" | "crashed",
    mapX: number,
    mapY: number,
    mapWidth: number,
    mapHeight: number
  ) {
    let containerH = this.drawGameplayMenuGraphic(
      menu,
      mapX,
      mapY,
      mapWidth,
      mapHeight
    );
    let menuY = mapY + containerH;
    let menuH = (mapHeight / 2.5) * 2 - mapHeight / 4;

    this.positionButtons(
      mapX,
      menuY,
      mapWidth,
      menuH,
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
