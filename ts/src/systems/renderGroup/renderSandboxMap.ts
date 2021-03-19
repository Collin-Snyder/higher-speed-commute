import EntityComponentSystem, { Entity, ECS, BaseComponent } from "@fritzy/ecs";
import { Game } from "../../main";
import { drawTileMap } from "gameHelpers";

class RenderSandboxMap extends EntityComponentSystem.System {
  private tileColors: { [type: string]: string };
  constructor(private _game: Game, ecs: ECS, private ctx: CanvasRenderingContext2D) {
    super(ecs);
    this.tileColors = {
      street: "#1e1e1e",
      schoolZone: "#988612",
      playerHome: "#0058cf",
      bossHome: "#eb3626",
      office: "#f0d31a",
    };
  }

  update(tick: number, entities: Set<Entity>) {
    let { mode, designModule, spriteSheet, spriteMap } = this._game;

    if (mode !== "designing") return;

    let mapEntity = this.ecs.getEntity("map");
    let {
      TileData: { tiles, tileWidth, tileHeight },
      MapData: { map },
      Coordinates: { X, Y },
      Renderable: { renderW, renderH },
    } = mapEntity;

    this.ctx.fillStyle = "lightgray";
    this.ctx.fillRect(X, Y, renderW, renderH);

    tiles = tiles.map((t: any) => {
      t.w = tileWidth;
      t.h = tileHeight;
      return t;
    });

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
        if (type === "greenLight" || type === "coffee") return;
        this.ctx.fillStyle = this.tileColors[type];
        this.ctx.fillRect(x * tileWidth + X, y * tileHeight + Y, w, h);
      }
    );

    if (designModule.gridLoaded) {
      this.ctx.drawImage(
        designModule.gridOverlay,
        X,
        Y,
        renderW,
        renderH
      );
    }

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
        if (type !== "greenLight" && type !== "coffee") return;
        let sprite =
          type === "greenLight" ? <ISprite>spriteMap.getSprite("designLight") : <ISprite>spriteMap.getSprite("coffee");
        this.ctx.drawImage(
          spriteSheet,
          sprite.x,
          sprite.y,
          sprite.w,
          sprite.h,
          x * tileWidth + X,
          y * tileHeight + Y,
          w,
          h
        );
      }
    );
  }
}

export default RenderSandboxMap;
