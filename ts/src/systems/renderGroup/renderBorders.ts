import EntityComponentSystem, { Entity, ECS } from "@fritzy/ecs";
import { Game } from "../../main";

class RenderBorders extends EntityComponentSystem.System {
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
      if (!this.canvases[entity.id]) {
        this.initializeCanvas(
          entity.id,
          renderWidth,
          renderHeight,
          weight,
          radius
        );
      }
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
    this.drawChrome(ctx, sweight, sweight, sw, sh, sweight, sr);
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

export default RenderBorders;
