import ECS, { Entity, BaseComponent } from "@fritzy/ecs";
import keyCodes from "../keyCodes";
import { checkForMouseCollision } from "../modules/gameMath";
import e from "@fritzy/ecs";

export class InputSystem extends ECS.System {
  public keyPressMap: { [key: string]: boolean };
  public global: BaseComponent;
  public spaceBarDebounce: number;
  public clickDebounce: number;
  static query: { has?: string[]; hasnt?: string[] } = {
    has: ["Car", "Velocity"],
  };

  constructor(ecs: any) {
    super(ecs);
    this.global = this.ecs.getEntity("global")["Global"];
    this.keyPressMap = this.global.inputs.keyPressMap;
    this.spaceBarDebounce = 20;
    this.clickDebounce = 20;
  }

  update(tick: number, entities: Set<Entity>) {
    let mx = this.global.inputs.mouseX;
    let my = this.global.inputs.mouseY;

    let newSBTime = this.spaceBarDebounce - tick;
    if (newSBTime <= 0) {
      if (this.keyPressMap[keyCodes.SPACE]) {
        this.global.mode = this.global.mode === "paused" ? "playing" : "paused";
        this.spaceBarDebounce = tick + 20;
      }
    }
    let clickable = this.ecs.queryEntities({
      has: ["Clickable", "Coordinates", "Renderable"],
    });
    let pointer = false;
    let clicked;
    // let newClickTime = this.clickDebounce - tick;
    for (let e of clickable) {
      let mouseCollision = checkForMouseCollision(
        mx,
        my,
        e.Coordinates.X,
        e.Coordinates.Y,
        e.Renderable.renderWidth,
        e.Renderable.renderHeight
        );
      if (mouseCollision) {
        pointer = true;
        if (this.global.inputs.mouseDown /*&& newClickTime <= 0*/) {
          clicked = e;
          this.global.inputs.mouseDown = false;
        }
        break;
      }
    }
    if (pointer) {
      this.global.game.gameCanvas.style.cursor = "pointer";
      this.global.game.UICanvas.style.cursor = "pointer";
    } else {
      this.global.game.gameCanvas.style.cursor = "default";
      this.global.game.UICanvas.style.cursor = "default";
    }
    if (clicked) {
      clicked.Clickable.onClick();
    }
    // this.clickDebounce = tick + 50;
    

    if (this.global.mode === "playing") {
      const playerEntity = entities.values().next().value;
      playerEntity.Velocity.altVectors = this.getPotentialVectors();
    }
  }

  getPotentialVectors() {
    let potentials = [];
    if (this.keyPressMap[keyCodes.LEFT] && !this.keyPressMap[keyCodes.RIGHT])
      potentials.push({ X: -1, Y: 0 });
    if (this.keyPressMap[keyCodes.RIGHT] && !this.keyPressMap[keyCodes.LEFT])
      potentials.push({ X: 1, Y: 0 });
    if (this.keyPressMap[keyCodes.UP] && !this.keyPressMap[keyCodes.DOWN])
      potentials.push({ X: 0, Y: -1 });
    if (this.keyPressMap[keyCodes.DOWN] && !this.keyPressMap[keyCodes.UP])
      potentials.push({ X: 0, Y: 1 });
    if (!potentials.length) potentials.push({ X: 0, Y: 0 });
    return potentials;
  }
}
