import EntityComponentSystem, { Entity, ECS } from "@fritzy/ecs";
import { getCenterPoint, degreesToRadians } from "../../modules/gameMath";
import { drawTileMap } from "../../modules/tileDrawer";
import { Tile } from "../../state/map";

///// THIS SYSTEM ONLY RENDERS TO OFFSCREEN MAP CANVAS /////
///// Rendering to main ui canvas is handled by RenderViewbox /////

class RenderMap extends EntityComponentSystem.System {
  static query: { has?: string[]; hasnt?: string[] } = {
    has: ["TileData", "MapData"],
  };

  private modeNames: string[];

  constructor(ecs: ECS, private ctx: CanvasRenderingContext2D) {
    super(ecs);
    this.modeNames = [
      "playing",
      "paused",
      "won",
      "lost",
      "levelStartAnimation",
    ];
  }

  update(tick: number, entities: Set<Entity> | Array<Entity>) {
    let mode = window.game.mode;
    if (!this.modeNames.includes(mode)) return;

    const global = this.ecs.getEntity("global").Global;
    const mapEntity = entities.values().next().value;
    const {
      TileData: { tiles, tileWidth, tileHeight },
      MapData: { map },
      Renderable,
    } = mapEntity;

    if (
      mode === "designing" ||
      mode === "levelStartAnimation" ||
      mode === "won" ||
      mode === "lost"
    ) {
      this.ctx.save();
      this.ctx.globalAlpha = Renderable.alpha;
      this.ctx.fillStyle = Renderable.bgColor;
      this.ctx.fillRect(0, 0, map.pixelWidth, map.pixelHeight);
      drawTileMap(
        tiles,
        map.width,
        (
          type: Tile,
          x: number,
          y: number,
          w: number,
          h: number,
          a: number,
          deg: number
        ) => {
          let tileCoords = global.spriteMap[type];
          let hasAlpha = a < 1;
          let hasRotation = deg !== 0;
          if (hasAlpha || hasRotation) this.ctx.save();
          if (hasAlpha) this.ctx.globalAlpha = a;
          if (hasRotation) this.ctx.rotate(degreesToRadians(deg));
          this.ctx.drawImage(
            global.spriteSheet,
            tileCoords.X,
            tileCoords.Y,
            tileWidth,
            tileHeight,
            x * tileWidth,
            y * tileHeight,
            w,
            h
          );
          if (hasAlpha || hasRotation) this.ctx.restore();
        }
      );
    }
    this.ctx.restore();

    // this.renderMiniCars(global.spriteSheet);
  }

  renderMiniCars(spriteSheet: any) {
    let map = <HTMLCanvasElement>document.getElementById("map-offscreen");
    let ctx = <CanvasRenderingContext2D>map.getContext("2d");
    map.style.zIndex = "100";
    map.style.position = "absolute";
    map.style.display = "block";
    let [player, boss] = [
      this.ecs.getEntity("player"),
      this.ecs.getEntity("boss"),
    ];
    for (let entity of [player, boss]) {
      let { X, Y } = entity.Coordinates;
      let dx = X;
      let dy = Y;
      let dw = entity.Renderable.renderWidth;
      let dh = entity.Renderable.renderHeight;
      let trans = getCenterPoint(dx, dy, dw, dh);
      ctx.save();
      ctx.translate(trans.X, trans.Y);
      ctx.rotate(degreesToRadians(entity.Renderable.degrees));
      ctx.translate(-trans.X, -trans.Y);
      ctx.drawImage(
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
      ctx.restore();
    }
  }
}

export default RenderMap;