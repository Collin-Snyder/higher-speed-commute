import ECS, { Entity, BaseComponent } from "@fritzy/ecs";
import keyCodes from "../keyCodes";
import { checkForMouseCollision, normalize } from "../modules/gameMath";
import e from "@fritzy/ecs";
import { isConstructSignatureDeclaration } from "../../../node_modules/typescript/lib/typescript";

export class InputSystem extends ECS.System {
  public keyPressMap: { [key: string]: boolean };
  public global: BaseComponent;
  public spaceBarDebounce: number;
  public lastMousedown: boolean;
  public lastSpaceDown: boolean;
  public lastMDown: boolean;
  public lastBDown: boolean;
  public startMouseX: number;
  public startMouseY: number;
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
    this.lastMDown = false;
    this.lastBDown = false;
    this.startMouseX = 0;
    this.startMouseY = 0;
  }

  update(tick: number, entities: Set<Entity>) {
    let mx = this.global.inputs.mouseX;
    let my = this.global.inputs.mouseY;
    let mousedown = this.global.inputs.mouseDown;
    let mode = this.global.game.mode;
    let dragging = this.global.inputs.dragging;

    //handle spacebar input
    if (mode === "playing" || mode === "paused") this.handlePauseResume(mode);

    //handle mouse inputs
    let clickable = this.ecs.queryEntities({
      has: ["Clickable", "Coordinates"],
      hasnt: ["noninteractive"],
    });
    let cursor = "default";
    let clicked;

    //check if dragging
    //RIGHT NOW DRAG EVENTS ARE ONLY REGISTERED ON "CLICKABLE" OBJECTS - I think this is the best way?
    if (
      !dragging &&
      mousedown &&
      this.lastMousedown &&
      (Math.abs(mx - this.startMouseX) > 5 ||
        Math.abs(my - this.startMouseY) > 5)
    ) {
      this.global.inputs.startDrag();
      this.global.game.designModule.startDrawing();
      dragging = this.global.inputs.dragging;
    }

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

      if (mouseCollision && !e.has("Disabled")) {
        cursor = isMap ? this.global.game.designModule.mapCursor : "pointer";

        if (dragging && isMap) clicked = e;
        else if (!dragging && mousedown && !this.lastMousedown) {
          clicked = e;
          this.lastMousedown = mousedown;
          this.startMouseX = mx;
          this.startMouseY = my;
        }
        break;
      }
    }
    if (clicked) clicked.Clickable.onClick();

    if (!mousedown && this.lastMousedown) {
      this.lastMousedown = mousedown;
      this.startMouseX = 0;
      this.startMouseY = 0;
      if (dragging) {
        this.global.inputs.endDrag();
        this.global.game.designModule.stopDrawing();
      }
    }
    this.global.game.UICanvas.style.cursor = cursor;

    //handle keypress inputs
    if (this.global.game.mode === "playing") {
      const playerEntity = entities.values().next().value;
      playerEntity.Velocity.altVectors = this.getPotentialVectors();
      this.handleMapView();
      this.handleBossView();
    } else if (this.global.game.mode === "designing") {
      //all the modifier key events
    }
  }

  getPotentialVectors() {
    const potentials = [];
    let [isLeft, isRight, isUp, isDown] = [
      this.isLeft(),
      this.isRight(),
      this.isUp(),
      this.isDown(),
    ];

    const [up, down, left, right] = [
      { X: 0, Y: -1 },
      { X: 0, Y: 1 },
      { X: -1, Y: 0 },
      { X: 1, Y: 0 },
    ];

    if (isLeft && isRight) isLeft = isRight = false;
    if (isUp && isDown) isUp = isDown = false;

    if (isLeft && isUp) potentials.push(normalize([left, up]));
    if (isLeft && isDown) potentials.push(normalize([left, down]));
    if (isRight && isUp) potentials.push(normalize([right, up]));
    if (isRight && isDown) potentials.push(normalize([right, down]));

    if (isLeft) potentials.push(left);
    if (isRight) potentials.push(right);
    if (isUp) potentials.push(up);
    if (isDown) potentials.push(down);

    if (!potentials.length) potentials.push({ X: 0, Y: 0 });

    return potentials;
  }

  handlePauseResume(mode: string) {
    let spaceDown = this.keyPressMap[keyCodes.SPACE];
    if (spaceDown && !this.lastSpaceDown) {
      mode === "paused"
        ? this.global.game.publish("resume")
        : this.global.game.publish("pause");
      this.lastSpaceDown = spaceDown;
    } else if (!spaceDown && this.lastSpaceDown) {
      this.lastSpaceDown = spaceDown;
    }
  }

  handleBossView() {
    let bDown = this.keyPressMap[keyCodes.B];
    if (bDown && !this.lastBDown) {
      this.global.game.focusView = this.global.game.focusView === "boss" ? "player" : "boss";
      this.lastBDown = bDown;
    } else if (!bDown && this.lastBDown) {
      this.lastBDown = bDown;
    }
  }

  handleMapView() {
    let mDown = this.keyPressMap[keyCodes.M];
    if (mDown && !this.lastMDown) {
      this.global.game.mapView = !this.global.game.mapView;
      this.lastMDown = mDown;
    } else if (!mDown && this.lastMDown) {
      this.lastMDown = mDown;
    }
  }

  isUp() {
    return this.keyPressMap[keyCodes.UP] || this.keyPressMap[keyCodes.W];
  }

  isDown() {
    return this.keyPressMap[keyCodes.DOWN] || this.keyPressMap[keyCodes.S];
  }

  isLeft() {
    return this.keyPressMap[keyCodes.LEFT] || this.keyPressMap[keyCodes.A];
  }

  isRight() {
    return this.keyPressMap[keyCodes.RIGHT] || this.keyPressMap[keyCodes.D];
  }
}
