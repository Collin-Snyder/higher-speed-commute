import { ECS } from "@fritzy/ecs";
import {
  getCenterPoint,
  scaleVector,
  findRotatedVertex,
  getCurrentHb,
  getCurrentCp,
} from "gameMath";
import { forEachMapTile } from "gameHelpers";
import GameECS from "./ecsSetup/ecs";
import InputEventsService from "./services/inputEventsService";
import DesignService from "./services/designModeController";
import LogTimerService from "./services/loggerService";
import RaceDataService from "./services/raceDataService";
import ArcadeMap from "./dataStructures/arcadeMap";
import * as breakpoints from "./staticData/breakpointData";
import Components from "./ecsSetup/components";
import Tags from "./ecsSetup/tags";
import { BreakpointSystem } from "./systems/breakpoints";
import { MapSystem } from "./systems/map";
import { LightTimerSystem } from "./systems/lights";
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
  getOrCreateUser,
  getLastCompletedLevel,
  updateGraphicsSettings,
  getUserInfo,
} from "./localDb";
import SpriteMap from "./helperClasses/spriteMap";
import { cars, neighborhoods } from "./staticData/settingsOptions";
import { TooltipSystem } from "./systems/tooltips";
import { baseEvents, baseEventHandlers } from "./staticData/baseEvents";
import { nonBaseEvents } from "./staticData/nonBaseEvents";
import ButtonService from "./services/buttonService";
const { ceil, min, random } = Math;

Number.prototype.times = function(
  cb: (currentNum: number) => any,
  start: number
) {
  //@ts-ignore
  let num = parseInt(this);
  let curr = start || 0;
  for (let i = 0; i < num; i++) {
    cb(curr);
    curr++;
  }
};

Number.prototype.between = function(
  min: number,
  max: number,
  inclusive: boolean = true
) {
  let aboveMin = inclusive ? this >= min : this > min;
  let belowMax = inclusive ? this <= max : this < max;
  return aboveMin && belowMax;
};

Array.prototype.deepMap = function(
  cb: (currentElement: any, i: number, currentArray: Array<any>) => any
): Array<any> {
  let output = [];
  for (let i = 0; i < this.length; i++) {
    let el = this[i];
    if (Array.isArray(el)) {
      output.push(el.deepMap(cb));
    } else {
      output.push(cb(el, i, this));
    }
  }
  return output;
};

Array.prototype.deepEach = function(
  cb: (currentElement: any, i: number, currentArray: Array<any>) => any
): void {
  for (let i = 0; i < this.length; i++) {
    let el = this[i];
    if (Array.isArray(el)) {
      el.deepEach(cb);
    } else {
      cb(el, i, this);
    }
  }
};

// window.makeSeedData = function() {
//   axios
//     .post("/generate_seed_data")
//     .then((result) => console.log(result))
//     .catch((err) => console.error(err));
// };

export class Game {
  // GAME TIME //
  public start: number;
  public lastTick: number;
  public totalElapsedTime: number;
  public frameElapsedTime: number;
  public step: number = 1000 / 60; //17; //1/60s

  // MODE //
  public mode: TMode;
  private _playMode: TPlayMode;
  // public pubSub: PubSub;

  // EVENTS //
  public inputs: InputEventsService;
  public subscribers: { [key: string]: Function[] };

  // GRAPHICS //
  public UICanvas: HTMLCanvasElement;
  public uictx: CanvasRenderingContext2D;
  private OSMapCanvas: HTMLCanvasElement;
  private osmctx: CanvasRenderingContext2D;
  public OSMapBackgroundCanvas: HTMLCanvasElement;
  private osmbgctx: CanvasRenderingContext2D;
  private OSEntCanvas: HTMLCanvasElement;
  private osectx: CanvasRenderingContext2D;
  public spriteSheet: HTMLImageElement;
  public background: HTMLImageElement;
  public gameFont: FontFace;
  public spriteMap: SpriteMap;
  public spriteSheetIsLoaded: boolean;
  public backgroundIsLoaded: boolean;
  public fontIsLoaded: boolean;
  public breakpoint: TBreakpoint;

