import EntityComponentSystem, { Entity, ECS } from "@fritzy/ecs";
import { average, findCenteredElementSpread } from "./modules/gameMath";
//@ts-ignore
import axios from "axios";
import spriteMap from "./spriteMap";
import keyCodes from "./keyCodes";
import DesignModule from "./modules/designModule";
import { MapGrid, MapGridInterface } from "./state/map";
import GameModeMachine from "./state/pubsub";
import { MenuButtons } from "./state/menuButtons";
import Components from "./components/index";
import Tags from "./tags/tags";
import { MapSystem } from "./systems/map";
import { LightTimer } from "./systems/lights";
import { InputSystem } from "./systems/input";
import { MovementSystem } from "./systems/move";
import { CollisionSystem } from "./systems/collision";
import { CaffeineSystem } from "./systems/caffeine";
import { RenderTileMap, RenderEntities, RenderMenu, RenderButtonModifiers } from "./systems/render";

interface InputEventsInterface {
  mouseX: number;
  mouseY: number;
  mouseDown: boolean;
  keyPressMap: { [keyCode: number]: boolean };
}

export class Game {
  public start: number;
  public lastTick: number;
  public totalElapsedTime: number;
  public frameElapsedTime: number;
  private step: number = 17; //1/60s
  private tickTimes: number[];
  public inputs: InputEvents;
  public menuButtons: any;
  public width: number;
  public height: number;
  public modeMachine: GameModeMachine;
  public subscribers: { [key: string]: Function[] };
  public spritesheet: HTMLImageElement;
  public spriteMap: { [entity: string]: { X: number; Y: number } };
  public spriteSheetIsLoaded: boolean;
  // private gameCanvas: HTMLCanvasElement;
  private UICanvas: HTMLCanvasElement;
  // private gamectx: CanvasRenderingContext2D;
  private uictx: CanvasRenderingContext2D;
  public ecs: ECS;
  public globalEntity: Entity;
  private mapEntity: Entity;
  public designModule: DesignModule;
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
    this.modeMachine = new GameModeMachine("init");
    this.ecs = new EntityComponentSystem.ECS();
    this.width = 1000;
    this.height = 625;
    this.inputs = new InputEvents();
    // this.gameCanvas = <HTMLCanvasElement>document.getElementById("game");
    // this.gamectx = <CanvasRenderingContext2D>this.gameCanvas.getContext("2d");
    this.UICanvas = <HTMLCanvasElement>document.getElementById("ui");
    this.uictx = <CanvasRenderingContext2D>this.UICanvas.getContext("2d");
    this.subscribers = {};
    this.map = new MapGrid(40, 25);
    this.designModule = new DesignModule(this);
    this.menuButtons = new MenuButtons(this).buttons;
    this.spritesheet = new Image();
    this.spriteSheetIsLoaded = false;
    this.spriteMap = spriteMap;

    this.spritesheet.src = "../spritesheet.png";
    this.UICanvas.width = window.innerWidth;
    this.UICanvas.height = window.innerHeight;
    this.uictx.imageSmoothingEnabled = false;

    this.registerComponents();
    this.registerTags();
    this.registerDefaultSubscribers();

    this.globalEntity = this.ecs.createEntity({
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
      Coordinates: {},
    });

