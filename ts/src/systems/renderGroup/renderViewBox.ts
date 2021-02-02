import EntityComponentSystem, { Entity, ECS, BaseComponent } from "@fritzy/ecs";
import {
  getCenterPoint,
  degreesToRadians,
  VectorInterface,
} from "../../modules/gameMath";

class RenderViewBox extends EntityComponentSystem.System {
  static query: { has?: string[]; hasnt?: string[] } = {
    has: ["ViewBox"],
  };
  private playerEntity: Entity;
  private bossEntity: Entity;
  private refColors: { [key: string]: string };
  private modeNames: string[];

  constructor(
    ecs: ECS,
    private ctx: CanvasRenderingContext2D,
    private step: number
  ) {
    super(ecs);
    this.playerEntity = this.ecs.getEntity("player");
    this.bossEntity = this.ecs.getEntity("boss");
    this.refColors = {
      playerHome: "#0058cf",
      player: "#007eff",
      bossHome: "#eb3626",
      boss: "#ff3600",
      office: "#f0d31a",
      street: "#878787",
    };
    this.modeNames = ["playing", "won", "levelStartAnimation"];
  }

  update(tick: number, entities: Set<Entity>) {
    const global = this.ecs.getEntity("global").Global;
    let mode = global.game.mode;
    let zoom = global.game.currentZoom;
    let mapView = global.game.mapView;
    if (!this.modeNames.includes(mode)) return;

   

    let mapEntity = <Entity>entities.values().next().value;
    
    
    let {
      ViewBox,
      Coordinates,
      Renderable: { renderWidth, renderHeight },
      MapData: { map },
      TileData: { tileWidth },
    } = mapEntity;
    
    let { X, Y } = Coordinates;
    
    this.updateViewbox(mapEntity, global, mode);

    if (mapView) {
      this.renderReferenceMap(
        map,
        X,
        Y,
        renderWidth,
        renderHeight,
        tileWidth,
        ViewBox,
        tick
      );
    } else {
      // console.log("Drawing offscreen map to the main canvas");
      // console.log(
      //   `Viewbox: {x: ${ViewBox.x}, y: ${ViewBox.y}, w: ${ViewBox.w}, h: ${ViewBox.h}`
      // );
      this.ctx.drawImage(
        <HTMLCanvasElement>document.getElementById("map-offscreen"),
        ViewBox.x,
        ViewBox.y,
        ViewBox.w,
        ViewBox.h,
        X,
        Y,
        renderWidth,
        renderHeight
      );
      this.ctx.drawImage(
        <HTMLCanvasElement>document.getElementById("ents-offscreen"),
        ViewBox.x,
        ViewBox.y,
        ViewBox.w,
        ViewBox.h,
        X,
        Y,
        renderWidth,
        renderHeight
      );

      if (mode === "levelStartAnimation") return;

      if (this.carInViewbox(this.bossEntity, ViewBox)) {
        this.renderCarSprite(
          this.bossEntity,
          global.spriteSheet,
          global.spriteMap,
          Coordinates,
          zoom,
          mapEntity
        );
      }
      if (this.carInViewbox(this.playerEntity, ViewBox)) {
        this.renderCarSprite(
          this.playerEntity,
          global.spriteSheet,
          global.spriteMap,
          Coordinates,
          zoom,
          mapEntity
        );
      }

      if (global.game.focusView === "boss") {
        this.drawBossBorder(X, Y, renderWidth, renderHeight);
      }
    }
  }

  updateViewbox(mapEntity: Entity, global: BaseComponent, mode: string) {
    let { ViewBox, Renderable } = mapEntity;
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
    // ViewBox.w = Renderable.renderWidth / global.game.currentZoom;
    ViewBox.w = 1000 / global.game.currentZoom;
    // ViewBox.h = Renderable.renderHeight / global.game.currentZoom;
    ViewBox.h = 625 / global.game.currentZoom;
    let vbCenter = getCenterPoint(ViewBox.x, ViewBox.y, ViewBox.w, ViewBox.h);

    if (mode === "playing") {
      ViewBox.x += (center.X - vbCenter.X) * (1 / 8);
      ViewBox.y += (center.Y - vbCenter.Y) * (1 / 8);
    } else {
      ViewBox.x = center.X - ViewBox.w / 2;
      ViewBox.y = center.Y - ViewBox.h / 2;
    }

    if (ViewBox.x < 0) ViewBox.x = 0;
    if (ViewBox.y < 0) ViewBox.y = 0;
    if (ViewBox.x + ViewBox.w > mapOffscreen.width)
      ViewBox.x = mapOffscreen.width - ViewBox.w;
    if (ViewBox.y + ViewBox.h > mapOffscreen.height)
      ViewBox.y = mapOffscreen.height - ViewBox.h;
  }