  // ECS //
  public ecs: ECS;

  // LEVELS //
  public firstLevel: number;
  public arcadeLevels: number;

  // USER //
  public lastCompletedLevel: number;
  public hasCompletedGame: boolean;
  public carColor: TCarColor;
  public terrainStyle: TTerrainStyle;

  // GAMEPLAY //
  public currentLevel: {
    id: number | null;
    number: number | null;
    name: string;
    description: string;
    nextLevelId?: number | null;
  };
  public difficulty: "easy" | "medium" | "hard" | "";
  public focusView: "player" | "boss";
  public mapView: boolean;
  public defaultGameZoom: number;
  public zoomFactor: number;
  public currentZoom: number;
  public raceData: RaceDataService | null;
  public recordRaceData: boolean;

  // DESIGN //
  public designModule: DesignService;

  // OTHER SERVICES //
  public buttonService: typeof ButtonService;

  // DEV HELPERS //
  public logTimers: LogTimerService;
  public autopilot: boolean;
  public windowWidth: number;
  public windowHeight: number;

  constructor() {
    // GAME LOOP
    this.start = this.timestamp();
    this.lastTick = this.start;
    this.totalElapsedTime = 0;
    this.frameElapsedTime = 0;

    // ECS
    this.ecs = GameECS;

    // STATIC GAME CHARACTERISTICS
    this.arcadeLevels = 9;
    this.firstLevel = 1;

    // GAME STATE
    this.mode = "init";
    this._playMode = "";
    this.currentLevel = {
      id: null,
      number: null,
      name: "",
      nextLevelId: null,
      description: "",
    };
    this.difficulty = "";
    this.focusView = "player";
    this.mapView = false;
    this.zoomFactor = 4;
    this.currentZoom = 1;
    this.recordRaceData = false;
    this.raceData = null;
    this.defaultGameZoom = 4;
    this.lastCompletedLevel = 0;
    this.hasCompletedGame = false;
    this.fontIsLoaded = false;
    this.carColor = "blue";
    this.terrainStyle = "default";
    this.breakpoint = "regularBreakpoint";
    this.backgroundIsLoaded = false;
    this.spriteSheetIsLoaded = false;
    this.fontIsLoaded = false;
    this.autopilot = false;

    // CANVASES
    this.UICanvas = <HTMLCanvasElement>document.getElementById("ui");
    this.uictx = <CanvasRenderingContext2D>this.UICanvas.getContext("2d");
    this.OSMapBackgroundCanvas = <HTMLCanvasElement>(
      document.createElement("canvas")
    );
    this.OSMapBackgroundCanvas.width = 1000;
    this.OSMapBackgroundCanvas.height = 625;
    this.osmbgctx = <CanvasRenderingContext2D>(
      this.OSMapBackgroundCanvas.getContext("2d")
    );
    this.OSMapCanvas = <HTMLCanvasElement>(
      document.getElementById("map-offscreen")
    );
    this.osmctx = <CanvasRenderingContext2D>this.OSMapCanvas.getContext("2d");
    this.OSEntCanvas = <HTMLCanvasElement>(
      document.getElementById("ents-offscreen")
    );
    this.osectx = <CanvasRenderingContext2D>this.OSEntCanvas.getContext("2d");
    this.uictx.textBaseline = "top";

    // IMAGES AND GRAPHICS
    this.spriteMap = new SpriteMap(this);
    this.spriteSheet = new Image();
    this.spriteSheet.src = "./spritesheet.png";
    this.spriteSheet.onload = () => {
      this.spriteSheetIsLoaded = true;
      if (this.backgroundIsLoaded && this.fontIsLoaded) this.buildWorld();
    };
    this.background = new Image();
    this.background.src = "./bgsheet-sm.png";
    this.background.onload = () => {
      this.backgroundIsLoaded = true;
      if (this.spriteSheetIsLoaded && this.fontIsLoaded) this.buildWorld();
    };
    this.gameFont = new FontFace(
      "8-bit-pusab-regular",
      "url('./8-bit-pusab.ttf')"
    );

    // SERVICES AND CONTROLLERS
    this.inputs = new InputEventsService();
    this.designModule = new DesignService(this);
    this.logTimers = new LogTimerService(this);
    this.buttonService = ButtonService;

    // EVENT SYSTEM
    this.subscribers = {};

    // ?
    this.windowWidth = window.innerWidth;
    this.windowHeight = window.innerHeight;

    // GAME SETUP
    this.registerComponents();
    this.registerTags();
    this.registerSubscribers();
    this.updateCanvasSize();
    this.loadGameFont();

    this.ecs.createEntity({
      id: "global",
      Global: {
        game: this,
        inputs: new InputEventsService(),
      },
    });

    this.createMapEntity();
    this.createDriverEntity("player");
    this.createDriverEntity("boss");

    getOrCreateUser()
      .then((user) => {
        let { color, terrain, lastCompletedLevel, hasCompletedGame } = user;
        this.lastCompletedLevel = lastCompletedLevel;
        this.hasCompletedGame = hasCompletedGame;
        this.setTerrainStyle(terrain);
        this.setCarColor(color);
      })
      .catch((err) => console.error(err));

    this.addBehaviorSystems();
  }

