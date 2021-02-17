import EntityComponentSystem, { Entity, ECS } from "@fritzy/ecs";
import { Game } from "../../main";

class RenderGameplayEntities extends EntityComponentSystem.System {
  static query: { has?: string[]; hasnt?: string[] } = {
    has: ["Coordinates", "Renderable"],
    hasnt: ["Button", "Car", "MapData"],
  };


  constructor(
    ecs: ECS,
    private ctx: CanvasRenderingContext2D,
    private canvas: HTMLCanvasElement
  ) {
    super(ecs);
    
  }

  update(tick: number, entities: Set<Entity>) {
    let { game } = this.ecs.getEntity("global").Global;
    const mode = game.mode;

    if (mode === "playing" || mode === "levelStartAnimation") {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      for (let entity of entities) {
        let {
          Renderable: {
            visible,
            renderW,
            renderH,
            spriteX,
            spriteY,
            spriteW,
            spriteH,
          },
          Coordinates: { X, Y },
        } = entity;

        if (spriteX === 0 && spriteY === 0) continue;
        if (visible && entity.id !== "countdown") {
          if (entity.Color) {
            this.drawLightTile(entity.Color.color, X, Y, renderW, renderH);
          }
          this.ctx.drawImage(
            game.spriteSheet,
            spriteX,
            spriteY,
            spriteW,
            spriteH,
            X,
            Y,
            renderW,
            renderH
          );
        }
      }
    }
  }

  drawLightTile(
    color: "red" | "green" | "yellow",
    x: number,
    y: number,
    w: number,
    h: number
  ) {
    this.ctx.save();
    this.ctx.globalAlpha = 0.3;
    switch (color) {
      case "red":
        this.ctx.fillStyle = "#ff0000";
        break;
      case "yellow":
        this.ctx.fillStyle = "#ffcc00";
        break;
      case "green":
      default:
        this.ctx.fillStyle = "#00ff00";
    }
    this.ctx.fillRect(x, y, w, h);
    this.ctx.restore();
  }
}

export default RenderGameplayEntities;