  getCarRotationRadians(entity: Entity) {
    let { X, Y } = entity.Velocity.vector;

    if (X === 0 && Y === 0) return -1;
    if (X > 0 && Y < 0) return degreesToRadians(45);
    if (X > 0 && Y > 0) return degreesToRadians(135);
    if (X < 0 && Y > 0) return degreesToRadians(225);
    if (X < 0 && Y < 0) return degreesToRadians(315);
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
    zoomFactor: number,
    mapEntity: Entity
  ) {
    let { ViewBox, Scale: {scaleX, scaleY} } = mapEntity;
    let {
      Coordinates,
      Renderable: {
        renderWidth,
        renderHeight,
        degrees,
        spriteX,
        spriteY,
        spriteWidth,
        spriteHeight,
      },
    } = entity;
    let X = Coordinates.X - ViewBox.x;
    let Y = Coordinates.Y - ViewBox.y;
    let dx = mapCoords.X + (X * zoomFactor) * scaleX;
    let dy = mapCoords.Y + (Y * zoomFactor) * scaleY;
    let dw = renderWidth * zoomFactor;
    let dh = renderHeight * zoomFactor;
    let trans = getCenterPoint(dx, dy, dw, dh);
    this.ctx.save();
    this.ctx.translate(trans.X, trans.Y);
    this.ctx.rotate(degreesToRadians(degrees));
    this.ctx.translate(-trans.X, -trans.Y);
    this.ctx.drawImage(
      spriteSheet,
      spriteX,
      spriteY,
      spriteWidth,
      spriteHeight,
      dx,
      dy,
      dw,
      dh
    );
    this.ctx.restore();
    // this.renderHitbox(entity, scaleFactor, mapCoords, ViewBox);
  }

  renderHitbox(
    entity: Entity,
    scaleFactor: number,
    mapCoords: any,
    viewbox: any
  ) {
    let scaledHb = entity.Collision.currentHb().map((v: VectorInterface) => ({
      X: mapCoords.X + (v.X - viewbox.x) * scaleFactor,
      Y: mapCoords.Y + (v.Y - viewbox.y) * scaleFactor,
    }));

    this.ctx.beginPath();
    this.ctx.moveTo(scaledHb[0].X, scaledHb[0].Y);
    for (let i = 0; i < scaledHb.length; i++) {
      let next = i + 1 === scaledHb.length ? scaledHb[0] : scaledHb[i + 1];
      this.ctx.lineTo(next.X, next.Y);
    }
    this.ctx.lineWidth = 3;
    this.ctx.strokeStyle = "#ff0000";
    this.ctx.stroke();
  }

  carInViewbox(entity: Entity, vb: any) {
    for (let v of entity.Collision.currentHb()) {
      if (v.X < vb.x || v.Y < vb.y || v.X > vb.x + vb.w || v.Y > vb.y + vb.h)
        return false;
    }
    return true;
  }

