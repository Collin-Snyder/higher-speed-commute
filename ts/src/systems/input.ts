import ECS, { Entity, BaseComponent } from "@fritzy/ecs";
import { Game, InputEvents } from "../main";
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
    let { game, inputs } = this.ecs.getEntity("global").Global;

    let mx = inputs.mouseX;
    let my = inputs.mouseY;
    let mousedown = inputs.mouseDown;
    let mode = game.mode;
    let dragging = inputs.dragging;

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
      inputs.startDrag();
      game.designModule.startDrawing();
      dragging = inputs.dragging;
    }

    for (let e of clickable) {
      let isMap = e.id === "map";
      // let width = isMap ? e.MapData.map.pixelWidth : e.Renderable.renderW;
      // let height = isMap ? e.MapData.map.pixelHeight : e.Renderable.renderH;

      let mouseCollision = checkForMouseCollision(
        mx,
        my,
        e.Coordinates.X,
        e.Coordinates.Y,
        e.Renderable.renderW,
        e.Renderable.renderH
      );

      if (mouseCollision && !e.has("Disabled")) {
        cursor = isMap ? game.designModule.mapCursor : "pointer";

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
        inputs.endDrag();
        game.designModule.stopDrawing();
      }
    }
    game.UICanvas.style.cursor = cursor;

    //handle keypress inputs
    if (mode === "playing" || mode === "paused") {
      if (mode === "playing") {
        const playerEntity = entities.values().next().value;
        playerEntity.Velocity.altVectors = this.getPotentialVectors();
      }
      this.handleGameplayKeypress(game, mode);
    } else if (mode === "designing") {
      this.handleDesignKeypress(game, inputs);
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

  handleGameplayKeypress(game: Game, mode: "paused" | "playing") {
    // let { game } = this.global;
    this.debounceKeypress(
      "SPACE",
      (gameMode: "paused" | "playing") => {
        gameMode === "paused" ? game.publish("resume") : game.publish("pause");
      },
      mode
    );

    if (mode === "paused") return;

    this.debounceKeypress("M", () => {
      game.mapView = !game.mapView;
    });
    this.debounceKeypress("B", () => {
      game.focusView = game.focusView === "boss" ? "player" : "boss";
    });
  }

  handleDesignKeypress(game: Game, inputs: InputEvents) {
    let { shift, ctrl } = inputs;

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
