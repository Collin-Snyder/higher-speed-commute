import EntityComponentSystem, { Entity, ECS } from "@fritzy/ecs";
import { drawTileMap } from "../../modules/tileDrawer";
import { Tile } from "../../state/map";

class RenderSandbox extends EntityComponentSystem.System {
  private tileColors: { [type: string]: string };
  constructor(ecs: ECS, private ctx: CanvasRenderingContext2D) {
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
    let { game, spriteMap, spriteSheet } = this.ecs.getEntity("global").Global;
    let { mode, designModule } = game;

    if (mode !== "designing") return;
    let mapEntity = this.ecs.getEntity("map");
    let {
      TileData: { tiles, tileWidth, tileHeight },
      MapData: { map },
      Coordinates: { X, Y },
      Renderable: { renderWidth, renderHeight }
    } = mapEntity;

    this.ctx.fillStyle = "lightgray";
    this.ctx.fillRect(X, Y, renderWidth, renderHeight);
    
    tiles = tiles.map((t: any) => {
      t.w = tileWidth;
      t.h = tileHeight;
      return t;
    });

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
        if (type === "greenLight" || type === "coffee") return;
        this.ctx.fillStyle = this.tileColors[type];
        this.ctx.fillRect(
          x * tileWidth + X,
          y * tileHeight + Y,
          w,
          h
        );
      }
    );

    this.drawGrid(X, Y, renderWidth, renderHeight, tileWidth, tileHeight);

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
        if (type !== "greenLight" && type !== "coffee") return;
        let tileCoords =
          type === "greenLight" ? spriteMap.designLight : spriteMap.coffee;

        this.ctx.drawImage(
          spriteSheet,
          tileCoords.X,
          tileCoords.Y,
          25,
          25,
          x * tileWidth + X,
          y * tileHeight + Y,
          w,
          h
        );
      }
    );
  }

  drawGrid(mapx: number, mapy: number, mapw: number, maph: number, tilew: number, tileh: number) {
    let c = 39;
    let r = 24;
    let currCol = 1;
    let currRow = 1;
    this.ctx.save();
    while (currCol <= c) {
      //extra 0.5 added to values to prevent anti-aliasing
      //https://stackoverflow.com/questions/23376308/avoiding-lines-between-adjecent-svg-rectangles/23376793#23376793
      let colX = Math.floor(currCol * tilew + mapx) + 0.5;
      let colEndY = Math.floor(mapy + maph) + 0.5;
      this.ctx.strokeStyle = "black";
      this.ctx.lineWidth = 1;
      this.ctx.moveTo(colX, mapy);
      this.ctx.lineTo(colX, colEndY);
      this.ctx.stroke();
      currCol++;
    }

    while (currRow <= r) {
      let rowY = Math.floor(currRow * tileh + mapy) + 0.5;
      let rowEndX = Math.floor(mapx + mapw) + 0.5;
      this.ctx.strokeStyle = "black";
      this.ctx.lineWidth = 1;
      this.ctx.moveTo(mapx, rowY);
      this.ctx.lineTo(rowEndX, rowY);
      this.ctx.stroke();
      currRow++;
    }
    this.ctx.restore();
  }
}

export default RenderSandbox;
