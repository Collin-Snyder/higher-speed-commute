import EntityComponentSystem, { Entity, ECS } from "@fritzy/ecs";
import { Game } from "../../main";

class RenderBackground extends EntityComponentSystem.System {
  private ctx: CanvasRenderingContext2D;
  constructor(ecs: ECS, ctx: CanvasRenderingContext2D) {
    super(ecs);
    this.ctx = ctx;
  }
  update(tick: number, entities: Set<Entity>) {
    let game = window.game;
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

export default RenderBackground;
