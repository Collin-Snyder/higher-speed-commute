import EntityComponentSystem, { Entity, ECS } from "@fritzy/ecs";
import { average } from "./modules/gameMath";
//@ts-ignore
import axios from "axios";
import spriteMap from "./spriteMap";
import keyCodes from "./keyCodes";
import MapGrid, {
  MapGridInterface,
  MapObjectInterface,
  Square,
  SquareInterface,
} from "./state/map";
import Components from "./components/index";
import { MapSystem } from "./systems/map";
import { LightTimer } from "./systems/lights";
import { InputSystem } from "./systems/input";
import { MovementSystem } from "./systems/move";
import { CollisionSystem } from "./systems/collision";
import { CaffeineSystem } from "./systems/caffeine";
import { RenderTileMap, RenderEntities } from "./systems/render";

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
  private tickTimes: number[];
  public inputs: InputEventsInterface;
  public width: number;
  public height: number;
  public spritesheet: HTMLImageElement;
  public spriteMap: { [entity: string]: { X: number; Y: number } };
  public spriteSheetIsLoaded: boolean;
  public paused: boolean;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  public ecs: ECS;
  private global: Entity;
  private mapEntity: Entity;
  private playerEntity: Entity;
  private bossEntity: Entity;
  private lightEntities: { [key: string]: Entity };
  private coffeeEntities: { [key: string]: Entity };
  private map: MapGridInterface;

  constructor() {
    this.start = this.timestamp();
    this.lastTick = this.start;
    this.totalElapsedTime = 0;
    this.frameElapsedTime = 0;
    this.tickTimes = [];
    this.width = 1000;
    this.height = 625;
    this.inputs = new InputEvents();
    this.canvas = <HTMLCanvasElement>document.getElementById("game");
    this.ctx = <CanvasRenderingContext2D>this.canvas.getContext("2d");
    this.map = new MapGrid(40, 25);
    this.spritesheet = new Image();
    this.spriteSheetIsLoaded = false;
    this.paused = true;

    this.spritesheet.src = "../spritesheet.png";
    this.spriteMap = spriteMap;

    this.ecs = new EntityComponentSystem.ECS();

    this.registerComponents();

    this.global = this.ecs.createEntity({
      id: "global",
      Global: {
        game: this,
        inputs: new InputEvents(),
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
      Velocity: {},
      Renderable: {},
      Collision: {},
    });

    this.bossEntity = this.ecs.createEntity({
      id: "boss",
      Coordinates: {},
      Car: {
        color: "red",
      },
      Velocity: {},
      Path: {
        driver: "boss",
      },
      Renderable: {},
      Collision: {},
    });

    this.lightEntities = {};
    this.coffeeEntities = {};

    this.global.Global.map = this.mapEntity;
    this.global.Global.player = this.playerEntity;

    this.spritesheet.onload = () => {
      this.spriteSheetIsLoaded = true;
      this.global.Global.spriteSheet = this.spritesheet;
      this.global.Global.spriteMap = this.spriteMap;

      let playerSpriteCoords = this.spriteMap[
        `${this.playerEntity.Car.color}Car`
      ];
      this.playerEntity.Renderable.spriteX = playerSpriteCoords.X;
      this.playerEntity.Renderable.spriteY = playerSpriteCoords.Y;

      let bossSpriteCoords = this.spriteMap[`${this.bossEntity.Car.color}Car`];
      this.bossEntity.Renderable.spriteX = bossSpriteCoords.X;
      this.bossEntity.Renderable.spriteY = bossSpriteCoords.Y;
    };

    this.ecs.addSystem("lights", new LightTimer(this.ecs, this.step));
    this.ecs.addSystem("caffeine", new CaffeineSystem(this.ecs, this.step));
    this.ecs.addSystem("input", new InputSystem(this.ecs));
    this.ecs.addSystem("move", new MovementSystem(this.ecs));
    this.ecs.addSystem("collision", new CollisionSystem(this.ecs));
    this.ecs.addSystem("render", new RenderTileMap(this.ecs, this.ctx));
    this.ecs.addSystem("render", new RenderEntities(this.ecs, this.ctx));
    this.ecs.addSystem("map", new MapSystem(this.ecs));
    this.loadMap = this.loadMap.bind(this);
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

  loadMap(id: number): void {
    axios
      .get(`/${id}`)
      //@ts-ignore
      .then((data) => {
        let mapInfo = data.data;
        this.mapEntity.Map.map = MapGrid.fromMapObject(mapInfo);
        this.ecs.runSystemGroup("map");
      })
      //@ts-ignore
      .catch((err) => {
        console.error(err);
      });
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
    // let newNow = window.performance.now();
    // this.tickTimes.push(newNow - now);
    // console.log(`The new tick average time is ${average(this.tickTimes)}ms`);
    requestAnimationFrame(this.tick.bind(this));
  }

  update(step: number) {
    this.ecs.runSystemGroup("input");
    if (!this.global.Global.paused) {
      this.ecs.runSystemGroup("lights");
      this.ecs.runSystemGroup("caffeine");
      this.ecs.runSystemGroup("move");
      this.ecs.runSystemGroup("collision");
    }

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
    document.addEventListener("keypress", (e) => this.handleKeypress(e));
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
game.loadMap(17);

requestAnimationFrame(game.tick.bind(game));

export default Game;
