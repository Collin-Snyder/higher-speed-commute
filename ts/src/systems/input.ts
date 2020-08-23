import ECS, { Entity, BaseComponent } from "@fritzy/ecs";
import keyCodes from "../keyCodes";
import { checkForMouseCollision } from "../modules/gameMath";
import e from "@fritzy/ecs";

export class InputSystem extends ECS.System {
  public keyPressMap: { [key: string]: boolean };
  public global: BaseComponent;
  public spaceBarDebounce: number;
  // public clickDebounce: number;
  public lastMousedown: boolean;
  public lastSpaceDown: boolean;
  static query: { has?: string[]; hasnt?: string[] } = {
    has: ["Car", "Velocity"],
  };

  constructor(ecs: any) {
    super(ecs);
    this.global = this.ecs.getEntity("global")["Global"];
    this.keyPressMap = this.global.inputs.keyPressMap;
    this.spaceBarDebounce = 20;
    this.lastMousedown = false;
    this.lastSpaceDown = false;
  }

  update(tick: number, entities: Set<Entity>) {
    let mx = this.global.inputs.mouseX;
    let my = this.global.inputs.mouseY;
    let mousedown = this.global.inputs.mouseDown;
    let mode = this.global.mode;

    // let newSBTime = this.spaceBarDebounce - tick;
    // if (newSBTime <= 0) {
    //   if (this.keyPressMap[keyCodes.SPACE]) {
    //     this.global.mode = this.global.mode === "paused" ? "playing" : "paused";
    //     this.spaceBarDebounce = tick + 20;
    //   }
    // }

    //handle spacebar input
    if (mode === "playing" || mode === "paused") {
      let spaceDown = this.keyPressMap[keyCodes.SPACE];
      if (spaceDown && !this.lastSpaceDown) {
        this.global.mode = this.global.mode === "paused" ? "playing" : "paused";
        this.lastSpaceDown = spaceDown;
      } else if (!spaceDown && this.lastSpaceDown) {
        this.lastSpaceDown = spaceDown;
      }
    }

    //handle mouse inputs
    let clickable = this.ecs.queryEntities({
      has: ["Clickable", "Coordinates"],
    });
    let cursor = "default";
    let clicked;

    for (let e of clickable) {
      let isMap = !!e.Map;
      let width = isMap ? e.Map.map.pixelWidth : e.Renderable.renderWidth;
      let height = isMap ? e.Map.map.pixelHeight : e.Renderable.renderHeight;

      let mouseCollision = checkForMouseCollision(
        mx,
        my,
        e.Coordinates.X,
        e.Coordinates.Y,
        width,
        height
      );

      if (mouseCollision) {
        cursor = isMap ? "cell" : "pointer";

        if (mousedown && !this.lastMousedown) {
          console.log("click registered");
          clicked = e;
          this.lastMousedown = mousedown;
        } else if (!mousedown && this.lastMousedown) {
          this.lastMousedown = mousedown;
        }
        break;
      }
    }
    this.global.game.UICanvas.style.cursor = cursor;

    if (clicked) clicked.Clickable.onClick();

    //handle keypress inputs
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

  handleMapMouseInput() {
    //run map entity's onclick
    //set global mousedown to "" - this will need to be changed to accommodate dragging
  }

  handleUIMouseInput() {}
}
