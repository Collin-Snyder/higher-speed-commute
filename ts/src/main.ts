import EntityComponentSystem, { Entity, ECS } from "@fritzy/ecs";
import {
  getCenterPoint,
  scaleVector,
  VectorInterface,
  findRotatedVertex,
  centerWithin,
} from "./modules/gameMath";
import * as breakpoints from "./modules/breakpoints";
//@ts-ignore
import axios from "axios";
import spriteMap from "./spriteMap";
import bgMap from "./bgMap";
import modalButtonMap from "./modalButtonMap";
import keyCodes from "./keyCodes";
import DesignModule from "./modules/designModule";
import LogTimers from "./modules/logger";
import { ArcadeMap, IArcadeMap } from "./state/map";
import GameModeMachine, { Mode } from "./state/pubsub";
import Race from "./modules/raceData";
// import { MenuButtons } from "./state/menuButtons";
import makeButtonEntities from "./state/buttonFactory";
import Components from "./components/index";
import Tags from "./tags/tags";
import { BreakpointSystem } from "./systems/breakpoints";
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

import RenderGroup from "./systems/render";
import {
  loadArcadeLevel,
  loadCustomLevel,
  createUser,
  getLastCompletedLevel,
} from "./state/localDb";

//@ts-ignore
Number.prototype.times = function(cb: (currentNum: number) => any, index: number) {
  //@ts-ignore
  let num = parseInt(this);
  if (index !== 0 && index !== 1) index = 0;
  for (let i = 0; i < num; i++) {
    cb(index ? i + 1 : i);
  }
};

declare global {
  interface Window {
    toggleModal: Function;
    game: Game;
    showAll: Function;
    deleteUserMap: Function;
    makeSeedData: Function;
    recreateLocalDb: Function;
    updateLevelName: Function;
    updateLevelDescription: Function;
  }
}

// window.makeSeedData = function() {
//   axios
//     .post("/generate_seed_data")
//     .then((result) => console.log(result))
//     .catch((err) => console.error(err));
// };

interface InputEventsInterface {
  mouseX: number;
  mouseY: number;
  mouseDown: boolean;
  keyPressMap: { [keyCode: number]: boolean };
}

export type TBreakpoint = "small" | "regular";

export class Game {
  // GAME TIME //
  public start: number;
  public lastTick: number;
  public totalElapsedTime: number;
  public frameElapsedTime: number;
  public step: number = 1000 / 60; //17; //1/60s
  private tickTimes: number[];

  // MODE //
  public mode: Mode;
  public playMode: "arcade" | "custom" | "testing" | "";
  public modeMachine: GameModeMachine;

  // EVENTS //
  public inputs: InputEvents;
  public subscribers: { [key: string]: Function[] };

  // GRAPHICS //
  private UICanvas: HTMLCanvasElement;
  public uictx: CanvasRenderingContext2D;
  private OSMapCanvas: HTMLCanvasElement;
  private osmctx: CanvasRenderingContext2D;
  private OSEntCanvas: HTMLCanvasElement;
  private osectx: CanvasRenderingContext2D;
  public spritesheet: HTMLImageElement;
  public background: HTMLImageElement;
  public spriteMap: { [entity: string]: { x: number; y: number; w: number; h: number; } };
  public spriteSheetIsLoaded: boolean;
  public backgroundIsLoaded: boolean;
  public breakpoint: TBreakpoint;

  // ECS //
  public ecs: ECS;
  public globalEntity: Entity;
  private playerEntity: Entity;
  private bossEntity: Entity;

  // LEVELS //
  public firstLevel: number;
  public arcadeLevels: number;

  // USER //
  public lastCompletedLevel: number;

  // GAMEPLAY //
  public currentLevel: {
    id: number | null;
    number: number | null;
    name: string;
    description: string;
    nextLevelId?: number | null;
  };
  private map: IArcadeMap;
  public difficulty: "easy" | "medium" | "hard" | null;
  public focusView: "player" | "boss";
  public mapView: boolean;
  public defaultGameZoom: number;
  public zoomFactor: number;
  public currentZoom: number;
  public currentRace: Race | null;
  public recordRaceData: boolean;