  get playMode() {
    return this._playMode;
  }

  set playMode(playMode: TPlayMode) {
    this._playMode = playMode;
  }

  timestamp(): number {
    return window.performance && window.performance.now
      ? window.performance.now()
      : new Date().getTime();
  }

  registerComponents(): void {
    console.info("Loading components...");

    for (let name of Object.keys(Components)) {
      console.info(`Registering ${name}`);
      this.ecs.registerComponent(name, Components[name]);
    }
  }

  registerTags(): void {
    console.info("Loading tags...");

    this.ecs.registerTags(Tags);
  }

  registerSubscribers(): void {
    console.info("Subscribing events...");
    let { validate } = baseEventHandlers;

    for (let event of baseEvents) {
      //this must be first
      this.subscribe(
        event.name,
        validate.bind(this, this, event.name, event.from)
      );

      let onBefore = baseEventHandlers[`onbefore${event.name}`];
      let on = baseEventHandlers[`on${event.name}`];
      let onNewState = baseEventHandlers[`on${event.to}`];

      this.subscribe(event.name, () => {
        let onLeave = baseEventHandlers[`onleave${this.mode}`];
        if (onLeave) onLeave.call(this, this);
      });
      if (onBefore) {
        this.subscribe(event.name, onBefore.bind(this, this));
      }
      if (on) {
        this.subscribe(event.name, on.bind(this, this));
      }
      this.subscribe(event.name, () => {
        this.mode = event.to;
      });
      if (onNewState) {
        this.subscribe(event.name, onNewState.bind(this, this));
      }
    }

    for (let event of nonBaseEvents) {
      this.subscribe(event.name, event.action.bind(this, this));
    }
  }

  buildWorld(): void {
    let global = this.ecs.getEntity("global");
    global.Global.bgSheet = this.background;

    this.generateModalButtonCSSClasses();
    this.generateSettingsMenuCSSClasses();

    ///// create background entity with parallax layers /////
    this.ecs.createEntity({
      id: "bg",
      ParallaxLayer: [
        this.spriteMap.getBackgroundLayerSprite("back"),
        this.spriteMap.getBackgroundLayerSprite("mid"),
        this.spriteMap.getBackgroundLayerSprite("fg"),
      ],
    });

    ///// initialize map background canvas for given terrain type /////
    this.updateMapTerrainBackground();

    ///// set driver entity sprite info /////
    let playerSpriteCoords = this.spriteMap.playerCarSprite;
    let player = this.ecs.getEntity("player");
    player.Renderable.spriteX = playerSpriteCoords.x;
    player.Renderable.spriteY = playerSpriteCoords.y;

    let bossSpriteCoords = this.spriteMap.bossCarSprite;
    let boss = this.ecs.getEntity("boss");
    boss.Renderable.spriteX = bossSpriteCoords.x;
    boss.Renderable.spriteY = bossSpriteCoords.y;

    ///// make all button entities /////
    this.buttonService.createButtonEntities(this);

    ///// add all animation/render systems /////
    this.addGraphicsSystems();

    ///// all set! /////
    this.publish("ready");
  }

