import EntityComponentSystem, { Entity, ECS } from "@fritzy/ecs";
import {
  average,
  findCenteredElementSpread,
  getCenterPoint,
  scaleVector,
  VectorInterface,
  findRotatedVertex,
} from "./modules/gameMath";
//@ts-ignore
import axios from "axios";
import spriteMap from "./spriteMap";
import bgMap from "./bgMap";
import keyCodes from "./keyCodes";
import DesignModule from "./modules/designModule";
import LogTimers from "./modules/logger";
import { MapGrid, MapGridInterface } from "./state/map";
import GameModeMachine, { Mode } from "./state/pubsub";
import Race from "./modules/raceData";
import Sounds from "./modules/sound";
import { MenuButtons } from "./state/menuButtons";
import allSounds from "./state/sounds";
import Components from "./components/index";
import Tags from "./tags/tags";
import { MapSystem } from "./systems/map";
import { LightTimer } from "./systems/lights";
import { InputSystem } from "./systems/input";
import { MovementSystem } from "./systems/move";
import { CollisionSystem } from "./systems/collision";
import { CaffeineSystem } from "./systems/caffeine";
import { RaceTimerSystem } from "./systems/timers";
import {
  LevelStartAnimation,
  BackgroundAnimation,
  Animation,
} from "./systems/animations";
import {
  RenderBackground,
  RenderMap,
  RenderGameplayEntities,
  RenderViewBox,
  RenderMenus,
  RenderButtonModifiers,
  RenderTopLevelGraphics,
  RenderBorders,
} from "./systems/render";
import { ViewBoxSystem } from "./systems/viewbox";

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
  public step: number = 1000 / 60; //17; //1/60s
  private tickTimes: number[];
  public inputs: InputEvents;
  // public width: number;
  // public height: number;
  public mode: Mode;
  public modeMachine: GameModeMachine;
  public subscribers: { [key: string]: Function[] };
  public spritesheet: HTMLImageElement;
  public background: HTMLImageElement;
  public spriteMap: { [entity: string]: { X: number; Y: number } };
  public spriteSheetIsLoaded: boolean;
  public backgroundIsLoaded: boolean;
  private UICanvas: HTMLCanvasElement;
  private uictx: CanvasRenderingContext2D;
  public ecs: ECS;
  public currentLevel: {
    id: number | null;
    number: number | null;
    name: string | null;
    nextLevelId: number | null;
  };
  public currentRace: Race | null;
  public recordRaceData: boolean;
  public globalEntity: Entity;
  private mapEntity: Entity;
  public designModule: DesignModule;
  private playerEntity: Entity;
  private bossEntity: Entity;
  private lightEntities: { [key: string]: Entity };
  private coffeeEntities: { [key: string]: Entity };
  private map: MapGridInterface;
  public difficulty: "easy" | "medium" | "hard" | null;
  public focusView: "player" | "boss";
  public mapView: boolean;
  public zoomFactor: number;
  public logTimers: LogTimers;
  // public sounds: Sounds;

  constructor() {
    this.start = this.timestamp();
    this.lastTick = this.start;
    this.totalElapsedTime = 0;
    this.frameElapsedTime = 0;
    this.tickTimes = [];
    this.mode = "init";
    this.modeMachine = new GameModeMachine("init");
    this.ecs = new EntityComponentSystem.ECS();
    this.currentLevel = {
      id: null,
      number: null,
      name: null,
      nextLevelId: null,
    };
    this.currentRace = null;
    this.recordRaceData = true;
    this.difficulty = null;
    this.focusView = "player";
    this.mapView = false;
    this.zoomFactor = 4;
    this.inputs = new InputEvents();
    // this.sounds = new Sounds(this);
    this.UICanvas = <HTMLCanvasElement>document.getElementById("ui");
    this.uictx = <CanvasRenderingContext2D>this.UICanvas.getContext("2d");
    this.subscribers = {};
    this.logTimers = new LogTimers(this);
    this.map = new MapGrid(40, 25);
    this.designModule = new DesignModule(this);
    this.spritesheet = new Image();
    this.background = new Image();
    this.spriteSheetIsLoaded = false;
    this.backgroundIsLoaded = false;
    this.spriteMap = spriteMap;

    this.background.src = "../bgsheet-sm.png";
    this.spritesheet.src = "../spritesheet.png";
    this.UICanvas.width = window.innerWidth;
    this.UICanvas.height = window.innerHeight;
    this.uictx.imageSmoothingEnabled = false;

    this.registerComponents();
    this.registerTags();
    this.registerSubscribers();
    // this.registerSounds();

    this.globalEntity = this.ecs.createEntity({
      id: "global",
      Global: {
        game: this,
        inputs: new InputEvents(),
      },
    });

    this.mapEntity = this.ecs.createEntity({
      id: "map",
      Map: {},
      TileMap: {},
      Coordinates: {},
      Renderable: {
        renderWidth: 1000,
        renderHeight: 625,
        visible: false,
      },
      Border: {
        weight: 20,
        radius: 20,
      },
      ViewBox: {
        w: 1000 / this.zoomFactor,
        h: 625 / this.zoomFactor,
      },
    });

    let hb = [];
    hb.push(scaleVector({ X: 6, Y: 2 }, 2 / 3));
    hb.push(scaleVector({ X: 19, Y: 2 }, 2 / 3));
    hb.push(scaleVector({ X: 19, Y: 23 }, 2 / 3));
    hb.push(scaleVector({ X: 6, Y: 23 }, 2 / 3));
    let cp = getCenterPoint(
      hb[0].X,
      hb[0].Y,
      hb[1].X - hb[0].X,
      hb[3].Y - hb[0].Y
    );

    let getCurrentHb = function() {
      //@ts-ignore
      let entity = <Entity>(<unknown>this);
      let { hb, cp } = entity.Collision;
      let c = entity.Coordinates;

      hb = hb.map((v: VectorInterface) => ({ X: v.X + c.X, Y: v.Y + c.Y }));
      let cpx = cp.X + c.X;
      let cpy = cp.Y + c.Y;

      let deg = entity.Renderable.degrees;
      if (deg === 0) return hb;
      // entity.Renderable.degrees = degrees;
      //@ts-ignore
      return hb.map(({ X, Y }) => findRotatedVertex(X, Y, cpx, cpy, deg));
    };

    let getCurrentCp = function() {
      //@ts-ignore
      let entity = <Entity>(<unknown>this);
      let { hb, cp } = entity.Collision;
      let c = entity.Coordinates;
      let cpx = cp.X + c.X;
      let cpy = cp.Y + c.Y;
      return { X: cpx, Y: cpy };
    };

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
      Renderable: {
        renderWidth: 25 * (2 / 3),
        renderHeight: 25 * (2 / 3),
      },
      Collision: { hb, cp },
    });

    this.bossEntity = this.ecs.createEntity({
      id: "boss",
      Coordinates: {},
      Car: {
        color: "red",
      },
      Velocity: {
        speedConstant: 1,
      },
      Path: {
        driver: "boss",
      },
      Renderable: {
        renderWidth: 25 * (2 / 3),
        renderHeight: 25 * (2 / 3),
      },
      Collision: { hb, cp },
    });

    this.playerEntity.Collision.currentHb = getCurrentHb.bind(
      this.playerEntity
    );
    this.playerEntity.Collision.currentCp = getCurrentCp.bind(
      this.playerEntity
    );
    this.bossEntity.Collision.currentHb = getCurrentHb.bind(this.bossEntity);
    this.bossEntity.Collision.currentCp = getCurrentCp.bind(this.bossEntity);

    this.lightEntities = {};
    this.coffeeEntities = {};

    this.globalEntity.Global.map = this.mapEntity;
    this.globalEntity.Global.player = this.playerEntity;

    this.background.onload = () => {
      this.backgroundIsLoaded = true;
      if (this.spriteSheetIsLoaded) this.buildWorld();
    };

    this.spritesheet.onload = () => {
      this.spriteSheetIsLoaded = true;
      if (this.backgroundIsLoaded) this.buildWorld();
    };
    this.ecs.addSystem("timers", new RaceTimerSystem(this.ecs, this.step));
    this.ecs.addSystem("lights", new LightTimer(this.ecs, this.step));
    this.ecs.addSystem("caffeine", new CaffeineSystem(this.ecs, this.step));
    this.ecs.addSystem("input", new InputSystem(this.ecs));
    this.ecs.addSystem("move", new MovementSystem(this.ecs));
    this.ecs.addSystem("collision", new CollisionSystem(this.ecs));
    this.ecs.addSystem("map", new MapSystem(this.ecs));
    // this.ecs.addSystem("viewbox", new ViewBoxSystem(this.ecs));
    this.ecs.addSystem(
      "animations",
      new LevelStartAnimation(this.ecs, this.step, this.uictx)
    );
    this.ecs.addSystem("animations", new Animation(this.ecs));

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

  registerSubscribers(): void {
    console.log("Subscribing events...");
    let validate = this.modeMachine.defaultActions.validate;
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
        this.subscribe(event.name, validate.bind(this, event.name, event.from));
        if (onbefore) {
          this.subscribe(event.name, onbefore.bind(this));
        }
        if (on) {
          this.subscribe(event.name, on.bind(this));
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

  // registerSounds(): void {
  //   allSounds.forEach(({ name, src, loop, startMusic }) => {
  //     this.sounds.addSound(name, src, loop, startMusic);
  //   });
  // }

  buildWorld(): void {
    this.globalEntity.Global.bgSheet = this.background;
    this.globalEntity.Global.bgMap = bgMap;
    this.ecs.createEntity({
      id: "bg",
      ParallaxLayer: [
        {
          name: "back",
          X: 0,
          Y: 162,
          height: 130,
          width: 480,
          step: 0.1,
          offset: 0,
        },
        {
          name: "mid",
          X: 0,
          Y: 78,
          height: 84,
          width: 480,
          step: 0.2,
          offset: 0,
        },
        {
          name: "fg",
          X: 0,
          Y: 0,
          height: 78,
          width: 480,
          step: 0.3,
          offset: 0,
        },
      ],
    });
    this.ecs.addSystem("animations", new BackgroundAnimation(this.ecs));
    this.ecs.addSystem("render", new RenderBackground(this.ecs, this.uictx));

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

    MenuButtons.createEntities(this);

    this.ecs.addSystem("render", new RenderBorders(this.ecs, this.uictx));
    this.ecs.addSystem("render", new RenderMap(this.ecs, this.uictx));
    this.ecs.addSystem(
      "render",
      new RenderGameplayEntities(this.ecs, this.uictx)
    );
    this.ecs.addSystem("render", new RenderViewBox(this.ecs, this.uictx, this.step));
    this.ecs.addSystem("render", new RenderMenus(this.ecs, this.uictx));
    this.ecs.addSystem(
      "render",
      new RenderButtonModifiers(this.ecs, this.uictx)
    );
    this.ecs.addSystem(
      "render",
      new RenderTopLevelGraphics(this.ecs, this.uictx)
    );

    this.publish("ready");
  }

  loadLevel(num: number): void {
    axios
      .get(`/levels/${num}`)
      //@ts-ignore
      .then((data) => {
        if (data.data === "end of game") {
          this.publish("endOfGame");
          return;
        }

        let levelInfo = data.data;
        let { id, level_number, next_level_id, level_name } = levelInfo;
        this.currentLevel = {
          id,
          number: level_number,
          name: level_name,
          nextLevelId: next_level_id,
        };
        let mapEntity = this.ecs.getEntity("map");
        let { map_info } = levelInfo;
        mapEntity.Map.mapId = levelInfo.id;
        mapEntity.Map.map = MapGrid.fromMapObject(map_info);
        this.ecs.runSystemGroup("map");
        this.publish("startingAnimation");
        // this.publish("play");
        // this.publish("pause");
      })
      //@ts-ignore
      .catch((err) => {
        console.error(err);
      });
  }

  loadMap(id: number): void {
    axios
      .get(`/maps/${id}`)
      //@ts-ignore
      .then((data) => {
        let mapInfo = data.data;
        let mapEntity = this.ecs.getEntity("map");
        mapEntity.Map.mapId = id;
        mapEntity.Map.map = MapGrid.fromMapObject(mapInfo);
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
    this.logTimers.update();
    this.ecs.runSystemGroup("input");
    if (this.mode === "playing") {
      this.ecs.runSystemGroup("lights");
      this.ecs.runSystemGroup("caffeine");
      this.ecs.runSystemGroup("move");
      this.ecs.runSystemGroup("collision");
      this.ecs.runSystemGroup("viewbox");
      this.ecs.runSystemGroup("timers");
    }

    this.ecs.tick();
  }

  render() {
    // if (this.backgroundIsLoaded)
    //   this.uictx.drawImage(
    //     this.background,
    //     0,
    //     0,
    //     window.innerWidth,
    //     window.innerHeight
    //   );
    // else {
    //   this.uictx.fillStyle = "#50cdff";
    //   // this.gamectx.fillRect(0, 0, this.width, this.height);
    //   this.uictx.fillRect(0, 0, window.innerWidth, window.innerHeight);
    // }
    if (this.backgroundIsLoaded && this.spriteSheetIsLoaded) {
      this.ecs.runSystemGroup("animations");
      this.ecs.runSystemGroup("render");
    }
  }

  subscribe(event: any, callback: Function) {
    this.subscribers = this.subscribers || {};
    this.subscribers[event] = this.subscribers[event] || [];
    this.subscribers[event].push(callback);
  }

  publish(event: any, ...args: any[]) {
    if (this.subscribers && this.subscribers[event]) {
      const subs = this.subscribers[event];
      let start = 0;

      if (/validate/.test(subs[start].name)) {
        let valid = subs[start].call(this);
        if (!valid) return;
        start = 1;
      }

      for (let n = start; n < subs.length; n++) {
        subs[n].apply(this, args);
      }
    }
  }

  startRace() {
    if (!this.recordRaceData) return;
    let mapEntity = this.ecs.getEntity("map");
    let { color } = this.ecs.getEntity("player").Car;

    this.currentRace = new Race(
      mapEntity.Map.mapId,
      this.difficulty,
      color,
      this.step
    );
  }

  endRace() {
    this.currentRace = null;
  }

  saveRaceData(outcome: "win" | "loss" | "crash") {
    if (!this.currentRace) return;
    let raceData = this.currentRace.exportForSave(outcome);
    axios
      .post("/races", raceData)
      .then((data: any) => {
        let { id } = data.data;
        console.log(`Saved race data under id ${id}`);
        this.endRace();
      })
      .catch((err: any) => console.error(err));
  }

  getPlayerHB() {
    let player = this.ecs.getEntity("player");
    let { hb, cp } = player.Collision;
    let c = player.Coordinates;

    hb = hb.map((v: VectorInterface) => ({ X: v.X + c.X, Y: v.Y + c.Y }));
    let cpx = cp.X + c.X;
    let cpy = cp.Y + c.Y;

    let deg = player.Renderable.degrees;
    if (deg === 0) return hb;
    // entity.Renderable.degrees = degrees;
    console.log("Degrees: ", deg);
    console.log("HB before rotation: ", hb);
    //@ts-ignore
    return hb.map(({ X, Y }) => findRotatedVertex(X, Y, cpx, cpy, deg));
  }
}

class InputEvents {
  public UICanvas: undefined | HTMLCanvasElement;
  public mouseX: number;
  public mouseY: number;
  public mouseDown: boolean;
  public dragging: boolean;
  public keyPressMap: { [keyCode: number]: boolean };

  constructor() {
    this.UICanvas;
    this.mouseX = 0;
    this.mouseY = 0;
    this.mouseDown = false;
    this.keyPressMap = {};
    this.dragging = false;

    for (let keyName in keyCodes) {
      this.keyPressMap[keyCodes[keyName]] = false;
    }

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

  setMouseUp() {
    console.log("MOUSE UP");
    this.mouseDown = false;
  }

  setMouseDown() {
    console.log("MOUSE DOWN");
    this.mouseDown = true;
  }
}

const game = new Game();
//@ts-ignore
window.game = game;

requestAnimationFrame(game.tick.bind(game));

export default Game;
