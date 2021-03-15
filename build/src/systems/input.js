import ECS from "@fritzy/ecs";
import keyCodes from "../keyCodes";
import { checkForMouseCollision, normalize } from "gameMath";
export class InputSystem extends ECS.System {
    constructor(_game, ecs) {
        super(ecs);
        this._game = _game;
        this.global = this.ecs.getEntity("global")["Global"];
        this.keyPressMap = this.global.inputs.keyPressMap;
        this.lastKeyDowns = new Map();
        this.lastMousedown = false;
        this.startMouseX = 0;
        this.startMouseY = 0;
        this.mx = 0;
        this.my = 0;
        this.mouseDown = false;
        this.dragging = false;
        this.focusedEntity = null;
        this.collisions = new Map();
    }
    update(tick, entities) {
        var _a, _b;
        let { inputs } = this.global;
        let { mouseX, mouseY, mouseDown, dragging } = inputs;
        this._game.UICanvas.style.cursor = "default";
        this.mx = mouseX;
        this.my = mouseY;
        this.mouseDown = mouseDown;
        this.dragging = dragging;
        let mode = this._game.mode;
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
            if (!e.Interactable.enabled)
                continue;
            let { Interactable: { onHover, onMouseEnter, onMouseLeave, onMouseDown, onDragStart, onDrag, onClick, onMouseUp, onDragEnd, }, } = e;
            let mouseCollision = checkForMouseCollision(this.mx, this.my, e.Coordinates.X, e.Coordinates.Y, e.Renderable.renderW, e.Renderable.renderH);
            if (!mouseCollision) {
                if (this.collisions.has(e.id)) {
                    this.collisions.delete(e.id);
                    onMouseLeave();
                }
                continue;
            }
            if (!this.collisions.has(e.id)) {
                this.collisions.set(e.id, true);
                onMouseEnter();
            }
            onHover();
            if (isMouseDownEvent) {
                this.focusedEntity = e;
                onMouseDown();
            }
            if (dragStarting)
                onDragStart();
            if (this.dragging)
                onDrag();
            if (isMouseUpEvent) {
                if (e === this.focusedEntity)
                    onClick();
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
            (_a = this.focusedEntity) === null || _a === void 0 ? void 0 : _a.Interactable.onDragEnd();
            inputs.endDrag();
            this.dragging = inputs.dragging;
        }
        if (isMouseUpEvent) {
            (_b = this.focusedEntity) === null || _b === void 0 ? void 0 : _b.Interactable.onMouseUp();
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
            this.handleGameplayKeypress(mode);
        }
        else if (mode === "designing") {
            this.handleDesignKeypress(inputs);
        }
    }
    dragIsStarting() {
        if (!this.dragging &&
            this.mouseDown &&
            this.lastMousedown &&
            (Math.abs(this.mx - this.startMouseX) > 5 ||
                Math.abs(this.my - this.startMouseY) > 5))
            return true;
        return false;
    }
    dragIsEnding() {
        if (!this.mouseDown && this.lastMousedown && this.dragging)
            return true;
        return false;
    }
    isMouseDownEvent() {
        if (this.mouseDown && !this.lastMousedown)
            return true;
        return false;
    }
    isMouseUpEvent() {
        if (!this.mouseDown && this.lastMousedown)
            return true;
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
        if (isLeft && isRight)
            isLeft = isRight = false;
        if (isUp && isDown)
            isUp = isDown = false;
        if (isLeft && isUp)
            potentials.push(normalize([left, up]));
        if (isLeft && isDown)
            potentials.push(normalize([left, down]));
        if (isRight && isUp)
            potentials.push(normalize([right, up]));
        if (isRight && isDown)
            potentials.push(normalize([right, down]));
        if (isLeft)
            potentials.push(left);
        if (isRight)
            potentials.push(right);
        if (isUp)
            potentials.push(up);
        if (isDown)
            potentials.push(down);
        if (!potentials.length)
            potentials.push({ X: 0, Y: 0 });
        return potentials;
    }
    handleGameplayKeypress(mode) {
        this.debounceKeypress("SPACE", (gameMode) => {
            gameMode === "paused"
                ? this._game.publish("resume")
                : this._game.publish("pause");
        }, mode);
        if (mode === "paused")
            return;
        this.debounceKeypress("M", () => {
            this._game.mapView = !this._game.mapView;
        });
        this.debounceKeypress("B", () => {
            this._game.focusView =
                this._game.focusView === "boss" ? "player" : "boss";
        });
    }
    handleDesignKeypress(inputs) {
        let { shift, ctrl } = inputs;
        this.debounceKeypress("S", (ctrlPressed) => {
            if (ctrlPressed)
                this._game.publish("save");
        }, ctrl);
        this.debounceKeypress("Z", (ctrlPressed, shiftPressed) => {
            if (ctrlPressed && shiftPressed) {
                this._game.publish("redo");
            }
            else if (ctrlPressed) {
                this._game.publish("undo");
            }
            else {
                this._game.publish("setDesignTool", "schoolZone");
            }
        }, ctrl, shift);
        this.debounceKeypress("L", (ctrlPressed) => {
            if (ctrlPressed) {
                this._game.publish("loadSaved");
            }
            else
                this._game.publish("setDesignTool", "light");
        }, ctrl);
        this.debounceKeypress("Q", (ctrlPressed) => {
            if (ctrlPressed)
                this._game.publish("quit");
        }, ctrl);
        this.debounceKeypress("P", () => {
            this._game.publish("setDesignTool", "playerHome");
        });
        this.debounceKeypress("B", () => {
            this._game.publish("setDesignTool", "bossHome");
        });
        this.debounceKeypress("O", () => {
            this._game.publish("setDesignTool", "office");
        });
        this.debounceKeypress("R", () => {
            this._game.publish("setDesignTool", "street");
        });
        this.debounceKeypress("C", () => {
            this._game.publish("setDesignTool", "coffee");
        });
        this.debounceKeypress("E", () => {
            this._game.publish("setDesignTool", "eraser");
        });
    }
    debounceKeypress(key, action, ...actionArgs) {
        let keyPressed = this.keyPressMap[keyCodes[key]];
        if (keyPressed && !this.lastKeyDowns.get(key)) {
            action(...actionArgs);
            this.lastKeyDowns.set(key, keyPressed);
        }
        else if (!keyPressed && this.lastKeyDowns.has(key)) {
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
InputSystem.query = {
    has: ["Car", "Velocity"],
};
