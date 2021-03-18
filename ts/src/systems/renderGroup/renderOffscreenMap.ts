import EntityComponentSystem, { Entity, ECS } from "@fritzy/ecs";
import { Game } from "../../main";
import { getCenterPoint, degreesToRadians } from "gameMath";
import { drawTileMap } from "../../modules/tileDrawer";

class RenderOffscreenMap extends EntityComponentSystem.System {
  static query: { has?: string[]; hasnt?: string[] } = {
    has: ["TileData", "MapData"],
  };

  private modeNames: string[];
  private schoolZoneAlpha: number;
  private schoolZoneAlphaStep: number;
  private schoolZoneAlphaMin: number;
  private schoolZoneAlphaMax: number;

  constructor(private _game: Game, ecs: ECS, private ctx: CanvasRenderingContext2D) {
    super(ecs);
    this.modeNames = [
      "playing",
      "paused",
      "won",
      "lost",
      "levelStartAnimation",
    ];
    this.schoolZoneAlphaStep = -0.03;
    this.schoolZoneAlphaMin = 0.03;
    this.schoolZoneAlphaMax = 0.8;
    this.schoolZoneAlpha = this.schoolZoneAlphaMax;
  }

  update(tick: number, entities: Set<Entity> | Array<Entity>) {
    let mode = this._game.mode;
    if (!this.modeNames.includes(mode)) return;

    const mapEntity = entities.values().next().value;
    const {
      TileData: { tiles },
      MapData: { map },
      Renderable,
    } = mapEntity;

    if (mode === "levelStartAnimation" || mode === "won" || mode === "lost") {
      this.ctx.save();
      this.ctx.globalAlpha = Renderable.alpha;
      // this.ctx.fillStyle = Renderable.bgColor;
      // this.ctx.fillRect(0, 0, map.pixelWidth, map.pixelHeight);
      this.ctx.drawImage(
        this._game.OSMapBackgroundCanvas,
        0,
        0
      );

      drawTileMap(
        tiles,
        map.width,
        (
          type: TTile,
          x: number,
          y: number,
          w: number,
          h: number,
          a: number,
          deg: number
        ) => {
          // if (type === "schoolZone") type = "street";
          let sprite;

          if (type === "playerHome") sprite = <ISprite>this._game.spriteMap.getPlayerHomeSprite();
          else sprite = <ISprite>this._game.spriteMap.getSprite(type);

          let hasAlpha = a < 1;
          let hasRotation = deg !== 0;
          if (hasAlpha || hasRotation) this.ctx.save();
          if (hasAlpha) this.ctx.globalAlpha = a;
          if (hasRotation) this.ctx.rotate(degreesToRadians(deg));
          this.ctx.drawImage(
            this._game.spriteSheet,
            sprite.x,
            sprite.y,
            25,
            25,
            x * 25,
            y * 25,
            w,
            h
          );
          if (hasAlpha || hasRotation) this.ctx.restore();
        }
      );
      this.ctx.restore();
    }
    if (mode === "playing") this.renderSchoolZoneTiles(tiles, map.width);
    // this.renderMiniCars(global.spriteSheet);
  }

  renderSchoolZoneTiles(tileArray: ITile[], mapWidth: number) {
    this.ctx.save();
    this.ctx.fillStyle = "#ffd300";
    this.schoolZoneAlpha += this.schoolZoneAlphaStep;
    this.ctx.globalAlpha = this.schoolZoneAlpha;

    drawTileMap(
      tileArray,
      mapWidth,
      (
        type: TTile,
        x: number,
        y: number,
        w: number,
        h: number,
        a: number,
        deg: number
      ) => {
        if (type !== "schoolZone") return;
        let sprite = <ISprite>this._game.spriteMap.getSprite("schoolZone");
        this.ctx.drawImage(
          this._game.spriteSheet,
          sprite.x,
          sprite.y,
          25,
          25,
          x * 25,
          y * 25,
          w,
          h
        );
        this.ctx.fillRect(x * 25, y * 25, w, h);
      }
    );

    if (
      !this.schoolZoneAlpha.between(
        this.schoolZoneAlphaMin,
        this.schoolZoneAlphaMax
      )
    ) {
      this.schoolZoneAlphaStep *= -1;
    }
    this.ctx.restore();
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
      let dw = entity.Renderable.renderW;
      let dh = entity.Renderable.renderH;
      let trans = getCenterPoint(dx, dy, dw, dh);
      ctx.save();
      ctx.translate(trans.X, trans.Y);
      ctx.rotate(degreesToRadians(entity.Renderable.degrees));
      ctx.translate(-trans.X, -trans.Y);
      ctx.drawImage(
        spriteSheet,
        entity.Renderable.spriteX,
        entity.Renderable.spriteY,
        entity.Renderable.spriteW,
        entity.Renderable.spriteH,
        dx,
        dy,
        dw,
        dh
      );
      ctx.restore();
    }
  }
}

export default RenderOffscreenMap;
