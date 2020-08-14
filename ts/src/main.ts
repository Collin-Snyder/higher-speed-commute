import ECS from "@fritzy/ecs";
//@ts-ignore
import testMapObject from "./scratch";
import spriteMap from "./spriteMap";
import keyCodes from "./keyCodes";
import MapGrid, {
  MapGridInterface,
  MapObjectInterface,
  Square,
} from "./state/map";
import Components from "./components/index";
import { LightTimer } from "./systems/lights";
import { InputSystem } from "./systems/input";
import { MovementSystem } from "./systems/move";
import { CollisionSystem } from "./systems/collision";
import { RenderTileMap, RenderCars, RenderLights } from "./systems/render";

interface InputEventsInterface {
  mouseX: number;
  mouseY: number;
  mouseDown: boolean;
  keyPressMap: { [keyCode: number]: boolean };
}

class Game {
  public start: number;
  public lastTick: number;
  public totalElapsedTime: number;
  public frameElapsedTime: number;
  private step: number = 17; //1/60s
  public inputs: InputEventsInterface;
  public width: number;
  public height: number;
  public spritesheet: HTMLImageElement;
  public spriteMap: { [entity: string]: { X: number; Y: number } };
  public spriteSheetIsLoaded: boolean;
  public paused: boolean;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private ecs: any;
  private global: any;
  private mapEntity: any;
  private playerEntity: any;
  private bossEntity: any;
  private lightEntities: { [key: string]: any };
  private map: MapGridInterface;

  constructor() {
    this.start = this.timestamp();
    this.lastTick = this.start;
    this.totalElapsedTime = 0;
    this.frameElapsedTime = 0;
    this.width = 1000;
    this.height = 625;
    this.inputs = new InputEvents();
    this.canvas = document.getElementsByTagName("canvas")[0];
    this.ctx = <CanvasRenderingContext2D>this.canvas.getContext("2d");
    this.map = MapGrid.fromMapObject(testMapObject);
    this.spritesheet = new Image();
    this.spriteSheetIsLoaded = false;
    this.paused = false;

    this.spritesheet.src = "../spritesheet.png";
    this.spriteMap = spriteMap;

    this.ecs = new ECS.ECS();

    this.registerComponents();

    this.global = this.ecs.createEntity({
      id: "global",
      Global: {
        game: this,
        inputs: new InputEvents()
      },
    });

    this.mapEntity = this.ecs.createEntity({
      id: "map",
      Map: {
        map: this.map,
      },
      TileMap: {
        tiles: this.map.generateTileMap(),
      },
    });

    this.playerEntity = this.ecs.createEntity({
      id: "player",
      Coordinates: {
        ...(this.map.get(this.map.playerHome)
          ? this.map.get(this.map.playerHome).coordinates()
          : { X: 0, Y: 0 }),
      },
      Car: {
        color: "blue",
      },
      Caffeination: {},
      Velocity: {},
      Renderable: {},
      Collision: {},
    });

    this.bossEntity = this.ecs.createEntity({
      id: "boss",
      Coordinates: {
        ...(this.map.get(this.map.bossHome)
          ? this.map.get(this.map.bossHome).coordinates()
          : { X: 0, Y: 0 }),
      },
      Car: {
        color: "red",
      },
      Caffeination: {},
      Velocity: {},
      Path: {
        driver: "boss",
      },
      Renderable: {},
      Collision: {},
    });

    this.lightEntities = {};

    for (let id in this.map.lights) {
      const square = this.map.get(id);
      this.lightEntities[id] = this.ecs.createEntity({
        id: `light${id}`,
        Coordinates: {
          ...(square ? square.coordinates() : { X: 0, Y: 0 }),
        },
        Timer: {
          interval: this.map.lights[id],
          timeSinceLastInterval: 0,
        },
        Color: {},
        Renderable: {},
        Collision: {
          movable: false,
        },
      });
    }

    this.global.Global.map = this.mapEntity;
    this.global.Global.player = this.playerEntity;

    this.spritesheet.onload = () => {
      this.spriteSheetIsLoaded = true;
      this.global.Global.spriteSheet = this.spritesheet;
      this.global.Global.spriteMap = this.spriteMap;
    };

    this.ecs.addSystem("lights", new LightTimer(this.ecs, this.step));
    this.ecs.addSystem("input", new InputSystem(this.ecs));
    this.ecs.addSystem("move", new MovementSystem(this.ecs));
    this.ecs.addSystem("collision", new CollisionSystem(this.ecs));
    this.ecs.addSystem("render", new RenderTileMap(this.ecs, this.ctx));
    this.ecs.addSystem("render", new RenderLights(this.ecs, this.ctx));
    this.ecs.addSystem("render", new RenderCars(this.ecs, this.ctx));
  }

