import ECS, { Entity, BaseComponent } from "@fritzy/ecs";
import { Game, InputEvents } from "../main";
import keyCodes from "../keyCodes";
import { checkForMouseCollision, normalize } from "gameMath";

export class InputSystem extends ECS.System {
  public keyPressMap: { [key: string]: boolean };
  public global: BaseComponent;
  public inputs: InputEvents;
  public lastKeyDowns: Map<string, boolean>;
  public lastMousedown: boolean;
  public startMouseX: number;
  public startMouseY: number;
  public mx: number;
  public my: number;
  public mouseDown: boolean;
  public dragging: boolean;
  public focusedEntity: Entity | null;
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
    this.mx = 0;
    this.my = 0;
    this.mouseDown = false;
    this.dragging = false;
    this.focusedEntity = null;
  }

  update(tick: number, entities: Set<Entity>) {
    let { game, inputs } = this.ecs.getEntity("global").Global;

    game.UICanvas.style.cursor = "default";

    this.mx = inputs.mouseX;
    this.my = inputs.mouseY;
    this.mouseDown = inputs.mouseDown;
    this.dragging = inputs.dragging;
    let mode = game.mode;

    //handle mouse inputs
    let interactable = this.ecs.queryEntities({
      has: ["Interactable"],
    });

    let dragStarting = this.dragIsStarting();
    let dragEnding = this.dragIsEnding();
    let isMouseDownEvent = this.isMouseDownEvent();
    let isMouseUpEvent = this.isMouseUpEvent();

    //check if dragging
    //RIGHT NOW DRAG EVENTS ARE ONLY REGISTERED ON "CLICKABLE" OBJECTS - I think this is the best way?

    for (let e of interactable) {
      if (!e.Interactable.enabled) continue;

      let mouseCollision = checkForMouseCollision(
        this.mx,
        this.my,
        e.Coordinates.X,
        e.Coordinates.Y,
        e.Renderable.renderW,
        e.Renderable.renderH
      );

      if (!mouseCollision) continue;

      let {
        Interactable: {
          onHover,
          onMouseDown,
          onDragStart,
          onDrag,
          onClick,
          onMouseUp,
          onDragEnd,
        },
      } = e;

      onHover();

      if (isMouseDownEvent) {
        this.focusedEntity = e;
        onMouseDown();
      }
      if (dragStarting) onDragStart();
      if (this.dragging) onDrag();
      if (isMouseUpEvent) {
        if (e === this.focusedEntity) onClick(); 
      }
      if (dragEnding) {
        onDragEnd();
      }

      break;
    }

    if (dragStarting) {
      inputs.startDrag();
      this.dragging = inputs.dragging;
    }

    if (isMouseDownEvent) {
      this.lastMousedown = this.mouseDown;
      this.startMouseX = this.mx;
      this.startMouseY = this.my;
    }

    if (dragEnding) {
      this.focusedEntity?.Interactable.onDragEnd();
      inputs.endDrag();
      this.dragging = inputs.dragging;
    }

    if (isMouseUpEvent) {
      this.focusedEntity?.Interactable.onMouseUp();
      this.focusedEntity = null;
      this.lastMousedown = this.mouseDown;
      this.startMouseX = 0;
      this.startMouseY = 0;
    }

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

  dragIsStarting() {
    if (
      !this.dragging &&
      this.mouseDown &&
      this.lastMousedown &&
      (Math.abs(this.mx - this.startMouseX) > 5 ||
        Math.abs(this.my - this.startMouseY) > 5)
    )
      return true;

    return false;
  }

  dragIsEnding() {
    if (!this.mouseDown && this.lastMousedown && this.dragging) return true;
    return false;
  }

  isMouseDownEvent() {
    if (this.mouseDown && !this.lastMousedown) return true;
    return false;
  }

  isMouseUpEvent() {
    if (!this.mouseDown && this.lastMousedown) return true;
    return false;
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
