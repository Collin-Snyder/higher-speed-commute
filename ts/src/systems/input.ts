import ECS, { Entity, BaseComponent } from "@fritzy/ecs";
import { InputEvents } from "../main";
import keyCodes from "../keyCodes";
import { checkForMouseCollision, normalize } from "../modules/gameMath";

export class InputSystem extends ECS.System {
  public keyPressMap: { [key: string]: boolean };
  public global: BaseComponent;
  public inputs: InputEvents;
  public lastKeyDowns: Map<string, boolean>;
  public lastMousedown: boolean;
  public startMouseX: number;
  public startMouseY: number;
  static query: { has?: string[]; hasnt?: string[] } = {
    has: ["Car", "Velocity"],
  };

  constructor(ecs: any) {
    super(ecs);
    this.global = this.ecs.getEntity("global")["Global"];
    this.inputs = this.global.inputs;
    this.keyPressMap = this.inputs.keyPressMap;
    this.lastKeyDowns = new Map();
    this.lastMousedown = false;
    this.startMouseX = 0;
    this.startMouseY = 0;
  }

  update(tick: number, entities: Set<Entity>) {
    let mx = this.global.inputs.mouseX;
    let my = this.global.inputs.mouseY;
    let mousedown = this.global.inputs.mouseDown;
    let mode = this.global.game.mode;
    let dragging = this.global.inputs.dragging;

    //handle mouse inputs
    let clickable = this.ecs.queryEntities({
      has: ["Clickable", "Coordinates"],
      hasnt: ["NI"],
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
      let isMap = !!e.MapData;
      // let width = isMap ? e.MapData.map.pixelWidth : e.Renderable.renderWidth;
      // let height = isMap ? e.MapData.map.pixelHeight : e.Renderable.renderHeight;
      let {Renderable, Coordinates} = e;

      let mouseCollision = checkForMouseCollision(
        mx,
        my,
        Coordinates.X,
        Coordinates.Y,
        Renderable.renderWidth,
        Renderable.renderHeight
      );

      if (mouseCollision && !e.has("Disabled")) {
        cursor = isMap ? window.game.designModule.mapCursor : "pointer";

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
    if (mode === "playing" || mode === "paused") {
      if (mode === "playing") {
        const playerEntity = entities.values().next().value;
        playerEntity.Velocity.altVectors = this.getPotentialVectors();
      }
      this.handleGameplayKeypress(mode);
    } else if (mode === "designing") {
      this.handleDesignKeypress();
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

  handleGameplayKeypress(mode: "paused" | "playing") {
    let { game } = this.global;
    this.debounceKeypress(
      "SPACE",
      (gameMode: "paused" | "playing") => {
        gameMode === "paused"
          ? game.publish("resume")
          : game.publish("pause");
      },
      mode
    );

    if (mode === "paused") return;

    this.debounceKeypress("M", () => {
      game.mapView = !game.mapView;
    });
    this.debounceKeypress("B", () => {
      game.focusView =
        game.focusView === "boss" ? "player" : "boss";
    });
  }

  handleDesignKeypress() {
    let { shift, ctrl } = this.inputs;
    let { game } = this.global;

    this.debounceKeypress(
      "S",
      (ctrlPressed: boolean) => {
        if (ctrlPressed) game.publish("save");
      },
      ctrl
    );

    this.debounceKeypress(
      "Z",
      (ctrlPressed: boolean, shiftPressed: boolean) => {
        if (ctrlPressed && shiftPressed) {
          game.publish("redo");
        } else if (ctrlPressed) {
          game.publish("undo");
        } else {
          game.publish("setDesignTool", "schoolZone");
        }
      },
      ctrl,
      shift
    );

    this.debounceKeypress(
      "L",
      (ctrlPressed: boolean) => {
        if (ctrlPressed) {
          game.publish("loadSaved");
        } else game.publish("setDesignTool", "light");
      },
      ctrl
    );

    this.debounceKeypress(
      "Q",
      (ctrlPressed: boolean) => {
        if (ctrlPressed) game.publish("quit");
      },
      ctrl
    );

    this.debounceKeypress("P", () => {
      game.publish("setDesignTool", "playerHome");
    });
    this.debounceKeypress("B", () => {
      game.publish("setDesignTool", "bossHome");
    });
    this.debounceKeypress("O", () => {
      game.publish("setDesignTool", "office");
    });
    this.debounceKeypress("R", () => {
      game.publish("setDesignTool", "street");
    });
    this.debounceKeypress("C", () => {
      game.publish("setDesignTool", "coffee");
    });
    this.debounceKeypress("E", () => {
      game.publish("setDesignTool", "eraser");
    });
  }

  debounceKeypress(key: string, action: Function, ...actionArgs: any[]) {
    let keyPressed = this.keyPressMap[keyCodes[key]];
    if (keyPressed && !this.lastKeyDowns.get(key)) {
      action(...actionArgs);
      this.lastKeyDowns.set(key, keyPressed);
    } else if (!keyPressed && this.lastKeyDowns.has(key)) {
      this.lastKeyDowns.set(key, keyPressed);
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