    this.mapEntity.Coordinates.X = findCenteredElementSpread(
      window.innerWidth,
      this.map.pixelWidth,
      1,
      "spaceEvenly"
    ).start;
    this.mapEntity.Coordinates.Y = findCenteredElementSpread(
      window.innerHeight,
      this.map.pixelHeight,
      1,
      "spaceEvenly"
    ).start;

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
      Velocity: {
        speedConstant: 2,
      },
      Path: {
        driver: "boss",
      },
      Renderable: {},
      Collision: {},
    });

    this.lightEntities = {};
    this.coffeeEntities = {};

    this.globalEntity.Global.map = this.mapEntity;
    this.globalEntity.Global.player = this.playerEntity;

    this.spritesheet.onload = () => {
      this.spriteSheetIsLoaded = true;
      this.globalEntity.Global.spriteSheet = this.spritesheet;
      this.globalEntity.Global.spriteMap = this.spriteMap;

      let playerSpriteCoords = this.spriteMap[
        `${this.playerEntity.Car.color}Car`
      ];
      this.playerEntity.Renderable.spriteX = playerSpriteCoords.X;
      this.playerEntity.Renderable.spriteY = playerSpriteCoords.Y;

      let bossSpriteCoords = this.spriteMap[`${this.bossEntity.Car.color}Car`];
      this.bossEntity.Renderable.spriteX = bossSpriteCoords.X;
      this.bossEntity.Renderable.spriteY = bossSpriteCoords.Y;

      this.publish("ready");
    };

    this.ecs.addSystem("lights", new LightTimer(this.ecs, this.step));
    this.ecs.addSystem("caffeine", new CaffeineSystem(this.ecs, this.step));
    this.ecs.addSystem("input", new InputSystem(this.ecs));
    this.ecs.addSystem("move", new MovementSystem(this.ecs));
    this.ecs.addSystem("collision", new CollisionSystem(this.ecs));
    this.ecs.addSystem("render", new RenderMenu(this.ecs, this.uictx));
    this.ecs.addSystem("render", new RenderTileMap(this.ecs, this.uictx));
    this.ecs.addSystem("render", new RenderEntities(this.ecs, this.uictx));
    this.ecs.addSystem("render", new RenderButtonModifiers(this.ecs, this.uictx));
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

  registerTags(): void {
    console.log("Loading tags...");

    this.ecs.registerTags(Tags);
  }

  registerDefaultSubscribers(): void {
    console.log("Subscribing events...");
    for (let event of this.modeMachine.events) {
      if (event.name === "ready") {
        this.subscribe(
          event.name,
          this.modeMachine.defaultActions[`on${event.name}`].bind(
            this,
            event.from,
            event.to
          )
        );
      } else {
        let onbefore = this.modeMachine.defaultActions[`onbefore${event.name}`];
        let on = this.modeMachine.defaultActions[`on${event.name}`];
        if (onbefore) {
          this.subscribe(event.name, onbefore.bind(this, event.from, event.to));
        }
        if (on) {
          this.subscribe(event.name, on.bind(this, event.from, event.to));
        }
      }
      let onNewState = this.modeMachine.defaultActions[`on${event.to}`];
      if (onNewState) {
        this.subscribe(event.name, onNewState.bind(this));
      }
    }

    for (let action in this.modeMachine.customActions) {
      this.modeMachine.customActions[action] = this.modeMachine.customActions[
        action
      ].bind(this);
    }

    for (let event of this.modeMachine.customEvents) {
      this.subscribe(event.name, event.action);
    }
  }

  loadMap(id: number): void {
    axios
      .get(`/map/${id}`)
      //@ts-ignore
      .then((data) => {
        let mapInfo = data.data;
        this.mapEntity.Map.mapId = id;
        this.mapEntity.Map.map = MapGrid.fromMapObject(mapInfo);
        this.ecs.runSystemGroup("map");
        this.publish("play");
        this.publish("pause");
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
    // if (this.tickTimes.length % 60 === 0) console.log(`The new tick average time is ${average(this.tickTimes)}ms`);
    requestAnimationFrame(this.tick.bind(this));
  }

  update(step: number) {
    this.ecs.runSystemGroup("input");
    if (this.globalEntity.Global.mode === "playing") {
      this.ecs.runSystemGroup("lights");
      this.ecs.runSystemGroup("caffeine");
      this.ecs.runSystemGroup("move");
      this.ecs.runSystemGroup("collision");
    }

    this.ecs.tick();
  }

  render() {
    // let dpi = window.devicePixelRatio;
    // this.gameCanvas.height = this.gameCanvas.height * dpi;
    // this.gameCanvas.width = this.gameCanvas.width * dpi;
    // this.UICanvas.height = this.UICanvas.height * dpi;
    // this.UICanvas.width = this.UICanvas.width * dpi;
    // this.gamectx.fillStyle =
    //   this.globalEntity.Global.mode === "designing"
    //     ? "lightgray"
    //     : /*"#81c76d"*/ "#e6d093";
    this.uictx.fillStyle = "#50cdff";
    // this.gamectx.fillRect(0, 0, this.width, this.height);
    this.uictx.fillRect(0, 0, window.innerWidth, window.innerHeight);
    if (this.spriteSheetIsLoaded) {
      this.ecs.runSystemGroup("render");
    }
  }

  subscribe(event: any, callback: Function) {
    this.subscribers = this.subscribers || {};
    this.subscribers[event] = this.subscribers[event] || [];
    this.subscribers[event].push(callback);
  }

  publish(event: any) {
    if (this.subscribers && this.subscribers[event]) {
      const subs = this.subscribers[event];
      const args = [].slice.call(arguments, 1);
      for (let n = 0; n < subs.length; n++) {
        subs[n].apply(this, args);
      }
    }
  }
}

class InputEvents {
  // public gameCanvas: undefined | HTMLCanvasElement;
  public UICanvas: undefined | HTMLCanvasElement;
  public mouseX: number;
  public mouseY: number;
  public mouseDown: boolean;
  public dragging: boolean;
  public keyPressMap: { [keyCode: number]: boolean };

  constructor() {
    // this.gameCanvas;
    this.UICanvas;
    this.mouseX = 0;
    this.mouseY = 0;
    this.mouseDown = false;
    this.keyPressMap = {};
    this.dragging = false;

    for (let keyName in keyCodes) {
      this.keyPressMap[keyCodes[keyName]] = false;
    }

    // this.gameCanvas = <HTMLCanvasElement>document.getElementById("game");
    this.UICanvas = <HTMLCanvasElement>document.getElementById("ui");

    window.addEventListener("resize", (e) => this.handleWindowResize(e));
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
    // this.gameCanvas.addEventListener("mousedown", (e) =>
    //   this.handleDesignMouseEvent(e)
    // );
    // this.gameCanvas.addEventListener("mouseup", (e) =>
    //   this.handleDesignMouseEvent(e)
    // );
    // this.gameCanvas.addEventListener("mousemove", (e) =>
    //   this.handleDesignMouseEvent(e)
    // );
  }

  private handleWindowResize = (e: UIEvent) => {
    if (this.UICanvas) {
      this.UICanvas.width = window.innerWidth;
      this.UICanvas.height = window.innerHeight;
    }
  };

  private handleKeypress = (e: KeyboardEvent) => {
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

  private handleUIMouseEvent = (e: MouseEvent) => {
    this.mouseX = e.clientX;
    this.mouseY = e.clientY;
    //@ts-ignore
    let id = e.currentTarget.id;

    switch (e.type) {
      case "mousedown":
        console.log(`MOUSE DOWN AT ${this.mouseX}x${this.mouseY} on ${id}`);
        this.mouseDown = true;
        break;
      case "mouseup":
        console.log(`MOUSE UP AT ${this.mouseX}x${this.mouseY} on ${id}`);
        this.mouseDown = false;
        break;
      case "mousemove":

      default:
        return;
    }
  };
  startDrag() {
    console.log("DRAG START");
    this.dragging = true;
  }

  endDrag() {
    console.log("DRAG END");
    this.dragging = false;
  }
}

const game = new Game();
//@ts-ignore
window.game = game;

requestAnimationFrame(game.tick.bind(game));

export default Game;