  drawBossBorder(mapx: number, mapy: number, mapw: number, maph: number) {
    let weight = maph / 80;
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.lineWidth = weight;
    this.ctx.strokeStyle = "#d83b39";
    this.ctx.moveTo(mapx, mapy);
    this.ctx.lineTo(mapx + mapw, mapy);
    this.ctx.lineTo(mapx + mapw, mapy + maph);
    this.ctx.lineTo(mapx, mapy + maph);
    this.ctx.lineTo(mapx, mapy);
    this.ctx.globalAlpha = 0.75;
    this.ctx.stroke();
    this.ctx.moveTo(mapx + weight / 2, mapy + weight / 2);
    this.ctx.lineTo(mapx + mapw - weight, mapy + weight);
    this.ctx.lineTo(mapx + mapw - weight, mapy + maph - weight);
    this.ctx.lineTo(mapx + weight, mapy + maph - weight);
    this.ctx.lineTo(mapx + weight / 2, mapy + weight / 2);
    this.ctx.globalAlpha = 0.5;
    this.ctx.stroke();
    this.ctx.moveTo(mapx + weight, mapy + weight);
    this.ctx.lineTo(mapx + mapw - 2 * weight, mapy + 2 * weight);
    this.ctx.lineTo(mapx + mapw - 2 * weight, mapy + maph - 2 * weight);
    this.ctx.lineTo(mapx + 2 * weight, mapy + maph - 2 * weight);
    this.ctx.lineTo(mapx + weight, mapy + weight);
    this.ctx.globalAlpha = 0.25;
    this.ctx.stroke();
    this.ctx.restore();
  }

  renderReferenceMap(
    map: any,
    mapx: number,
    mapy: number,
    mapw: number,
    maph: number,
    t: number,
    vb: any,
    tick: number
  ) {
    this.ctx.fillStyle = "#313131";
    this.ctx.fillRect(mapx, mapy, mapw, maph);
    let tiles = map.generateReferenceTileMap();
    let x = 0;
    let y = 0;
    for (let tile of tiles) {
      if (tile) {
        this.drawSquare(x * t + mapx, y * t + mapy, t, this.refColors[tile]);
      }
      if (++x >= map.width) {
        x = 0;
        y++;
      }
    }
    this.drawRefViewbox(vb, mapx, mapy, mapw, maph);
    this.drawRefCar(this.bossEntity, mapx, mapy, mapw, maph, t, tick);
    this.drawRefCar(this.playerEntity, mapx, mapy, mapw, maph, t, tick);
  }

  drawSquare(x: number, y: number, s: number, color: string) {
    this.ctx.save();
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x, y, s, s);
    this.ctx.restore();
  }

  drawRefViewbox(
    vb: any,
    mapx: number,
    mapy: number,
    mapw: number,
    maph: number
  ) {
    let x = vb.x * (mapw / 1000) + mapx;
    let y = vb.y * (mapw / 1000) + mapy;
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.strokeStyle = "#fff";
    this.ctx.lineWidth = 3;
    this.ctx.moveTo(x, y);
    this.ctx.lineTo(x + vb.w, y);
    this.ctx.lineTo(x + vb.w, y + vb.h);
    this.ctx.lineTo(x, y + vb.h);
    this.ctx.lineTo(x, y);
    this.ctx.stroke();
    this.ctx.restore();
  }

  drawRefCar(
    entity: Entity,
    mapx: number,
    mapy: number,
    mapw: number,
    maph: number,
    tileWidth: number,
    tick: number
  ) {
    let { X, Y } = entity.Collision.currentCp();
    let dotr = (tileWidth / 2) * 0.75;
    let { pulser, pulsea } = this.calculateDotPulse(tick, dotr);

    let scaledX = X * (mapw / 1000) + mapx;
    let scaledY = Y * (maph / 625) + mapy;

    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.arc(scaledX, scaledY, dotr, 0, 2 * Math.PI);
    this.ctx.fillStyle = this.refColors[entity.id];
    this.ctx.fill();
    this.ctx.beginPath();
    this.ctx.globalAlpha = pulsea;
    this.ctx.arc(scaledX, scaledY, pulser, 0, 2 * Math.PI);
    this.ctx.strokeStyle = this.refColors[entity.id];
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
    this.ctx.restore();
  }

  calculateDotPulse(tick: number, dotr: number) {
    let pulsea = 1,
      pulser = 0,
      maxr = 2 * dotr,
      dur = 750,
      int = 1000,
      progress = (tick * this.step) % int;
    if (progress < dur) {
      let pulseProgress = progress / dur;
      pulsea = 1 - pulseProgress;
      pulser = (maxr - dotr) * pulseProgress + dotr;
    }
    return { pulsea, pulser };
  }
}

export default RenderViewBox;