  // DESIGN //
  public designModule: DesignModule;

  // DEV HELPERS //
  public logTimers: LogTimers;
  public autopilot: boolean;
  public windowWidth: number;
  public windowHeight: number;

  constructor() {
    this.start = this.timestamp();
    this.lastTick = this.start;
    this.totalElapsedTime = 0;
    this.frameElapsedTime = 0;
    this.tickTimes = [];
    this.mode = "init";
    this.playMode = "";
    this.modeMachine = new GameModeMachine("init");
    this.ecs = new EntityComponentSystem.ECS();
    this.firstLevel = 1;
    this.arcadeLevels = 9;
    this.currentLevel = {
      id: null,
      number: null,
      name: "",
      nextLevelId: null,
      description: "",
    };
    this.currentRace = null;
    this.recordRaceData = false;
    this.difficulty = null;
    this.focusView = "player";
    this.mapView = false;
    this.zoomFactor = 4;
    this.currentZoom = 1;
    this.defaultGameZoom = 4;
    this.lastCompletedLevel = 0;
    this.inputs = new InputEvents();
    // this.sounds = new Sounds(this);
    this.UICanvas = <HTMLCanvasElement>document.getElementById("ui");
    this.uictx = <CanvasRenderingContext2D>this.UICanvas.getContext("2d");
    this.OSMapCanvas = <HTMLCanvasElement>(
      document.getElementById("map-offscreen")
    );
    this.osmctx = <CanvasRenderingContext2D>this.OSMapCanvas.getContext("2d");
    this.OSEntCanvas = <HTMLCanvasElement>(
      document.getElementById("ents-offscreen")
    );
    this.osectx = <CanvasRenderingContext2D>this.OSEntCanvas.getContext("2d");
    this.subscribers = {};
    this.logTimers = new LogTimers(this);
    this.map = new ArcadeMap(40, 25);
    this.designModule = new DesignModule(this);
    this.spritesheet = new Image();
    this.background = new Image();
    this.spriteSheetIsLoaded = false;
    this.backgroundIsLoaded = false;
    this.spriteMap = spriteMap;
    this.autopilot = false;
    this.windowWidth = window.innerWidth;
    this.windowHeight = window.innerHeight;
    this.breakpoint = "regular";

    this.background.src = "../bgsheet-sm.png";
    this.spritesheet.src = "../spritesheet.png";
    // this.uictx.canvas.width = window.innerWidth;
    // this.uictx.canvas.height = window.innerHeight;
    // this.uictx.imageSmoothingEnabled = false;

    this.registerComponents();
    this.registerTags();
    this.registerSubscribers();
    this.updateCanvasSize();

    this.globalEntity = this.ecs.createEntity({
      id: "global",
      Global: {
        game: this,
        inputs: new InputEvents(),
      },
    });

    this.ecs.createEntity({
      id: "map",
      MapData: {},
      TileData: {},
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
        w: 1000 / this.currentZoom,
        h: 625 / this.currentZoom,
      },
      Breakpoint: [
        {
          name: "small",
          width: breakpoints.small.mapWidth,
          height: breakpoints.small.mapHeight,
          tileSize: breakpoints.small.tileSize,
          scale: breakpoints.small.scale,
        },
        {
          name: "regular",
          width: breakpoints.regular.mapWidth,
          height: breakpoints.regular.mapHeight,
          tileSize: breakpoints.regular.tileSize,
          scale: breakpoints.regular.scale,
        },
      ],
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

    let getCurrentHb = function(degrees?: number) {
      //@ts-ignore
      let entity = <Entity>(<unknown>this);
      let { hb, cp } = entity.Collision;
      let c = entity.Coordinates;

      hb = hb.map((v: VectorInterface) => ({
        X: v.X + c.X,
        Y: v.Y + c.Y,
      }));

      let cpx = cp.X + c.X;
      let cpy = cp.Y + c.Y;

      let deg = degrees ?? entity.Renderable.degrees;
      if (deg === 0) return hb;

      return hb.map(({ X, Y }: VectorInterface) =>
        findRotatedVertex(X, Y, cpx, cpy, deg)
      );
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
        ...(this.map.getSquare(this.map.playerHome)
          ? this.map.getSquare(this.map.playerHome).coordinates
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
      Breakpoint: [
        { name: "small", scale: breakpoints.small.scale },
        { name: "regular", scale: breakpoints.regular.scale },
      ],
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
      Breakpoint: [
        { name: "small", scale: breakpoints.small.scale },
        { name: "regular", scale: breakpoints.regular.scale },
      ],
    });

    createUser()
      .then((user) => {
        let { color, lastCompletedLevel } = user;
        this.lastCompletedLevel = lastCompletedLevel;
        this.ecs.getEntity("player").Car.color = color;
      })
      .catch((err) => console.error(err));

    this.playerEntity.Collision.currentHb = getCurrentHb.bind(
      this.playerEntity
    );
    this.playerEntity.Collision.currentCp = getCurrentCp.bind(
      this.playerEntity
    );
    this.bossEntity.Collision.currentHb = getCurrentHb.bind(this.bossEntity);
    this.bossEntity.Collision.currentCp = getCurrentCp.bind(this.bossEntity);

    this.globalEntity.Global.player = this.playerEntity;

    this.ecs.addSystem("render", new BreakpointSystem(this.ecs));

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
    this.ecs.addSystem(
      "animations",
      new LevelStartAnimation(this.ecs, this.step, this.uictx)
    );
    this.ecs.addSystem("animations", new Animation(this.ecs));

    // this.enableAutopilot();
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
      let onbefore = this.modeMachine.defaultActions[`onbefore${event.name}`];
      let on = this.modeMachine.defaultActions[`on${event.name}`];
      let onNewState = this.modeMachine.defaultActions[`on${event.to}`];
      this.subscribe(event.name, () => {
        console.log(`Attempting event "${event.name}"`);
      });
      this.subscribe(event.name, validate.bind(this, event.name, event.from));
      this.subscribe(event.name, () => {
        let onleave = this.modeMachine.defaultActions[`onleave${this.mode}`];
        if (onleave) onleave.call(this);
      });
      if (onbefore) {
        this.subscribe(event.name, onbefore.bind(this));
      }
      if (on) {
        this.subscribe(event.name, on.bind(this));
      }
      this.subscribe(event.name, () => {
        this.mode = event.to;
      });
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

  buildWorld(): void {
    let {
      RenderBackground,
      RenderOffscreenMap,
      RenderGameplayEntities,
      RenderSandboxMap,
      RenderViewBox,
      RenderMenus,
      RenderButtonModifiers,
      RenderTopLevelGraphics,
      RenderBorders,
    } = RenderGroup;
    this.globalEntity.Global.bgSheet = this.background;
    this.globalEntity.Global.bgMap = bgMap;

    ///// create modal button classes /////
    let styleEl = document.createElement("style");
    let styleHTML = "";

    for (let name in modalButtonMap) {
      let b = modalButtonMap[name];
      styleHTML += `.${name}::after {background-position: -${b.x}px -${b.y}px;}\n`;
    }

    styleEl.innerHTML = styleHTML;
    document.head.appendChild(styleEl);


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

    // this.globalEntity.Global.spriteSheet = this.spritesheet;
    // this.globalEntity.Global.spriteMap = this.spriteMap;

    let playerSpriteCoords = this.spriteMap[
      `${this.playerEntity.Car.color}Car`
    ];
    this.playerEntity.Renderable.spriteX = playerSpriteCoords.x;
    this.playerEntity.Renderable.spriteY = playerSpriteCoords.y;

    let bossSpriteCoords = this.spriteMap[`${this.bossEntity.Car.color}Car`];
    this.bossEntity.Renderable.spriteX = bossSpriteCoords.x;
    this.bossEntity.Renderable.spriteY = bossSpriteCoords.y;

    makeButtonEntities(this);
    // MenuButtons.createEntities(this);

    this.ecs.addSystem("render", new RenderBorders(this.ecs, this.uictx));
    this.ecs.addSystem("render", new RenderOffscreenMap(this.ecs, this.osmctx));
    this.ecs.addSystem(
      "render",
      new RenderGameplayEntities(this.ecs, this.osectx, this.OSEntCanvas)
    );
    this.ecs.addSystem("render", new RenderSandboxMap(this.ecs, this.uictx));
    this.ecs.addSystem(
      "render",
      new RenderViewBox(this.ecs, this.uictx, this.step)
    );
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

  async loadLevel(
    level: number /*can be either level number if arcade mode or level id if custom mode*/
  ) {
    try {
      let loadFunc = loadArcadeLevel;
      if (this.playMode === "custom") loadFunc = loadCustomLevel;

      let result = await loadFunc(level);

      if (result === "end of game") {
        this.publish("endOfGame");
        return;
      }
      let { id, name, levelNumber, description, mapInfo } = <any>result;
      this.currentLevel = {
        id,
        name,
        number: levelNumber,
        description,
      };
      let { MapData } = this.ecs.getEntity("map");

      mapInfo.id = id;
      mapInfo.name = name;
      MapData.map = ArcadeMap.fromMapObject(mapInfo);
      this.publish("chooseDifficulty");
    } catch (err) {
      console.error(err);
    }
  }

  testCurrentSandboxMap() {
    let { MapData } = this.ecs.getEntity("map");
    //??? - Just replacing the map with a new copy of itself
    let mapInfo = MapData.map.exportMapObject();
    MapData.map = ArcadeMap.fromMapObject(mapInfo);
    this.publish("chooseDifficulty");
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
    if (this.backgroundIsLoaded && this.spriteSheetIsLoaded) {
      if (this.uictx.canvas.width != window.innerWidth) this.updateCanvasSize();
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
    let {
      MapData: {
        map: { id },
      },
    } = this.ecs.getEntity("map");
    let { color } = this.ecs.getEntity("player").Car;

    this.currentRace = new Race(id, this.difficulty, color, this.step);
  }

  endRace() {
    this.currentRace = null;
  }

  resetLastCompletedLevel() {
    getLastCompletedLevel()
      .then((l) => (this.lastCompletedLevel = Number(l)))
      .catch((err) => console.error(err));
  }

  saveRaceData(outcome: "won" | "lost" | "crash") {
    if (!this.currentRace) return;
    let raceData = this.currentRace.exportForSave(outcome);
    // axios
    //   .post("/races", raceData)
    //   .then((data: any) => {
    //     let { id } = data.data;
    //     console.log(`Saved race data under id ${id}`);
    //     this.endRace();
    //   })
    //   .catch((err: any) => console.error(err));
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

  setDifficulty(d: "easy" | "medium" | "hard") {
    this.difficulty = d;
    let bossEntity = this.ecs.getEntity("boss");
    let speedConstants = {
      easy: 1,
      medium: 1.5,
      hard: 2,
    };
    bossEntity.Velocity.speedConstant = speedConstants[d];
  }

  updateCanvasSize() {
    let newW = Math.ceil(window.innerWidth);
    let newH = Math.ceil(window.innerHeight);
    let size: "small" | "regular" = newW < 1440 ? "small" : "regular";

    this.uictx.canvas.style.width = `${newW}px`;
    this.uictx.canvas.style.height = `${newH}px`;
    this.uictx.canvas.width = newW;
    this.uictx.canvas.height = newH;
    this.uictx.imageSmoothingEnabled = false;
    this.breakpoint = size;
  }

  enableAutopilot() {
    if (this.autopilot) return true;
    let p = this.ecs.getEntity("player");
    if (!p.has("Path")) p.addComponent("Path", { driver: "player" });
    let {
      MapData: { map },
    } = this.ecs.getEntity("map");
    if (map && !p.Path.length) {
      let currentSquareCoords = map.getSquareByCoords(
        p.Coordinates.X,
        p.Coordinates.Y
      ).coordinates;
      let officeCoords = map.getKeySquare("office").coordinates;
      p.Path.path = map.findPath(
        currentSquareCoords.X,
        currentSquareCoords.Y,
        officeCoords.X,
        officeCoords.Y
      );
    }
    this.autopilot = true;
    return this.autopilot;
  }

  disableAutopilot() {
    let p = this.ecs.getEntity("player");
    if (p.has("Path")) p.removeComponentByType("Path");
    this.autopilot = false;
    return this.autopilot;
  }
}

export class InputEvents {
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