  timestamp(): number {
    return window.performance && window.performance.now
      ? window.performance.now()
      : new Date().getTime();
  }

  registerComponents(): void {
    console.log("Loading components...");

    for (let name of Object.keys(Components)) {
      console.log(`Registering ${name}`);
      this.ecs.registerComponent(name, Components[name]);
    }
  }

  tick() {
    let now = this.timestamp();
    this.totalElapsedTime = now - this.start;
    this.frameElapsedTime += Math.min(1000, now - this.lastTick);

    while (this.frameElapsedTime > this.step) {
      this.frameElapsedTime -= this.step;
      this.update(this.step);
    }

    this.lastTick = now;

    this.render();

    requestAnimationFrame(this.tick.bind(this));
  }

  update(step: number) {
    // if (
    //   this.inputs.keyPressMap[keyCodes.LEFT] &&
    //   this.playerEntity.Velocity.vector.X >= 0
    // ) {
    //   this.playerEntity.Velocity.vector.X = -1;
    //   this.playerEntity.Velocity.vector.Y = 0;
    // } else if (
    //   this.inputs.keyPressMap[keyCodes.RIGHT] &&
    //   this.playerEntity.Velocity.vector.X <= 0
    // ) {
    //   this.playerEntity.Velocity.vector.X = 1;
    //   this.playerEntity.Velocity.vector.Y = 0;
    // } else if (
    //   this.inputs.keyPressMap[keyCodes.UP] &&
    //   this.playerEntity.Velocity.vector.Y >= 0
    // ) {
    //   this.playerEntity.Velocity.vector.X = 0;
    //   this.playerEntity.Velocity.vector.Y = -1;
    // } else if (
    //   this.inputs.keyPressMap[keyCodes.DOWN] &&
    //   this.playerEntity.Velocity.vector.Y <= 0
    // ) {
    //   this.playerEntity.Velocity.vector.X = 0;
    //   this.playerEntity.Velocity.vector.Y = 1;
    // }
    // this.playerEntity.Coordinates.X +=
    //   this.playerEntity.Velocity.vector.X *
    //   this.playerEntity.Velocity.speedConstant;
    // this.playerEntity.Coordinates.Y +=
    //   this.playerEntity.Velocity.vector.Y *
    //   this.playerEntity.Velocity.speedConstant;

    this.ecs.runSystemGroup("lights");
    this.ecs.runSystemGroup("input");
    this.ecs.runSystemGroup("move");
    this.ecs.runSystemGroup("collision");

    this.ecs.tick();
  }

  render() {
    this.ctx.fillStyle = "#81c76d";
    this.ctx.fillRect(0, 0, this.width, this.height);
    if (this.spriteSheetIsLoaded) {
      this.ecs.runSystemGroup("render");
    }
  }
}

class InputEvents {
  public mouseX: number;
  public mouseY: number;
  public mouseDown: boolean;
  public keyPressMap: { [keyCode: number]: boolean };

  constructor() {
    this.mouseX = 0;
    this.mouseY = 0;
    this.mouseDown = false;
    this.keyPressMap = {};

    for (let keyName in keyCodes) {
      this.keyPressMap[keyCodes[keyName]] = false;
    }

    const canvas = document.getElementsByTagName("canvas")[0];

    document.addEventListener("keydown", (e) => this.handleKeypress(e));
    document.addEventListener("keyup", (e) => this.handleKeypress(e));
    canvas.addEventListener("mousedown", (e) => this.handleMouseEvent(e));
    canvas.addEventListener("mouseup", (e) => this.handleMouseEvent(e));
    canvas.addEventListener("mousemove", (e) => this.handleMouseEvent(e));
  }

  handleKeypress = (e: KeyboardEvent) => {
    switch (e.type) {
      case "keydown":
        this.keyPressMap[e.keyCode] = true;
        break;
      case "keyup":
        this.keyPressMap[e.keyCode] = false;
        break;
      default:
        return;
    }
  };

  handleMouseEvent = (e: MouseEvent) => {
    this.mouseX = e.clientX;
    this.mouseY = e.clientY;

    switch (e.type) {
      case "mousedown":
        this.mouseDown = true;
        break;
      case "mouseup":
        this.mouseDown = false;
        break;
      default:
        return;
    }
  };
}

const game = new Game();

requestAnimationFrame(game.tick.bind(game));

export default Game;
