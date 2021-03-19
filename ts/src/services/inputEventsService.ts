import keyCodes from "../staticData/keyCodes";

export default class InputEventService {
    public UICanvas: HTMLCanvasElement;
    public mouseX: number;
    public mouseY: number;
    public mouseDown: boolean;
    public dragging: boolean;
    public modifiableKeycodes: number[];
    public shift: boolean;
    public ctrl: boolean;
    public keyPressMap: { [keyCode: number]: boolean };
  
    constructor() {
      this.UICanvas = <HTMLCanvasElement>document.getElementById("ui");
      this.mouseX = 0;
      this.mouseY = 0;
      this.mouseDown = false;
      this.keyPressMap = {};
      this.dragging = false;
      this.modifiableKeycodes = [keyCodes.S, keyCodes.Q, keyCodes.L, keyCodes.Z];
      this.shift = false;
      this.ctrl = false;
  
      for (let keyName in keyCodes) {
        this.keyPressMap[keyCodes[keyName]] = false;
      }
  
      document.addEventListener("keydown", (e) => this.handleKeypress(e));
      document.addEventListener("keyup", (e) => this.handleKeypress(e));
      document.addEventListener("keypress", (e) => this.handleKeypress(e));
      this.UICanvas.addEventListener("mousedown", (e) =>
        this.handleUIMouseEvent(e)
      );
      this.UICanvas.addEventListener("mouseup", (e) =>
        this.handleUIMouseEvent(e)
      );
      this.UICanvas.addEventListener("mousemove", (e) =>
        this.handleUIMouseEvent(e)
      );
      document.addEventListener("pointerdown", (e: PointerEvent) => {
        //@ts-ignore
        e.target.setPointerCapture(e.pointerId);
      });
  
      document.addEventListener("pointerup", (e: PointerEvent) => {
        //@ts-ignore
        e.target.releasePointerCapture(e.pointerId);
      });
    }
  
    private handleKeypress = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName == "INPUT") return;
  
      this.shift = e.getModifierState("Shift");
      this.ctrl = e.getModifierState("Control");
  
      switch (e.type) {
        case "keydown":
          this.keyPressMap[e.keyCode] = true;
          if (this.modifiableKeycodes.includes(e.keyCode) && this.ctrl)
            e.preventDefault();
          break;
        case "keyup":
          this.keyPressMap[e.keyCode] = false;
          break;
        default:
          return;
      }
    };
  
    private handleUIMouseEvent = (e: MouseEvent) => {
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
      //@ts-ignore
      let id = e.currentTarget.id;
  
      switch (e.type) {
        case "mousedown":
          // console.log(`MOUSE DOWN AT ${this.mouseX}x${this.mouseY} on ${id}`);
          this.mouseDown = true;
          break;
        case "mouseup":
          // console.log(`MOUSE UP AT ${this.mouseX}x${this.mouseY} on ${id}`);
          this.mouseDown = false;
          break;
        case "mousemove":
  
        default:
          return;
      }
    };
  
    startDrag() {
      this.dragging = true;
    }
  
    endDrag() {
      this.dragging = false;
    }
  }