  createMapEntity() {
    let mapEntity = this.ecs.createEntity({
      id: "map",
      MapData: {},
      TileData: {},
      Coordinates: {},
      Renderable: {
        renderW: 1000,
        renderH: 625,
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
          name: "smallBreakpoint",
          width: breakpoints.smallBreakpoint.mapWidth,
          height: breakpoints.smallBreakpoint.mapHeight,
          tileSize: breakpoints.smallBreakpoint.tileSize,
          scale: breakpoints.smallBreakpoint.scale,
        },
        {
          name: "regularBreakpoint",
          width: breakpoints.regularBreakpoint.mapWidth,
          height: breakpoints.regularBreakpoint.mapHeight,
          tileSize: breakpoints.regularBreakpoint.tileSize,
          scale: breakpoints.regularBreakpoint.scale,
        },
      ],
    });
    return mapEntity;
  }

  findInitialDriverHitbox() {
    let hb = [];
    hb.push(scaleVector({ X: 6, Y: 2 }, 2 / 3));
    hb.push(scaleVector({ X: 19, Y: 2 }, 2 / 3));
    hb.push(scaleVector({ X: 19, Y: 23 }, 2 / 3));
    hb.push(scaleVector({ X: 6, Y: 23 }, 2 / 3));
    return hb;
  }

  findInitialDriverCenterpoint(hb: IVector[]) {
    return getCenterPoint(
      hb[0].X,
      hb[0].Y,
      hb[1].X - hb[0].X,
      hb[3].Y - hb[0].Y
    );
  }

  createDriverEntity(name: "player" | "boss") {
    let hb = this.findInitialDriverHitbox();
    let cp = this.findInitialDriverCenterpoint(hb);

    let entity = this.ecs.createEntity({
      id: name,
      Coordinates: {},
      Car: {
        color: name === "player" ? "blue" : "red",
      },
      Velocity: {},
      Renderable: {
        renderW: 25 * (2 / 3),
        renderH: 25 * (2 / 3),
      },
      Collision: { hb, cp },
      Breakpoint: [
        { name: "smallBreakpoint", scale: breakpoints.smallBreakpoint.scale },
        {
          name: "regularBreakpoint",
          scale: breakpoints.regularBreakpoint.scale,
        },
      ],
    });

    entity.Collision.currentHb = getCurrentHb.bind(entity);
    entity.Collision.currentCp = getCurrentCp.bind(entity);

    if (name !== "player" || this.autopilot) {
      entity.addComponent("Path", { driver: name });
    }

    return entity;
  }

  addBehaviorSystems() {
    this.ecs.addSystem(
      "timers",
      new RaceTimerSystem(this, this.ecs, this.step)
    );
    this.ecs.addSystem(
      "lights",
      new LightTimerSystem(this, this.ecs, this.step)
    );
    this.ecs.addSystem(
      "caffeine",
      new CaffeineSystem(this, this.ecs, this.step)
    );
    this.ecs.addSystem(
      "tooltips",
      new TooltipSystem(this, this.ecs, this.step)
    );
    this.ecs.addSystem("input", new InputSystem(this, this.ecs));
    this.ecs.addSystem("move", new MovementSystem(this, this.ecs));
    this.ecs.addSystem("collision", new CollisionSystem(this, this.ecs));
    this.ecs.addSystem("map", new MapSystem(this, this.ecs));
    this.ecs.addSystem(
      "animations",
      new LevelStartAnimation(this, this.ecs, this.step, this.uictx)
    );
    this.ecs.addSystem("animations", new Animation(this, this.ecs));
  }

  addGraphicsSystems() {
    let {
      RenderBackground,
      RenderOffscreenMap,
      RenderGameplayEntities,
      RenderSandboxMap,
      RenderViewBox,
      RenderMenus,
      RenderTopLevelGraphics,
      RenderBorders,
    } = RenderGroup;

    this.ecs.addSystem("animations", new BackgroundAnimation(this, this.ecs));
    this.ecs.addSystem("render", new BreakpointSystem(this, this.ecs));
    this.ecs.addSystem(
      "render",
      new RenderBackground(this, this.ecs, this.uictx)
    );
    this.ecs.addSystem("render", new RenderBorders(this, this.ecs, this.uictx));
    this.ecs.addSystem(
      "render",
      new RenderOffscreenMap(this, this.ecs, this.osmctx)
    );
    this.ecs.addSystem(
      "render",
      new RenderGameplayEntities(this, this.ecs, this.osectx, this.OSEntCanvas)
    );
    this.ecs.addSystem(
      "render",
      new RenderSandboxMap(this, this.ecs, this.uictx)
    );
    this.ecs.addSystem(
      "render",
      new RenderViewBox(this, this.ecs, this.uictx, this.step)
    );
    this.ecs.addSystem("render", new RenderMenus(this, this.ecs, this.uictx));
    this.ecs.addSystem(
      "render",
      new RenderTopLevelGraphics(this, this.ecs, this.uictx)
    );
  }

  generateModalButtonCSSClasses() {
    let styleEl = document.createElement("style");
    let styleHTML = "";

    this.spriteMap.forEachModalButtonSprite((sprite, name) => {
      styleHTML += `.${name}::after {background-position: -${sprite.x}px -${sprite.y}px;}\n`;
    });

    styleEl.innerHTML = styleHTML;
    document.head.appendChild(styleEl);
  }

  generateSettingsMenuCSSClasses() {
    let styleEl = document.createElement("style");
    let styleHTMLSmall = "";
    let styleHTMLBig = "@media only screen and (min-width: 1440px) {";

    cars.forEach((c) => {
      let sprite = <ISprite>this.spriteMap.getSprite(c.sprite);
      styleHTMLSmall += `#${c.sprite}-icon {background-position: -${sprite.x *
        2.28}px -${sprite.y * 2.28}px;}\n`;
      styleHTMLBig += `#${c.sprite}-icon {background-position: -${sprite.x *
        3}px -${sprite.y * 3}px;}\n`;
    });

    neighborhoods.forEach((n) => {
      let sprite = <ISprite>this.spriteMap.getSprite(n.sprite);
      styleHTMLSmall += `#${n.sprite}-icon {background-position: -${sprite.x *
        1.52}px -${sprite.y * 1.52}px;}\n`;
      styleHTMLBig += `#${n.sprite}-icon {background-position: -${sprite.x *
        2}px -${sprite.y * 2}px;}\n`;
    });

    styleHTMLBig += "}";

    styleEl.innerHTML = styleHTMLSmall + styleHTMLBig;
    document.head.appendChild(styleEl);
  }

  updateMapTerrainBackground() {
    let sprite1 = <ISprite>this.spriteMap.getSprite("background1");
    let sprite2 = <ISprite>this.spriteMap.getSprite("background2");
    let spriteSheet = this.spriteSheet;

    forEachMapTile((i, x, y, w, h) => {
      let sprite = random() < 0.5 ? sprite1 : sprite2;
      this.osmbgctx.drawImage(
        spriteSheet,
        sprite.x,
        sprite.y,
        sprite.w,
        sprite.h,
        x,
        y,
        w,
        h
      );
    });
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

      if (
        !this.difficulty ||
        this.playMode === "custom" ||
        this.playMode === "completed"
      )
        this.publish("chooseDifficulty");
      else this.publish("startingAnimation");
    } catch (err) {
      console.error(err);
    }
  }

  tick() {
    let now = this.timestamp();
    this.totalElapsedTime = now - this.start;
    this.frameElapsedTime += min(1000, now - this.lastTick);

    while (this.frameElapsedTime > this.step) {
      this.frameElapsedTime -= this.step;
      this.update(this.step);
    }

    this.lastTick = now;

    this.render();

    requestAnimationFrame(this.tick.bind(this));
  }

  update(step: number) {
    this.logTimers.update();
    this.ecs.runSystemGroup("input");
    this.ecs.runSystemGroup("tooltips");
    if (this.mode === "playing") {
      this.ecs.runSystemGroup("lights");
      this.ecs.runSystemGroup("caffeine");
      this.ecs.runSystemGroup("move");
      this.ecs.runSystemGroup("collision");
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
    // console.log(`Publishing ${event}`);
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

    this.raceData = new RaceDataService(id, this.difficulty, color, this.step);
  }

  endRace() {
    this.raceData = null;
  }

  resetLastCompletedLevel() {
    getLastCompletedLevel()
      .then((l) => (this.lastCompletedLevel = Number(l)))
      .catch((err) => console.error(err));
  }

  saveRaceData(outcome: "won" | "lost" | "crash") {
    if (!this.raceData) return;
    let raceData = this.raceData.exportForSave(outcome);
    // axios
    //   .post("/races", raceData)
    //   .then((data: any) => {
    //     let { id } = data.data;
    //     console.log(`Saved race data under id ${id}`);
    //     this.endRace();
    //   })
    //   .catch((err: any) => console.error(err));
  }

  async updateUserSettings({
    color,
    terrain,
  }: {
    color: TCarColor;
    terrain: TTerrainStyle;
  }) {
    await updateGraphicsSettings({ color, terrain });
    this.setCarColor(color);
    this.setTerrainStyle(terrain);
  }

  async getUserSettings() {
    let userSettings = await getUserInfo();
    return userSettings;
  }

  getPlayerHB() {
    let player = this.ecs.getEntity("player");
    let { hb, cp } = player.Collision;
    let c = player.Coordinates;

    hb = hb.map((v: IVector) => ({ X: v.X + c.X, Y: v.Y + c.Y }));
    let cpx = cp.X + c.X;
    let cpy = cp.Y + c.Y;

    let deg = player.Renderable.degrees;
    if (deg === 0) return hb;
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

  setTerrainStyle(style: TTerrainStyle) {
    this.terrainStyle = style;
    this.updateMapTerrainBackground();
  }

  setCarColor(color: TCarColor) {
    let { Car, Renderable } = this.ecs.getEntity("player");
    Car.color = color;
    let sprite = <ISprite>this.spriteMap.getSprite(`${color}Car`);
    Renderable.spriteX = sprite.x;
    Renderable.spriteY = sprite.y;
    Renderable.spriteW = sprite.w;
    Renderable.spriteH = sprite.h;
  }

  resetGameView() {
    this.focusView = "player";
    this.currentZoom = 1;
    this.mapView = false;
  }

  loadGameFont() {
    document.fonts.add(this.gameFont);

    this.logFontLoaded = this.logFontLoaded.bind(this);

    this.gameFont
      .load()
      .then(this.logFontLoaded)
      .catch((err) => console.error(err));
  }

  updateCanvasSize() {
    let newW = ceil(window.innerWidth);
    let newH = ceil(window.innerHeight);
    let size: "smallBreakpoint" | "regularBreakpoint" =
      newW < 1440 ? "smallBreakpoint" : "regularBreakpoint";

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
      let playerCoords = p.Collision.currentHb()[0];
      let currentSquareCoords = map.getSquareByCoords(
        playerCoords.X,
        playerCoords.Y
      ).coordinates;
      let officeCoords = map.getKeySquare("office").coordinates;

      p.Coordinates.X = currentSquareCoords.X;
      p.Coordinates.Y = currentSquareCoords.Y;
      p.Velocity.vector = { X: 0, Y: 0 };

      p.Path.path = map.findPath(
        p.Coordinates.X,
        p.Coordinates.Y,
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

  logFontLoaded() {
    console.info(this.gameFont.family, " loaded successfully.");
    this.fontIsLoaded = true;
    if (this.backgroundIsLoaded && this.spriteSheetIsLoaded) this.buildWorld();
  }
}

export const game = new Game();

window.game = game;

// window.autopilotOn = function() {
//   game.enableAutopilot();
// };

// window.autopilotOff = function() {
//   game.disableAutopilot();
// };

requestAnimationFrame(game.tick.bind(game));

export default Game;
