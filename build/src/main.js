var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import EntityComponentSystem from "@fritzy/ecs";
import { getCenterPoint, scaleVector, findRotatedVertex, calculateSpeedConstant } from "gameMath";
import * as breakpoints from "./modules/breakpoints";
import bgMap from "./bgMap";
import modalButtonMap from "./modalButtonMap";
import keyCodes from "./keyCodes";
import DesignModule from "./modules/designModule";
import LogTimers from "./modules/logger";
import { ArcadeMap } from "./state/map";
import PubSub from "./state/pubsub";
import Race from "./modules/raceData";
// import { MenuButtons } from "./state/menuButtons";
import makeButtonEntities from "./state/buttonFactory";
import Components from "./components/index";
import Tags from "./tags/tags";
import { BreakpointSystem } from "./systems/breakpoints";
import { MapSystem } from "./systems/map";
import { LightTimerSystem } from "./systems/lights";
import { InputSystem } from "./systems/input";
import { MovementSystem } from "./systems/move";
import { CollisionSystem } from "./systems/collision";
import { CaffeineSystem } from "./systems/caffeine";
import { RaceTimerSystem } from "./systems/timers";
import { LevelStartAnimation, BackgroundAnimation, Animation, } from "./systems/animations";
import RenderGroup from "./systems/render";
import { loadArcadeLevel, loadCustomLevel, createUser, getLastCompletedLevel, updateGraphicsSettings, getUserInfo, } from "./state/localDb";
import SpriteMap from "./spriteMapModule";
import { forEachMapTile } from "./modules/tileDrawer";
import { cars, neighborhoods } from "./react/modalContents/settingsContent";
import { TooltipSystem } from "./systems/tooltips";
Number.prototype.times = function (cb, start) {
    //@ts-ignore
    let num = parseInt(this);
    let curr = start || 0;
    for (let i = 0; i < num; i++) {
        cb(curr);
        curr++;
    }
};
Number.prototype.between = function (min, max, inclusive = true) {
    let aboveMin = inclusive ? this >= min : this > min;
    let belowMax = inclusive ? this <= max : this < max;
    return aboveMin && belowMax;
};
Array.prototype.deepMap = function (cb) {
    let output = [];
    for (let i = 0; i < this.length; i++) {
        let el = this[i];
        if (Array.isArray(el)) {
            output.push(el.deepMap(cb));
        }
        else {
            output.push(cb(el, i, this));
        }
    }
    return output;
};
// window.makeSeedData = function() {
//   axios
//     .post("/generate_seed_data")
//     .then((result) => console.log(result))
//     .catch((err) => console.error(err));
// };
export class Game {
    constructor() {
        this.step = 1000 / 60; //17; //1/60s
        this.start = this.timestamp();
        this.lastTick = this.start;
        this.totalElapsedTime = 0;
        this.frameElapsedTime = 0;
        this.tickTimes = [];
        this.mode = "init";
        this.playMode = "";
        this.pubSub = new PubSub("init");
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
        this.difficulty = "";
        this.focusView = "player";
        this.mapView = false;
        this.zoomFactor = 4;
        this.currentZoom = 1;
        this.defaultGameZoom = 4;
        this.lastCompletedLevel = 0;
        this.inputs = new InputEvents();
        // this.sounds = new Sounds(this);
        this.UICanvas = document.getElementById("ui");
        this.uictx = this.UICanvas.getContext("2d");
        this.OSMapBackgroundCanvas = (document.createElement("canvas"));
        this.OSMapBackgroundCanvas.width = 1000;
        this.OSMapBackgroundCanvas.height = 625;
        this.osmbgctx = (this.OSMapBackgroundCanvas.getContext("2d"));
        this.OSMapCanvas = (document.getElementById("map-offscreen"));
        this.osmctx = this.OSMapCanvas.getContext("2d");
        this.OSEntCanvas = (document.getElementById("ents-offscreen"));
        this.osectx = this.OSEntCanvas.getContext("2d");
        this.subscribers = {};
        this.logTimers = new LogTimers(this);
        this.map = new ArcadeMap(40, 25);
        this.designModule = new DesignModule(this);
        this.spriteSheet = new Image();
        this.background = new Image();
        this.gameFont = new FontFace("8-bit-pusab-regular", "url('./8-bit-pusab.ttf')");
        document.fonts.add(this.gameFont);
        this.uictx.textBaseline = "top";
        this.spriteSheetIsLoaded = false;
        this.backgroundIsLoaded = false;
        this.fontIsLoaded = false;
        this.carColor = "blue";
        this.terrainStyle = "snow";
        this.spriteMap = new SpriteMap(this);
        this.autopilot = false;
        this.windowWidth = window.innerWidth;
        this.windowHeight = window.innerHeight;
        this.breakpoint = "regular";
        this.background.src = "./bgsheet-sm.png";
        this.spriteSheet.src = "./spritesheet.png";
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
        let cp = getCenterPoint(hb[0].X, hb[0].Y, hb[1].X - hb[0].X, hb[3].Y - hb[0].Y);
        let getCurrentHb = function (degrees) {
            //@ts-ignore
            let entity = this;
            let { hb, cp } = entity.Collision;
            let c = entity.Coordinates;
            hb = hb.map((v) => ({
                X: v.X + c.X,
                Y: v.Y + c.Y,
            }));
            let cpx = cp.X + c.X;
            let cpy = cp.Y + c.Y;
            let deg = degrees !== null && degrees !== void 0 ? degrees : entity.Renderable.degrees;
            if (deg === 0)
                return hb;
            return hb.map(({ X, Y }) => findRotatedVertex(X, Y, cpx, cpy, deg));
        };
        let getCurrentCp = function () {
            //@ts-ignore
            let entity = this;
            let { hb, cp } = entity.Collision;
            let c = entity.Coordinates;
            let cpx = cp.X + c.X;
            let cpy = cp.Y + c.Y;
            return { X: cpx, Y: cpy };
        };
        this.playerEntity = this.ecs.createEntity({
            id: "player",
            Coordinates: Object.assign({}, (this.map.getSquare(this.map.playerHome)
                ? this.map.getSquare(this.map.playerHome).coordinates
                : { X: 0, Y: 0 })),
            Car: {
                color: "blue",
            },
            Velocity: {},
            Renderable: {
                renderW: 25 * (2 / 3),
                renderH: 25 * (2 / 3),
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
                renderW: 25 * (2 / 3),
                renderH: 25 * (2 / 3),
            },
            Collision: { hb, cp },
            Breakpoint: [
                { name: "small", scale: breakpoints.small.scale },
                { name: "regular", scale: breakpoints.regular.scale },
            ],
        });
        createUser()
            .then((user) => {
            let { color, terrain, lastCompletedLevel } = user;
            this.lastCompletedLevel = lastCompletedLevel;
            this.setTerrainStyle(terrain);
            this.setCarColor(color);
        })
            .catch((err) => console.error(err));
        this.playerEntity.Collision.currentHb = getCurrentHb.bind(this.playerEntity);
        this.playerEntity.Collision.currentCp = getCurrentCp.bind(this.playerEntity);
        window.getPlayerSpeedConstant = () => calculateSpeedConstant(this.playerEntity);
        this.bossEntity.Collision.currentHb = getCurrentHb.bind(this.bossEntity);
        this.bossEntity.Collision.currentCp = getCurrentCp.bind(this.bossEntity);
        this.globalEntity.Global.player = this.playerEntity;
        this.ecs.addSystem("render", new BreakpointSystem(this, this.ecs));
        this.logFontLoaded = this.logFontLoaded.bind(this);
        this.gameFont
            .load()
            .then(this.logFontLoaded)
            .catch((err) => console.error(err));
        this.background.onload = () => {
            this.backgroundIsLoaded = true;
            if (this.spriteSheetIsLoaded && this.fontIsLoaded)
                this.buildWorld();
        };
        this.spriteSheet.onload = () => {
            this.spriteSheetIsLoaded = true;
            if (this.backgroundIsLoaded && this.fontIsLoaded)
                this.buildWorld();
        };
        this.ecs.addSystem("timers", new RaceTimerSystem(this, this.ecs, this.step));
        this.ecs.addSystem("lights", new LightTimerSystem(this, this.ecs, this.step));
        this.ecs.addSystem("caffeine", new CaffeineSystem(this, this.ecs, this.step));
        this.ecs.addSystem("tooltips", new TooltipSystem(this, this.ecs, this.step));
        this.ecs.addSystem("input", new InputSystem(this, this.ecs));
        this.ecs.addSystem("move", new MovementSystem(this, this.ecs));
        this.ecs.addSystem("collision", new CollisionSystem(this, this.ecs));
        this.ecs.addSystem("map", new MapSystem(this, this.ecs));
        this.ecs.addSystem("animations", new LevelStartAnimation(this, this.ecs, this.step, this.uictx));
        this.ecs.addSystem("animations", new Animation(this, this.ecs));
        // this.enableAutopilot();
    }
    timestamp() {
        return window.performance && window.performance.now
            ? window.performance.now()
            : new Date().getTime();
    }
    registerComponents() {
        console.log("Loading components...");
        for (let name of Object.keys(Components)) {
            console.log(`Registering ${name}`);
            this.ecs.registerComponent(name, Components[name]);
        }
    }
    registerTags() {
        console.log("Loading tags...");
        this.ecs.registerTags(Tags);
    }
    registerSubscribers() {
        console.log("Subscribing events...");
        let validate = this.pubSub.baseEventHandlers.validate;
        for (let event of this.pubSub.baseEvents) {
            //this must be first
            this.subscribe(event.name, validate.bind(this, this, event.name, event.from));
            let onbefore = this.pubSub.baseEventHandlers[`onbefore${event.name}`];
            let on = this.pubSub.baseEventHandlers[`on${event.name}`];
            let onNewState = this.pubSub.baseEventHandlers[`on${event.to}`];
            this.subscribe(event.name, () => {
                let onleave = this.pubSub.baseEventHandlers[`onleave${this.mode}`];
                if (onleave)
                    onleave.call(this, this);
            });
            if (onbefore) {
                this.subscribe(event.name, onbefore.bind(this, this));
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
        for (let name in this.pubSub.nonBaseEventHandlers) {
            this.pubSub.nonBaseEventHandlers[name] = this.pubSub.nonBaseEventHandlers[name].bind(this, this);
        }
        for (let event of this.pubSub.nonBaseEvents) {
            this.subscribe(event.name, event.action);
        }
    }
    buildWorld() {
        this.globalEntity.Global.bgSheet = this.background;
        this.globalEntity.Global.bgMap = bgMap;
        this.generateModalButtonCSSClasses();
        this.generateSettingsMenuCSSClasses();
        ///// create background entity with parallax layers /////
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
        ///// initialize map background canvas for given terrain type /////
        this.updateMapTerrainBackground();
        ///// set driver entity sprite info /////
        let playerSpriteCoords = this.spriteMap.getPlayerCarSprite();
        this.playerEntity.Renderable.spriteX = playerSpriteCoords.x;
        this.playerEntity.Renderable.spriteY = playerSpriteCoords.y;
        let bossSpriteCoords = this.spriteMap.getBossCarSprite();
        this.bossEntity.Renderable.spriteX = bossSpriteCoords.x;
        this.bossEntity.Renderable.spriteY = bossSpriteCoords.y;
        ///// make all button entities /////
        makeButtonEntities(this);
        ///// add all animation/render systems /////
        this.addGraphicsSystems();
        ///// all set! /////
        this.publish("ready");
    }
    addGraphicsSystems() {
        let { RenderBackground, RenderOffscreenMap, RenderGameplayEntities, RenderSandboxMap, RenderViewBox, RenderMenus, RenderTopLevelGraphics, RenderBorders, } = RenderGroup;
        this.ecs.addSystem("animations", new BackgroundAnimation(this, this.ecs));
        this.ecs.addSystem("render", new RenderBackground(this, this.ecs, this.uictx));
        this.ecs.addSystem("render", new RenderBorders(this, this.ecs, this.uictx));
        this.ecs.addSystem("render", new RenderOffscreenMap(this, this.ecs, this.osmctx));
        this.ecs.addSystem("render", new RenderGameplayEntities(this, this.ecs, this.osectx, this.OSEntCanvas));
        this.ecs.addSystem("render", new RenderSandboxMap(this, this.ecs, this.uictx));
        this.ecs.addSystem("render", new RenderViewBox(this, this.ecs, this.uictx, this.step));
        this.ecs.addSystem("render", new RenderMenus(this, this.ecs, this.uictx));
        this.ecs.addSystem("render", new RenderTopLevelGraphics(this, this.ecs, this.uictx));
    }
    generateModalButtonCSSClasses() {
        let styleEl = document.createElement("style");
        let styleHTML = "";
        for (let name in modalButtonMap) {
            let b = modalButtonMap[name];
            styleHTML += `.${name}::after {background-position: -${b.x}px -${b.y}px;}\n`;
        }
        styleEl.innerHTML = styleHTML;
        document.head.appendChild(styleEl);
    }
    generateSettingsMenuCSSClasses() {
        let styleEl = document.createElement("style");
        let styleHTMLSmall = "";
        let styleHTMLBig = "@media only screen and (min-width: 1440px) {";
        cars.forEach((c) => {
            let sprite = this.spriteMap.getSprite(c.sprite);
            styleHTMLSmall += `#${c.sprite}-icon {background-position: -${sprite.x *
                2.28}px -${sprite.y * 2.28}px;}\n`;
            styleHTMLBig += `#${c.sprite}-icon {background-position: -${sprite.x *
                3}px -${sprite.y * 3}px;}\n`;
        });
        neighborhoods.forEach((n) => {
            let sprite = this.spriteMap.getSprite(n.sprite);
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
        let sprite1 = this.spriteMap.getSprite("background1");
        let sprite2 = this.spriteMap.getSprite("background2");
        let spriteSheet = this.spriteSheet;
        forEachMapTile((i, x, y, w, h) => {
            let sprite = Math.random() < 0.5 ? sprite1 : sprite2;
            this.osmbgctx.drawImage(spriteSheet, sprite.x, sprite.y, sprite.w, sprite.h, x, y, w, h);
        });
    }
    loadLevel(level /*can be either level number if arcade mode or level id if custom mode*/) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let loadFunc = loadArcadeLevel;
                if (this.playMode === "custom")
                    loadFunc = loadCustomLevel;
                let result = yield loadFunc(level);
                if (result === "end of game") {
                    this.publish("endOfGame");
                    return;
                }
                let { id, name, levelNumber, description, mapInfo } = result;
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
                if (!this.difficulty || this.playMode === "custom")
                    this.publish("chooseDifficulty");
                else
                    this.publish("startingAnimation");
            }
            catch (err) {
                console.error(err);
            }
        });
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
    update(step) {
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
            if (this.uictx.canvas.width != window.innerWidth)
                this.updateCanvasSize();
            this.ecs.runSystemGroup("animations");
            this.ecs.runSystemGroup("render");
        }
    }
    subscribe(event, callback) {
        this.subscribers = this.subscribers || {};
        this.subscribers[event] = this.subscribers[event] || [];
        this.subscribers[event].push(callback);
    }
    publish(event, ...args) {
        console.log(`Publishing ${event}`);
        if (this.subscribers && this.subscribers[event]) {
            const subs = this.subscribers[event];
            let start = 0;
            if (/validate/.test(subs[start].name)) {
                let valid = subs[start].call(this);
                if (!valid)
                    return;
                start = 1;
            }
            for (let n = start; n < subs.length; n++) {
                subs[n].apply(this, args);
            }
        }
    }
    startRace() {
        if (!this.recordRaceData)
            return;
        let { MapData: { map: { id }, }, } = this.ecs.getEntity("map");
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
    saveRaceData(outcome) {
        if (!this.currentRace)
            return;
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
    updateUserSettings({ color, terrain, }) {
        return __awaiter(this, void 0, void 0, function* () {
            yield updateGraphicsSettings({ color, terrain });
            this.setCarColor(color);
            this.setTerrainStyle(terrain);
        });
    }
    getUserSettings() {
        return __awaiter(this, void 0, void 0, function* () {
            let userSettings = yield getUserInfo();
            return userSettings;
        });
    }
    getPlayerHB() {
        let player = this.ecs.getEntity("player");
        let { hb, cp } = player.Collision;
        let c = player.Coordinates;
        hb = hb.map((v) => ({ X: v.X + c.X, Y: v.Y + c.Y }));
        let cpx = cp.X + c.X;
        let cpy = cp.Y + c.Y;
        let deg = player.Renderable.degrees;
        if (deg === 0)
            return hb;
        // entity.Renderable.degrees = degrees;
        console.log("Degrees: ", deg);
        console.log("HB before rotation: ", hb);
        //@ts-ignore
        return hb.map(({ X, Y }) => findRotatedVertex(X, Y, cpx, cpy, deg));
    }
    setDifficulty(d) {
        this.difficulty = d;
        let bossEntity = this.ecs.getEntity("boss");
        let speedConstants = {
            easy: 1,
            medium: 1.5,
            hard: 2,
        };
        bossEntity.Velocity.speedConstant = speedConstants[d];
    }
    setTerrainStyle(style) {
        this.terrainStyle = style;
        this.updateMapTerrainBackground();
    }
    setCarColor(color) {
        let { Car, Renderable } = this.ecs.getEntity("player");
        Car.color = color;
        let sprite = this.spriteMap.getSprite(`${color}Car`);
        Renderable.spriteX = sprite.x;
        Renderable.spriteY = sprite.y;
        Renderable.spriteW = sprite.w;
        Renderable.spriteH = sprite.h;
    }
    updateCanvasSize() {
        let newW = Math.ceil(window.innerWidth);
        let newH = Math.ceil(window.innerHeight);
        let size = newW < 1440 ? "small" : "regular";
        this.uictx.canvas.style.width = `${newW}px`;
        this.uictx.canvas.style.height = `${newH}px`;
        this.uictx.canvas.width = newW;
        this.uictx.canvas.height = newH;
        this.uictx.imageSmoothingEnabled = false;
        this.breakpoint = size;
    }
    enableAutopilot() {
        if (this.autopilot)
            return true;
        let p = this.ecs.getEntity("player");
        if (!p.has("Path"))
            p.addComponent("Path", { driver: "player" });
        let { MapData: { map }, } = this.ecs.getEntity("map");
        if (map && !p.Path.length) {
            let currentSquareCoords = map.getSquareByCoords(p.Coordinates.X, p.Coordinates.Y).coordinates;
            let officeCoords = map.getKeySquare("office").coordinates;
            p.Path.path = map.findPath(currentSquareCoords.X, currentSquareCoords.Y, officeCoords.X, officeCoords.Y);
        }
        this.autopilot = true;
        return this.autopilot;
    }
    disableAutopilot() {
        let p = this.ecs.getEntity("player");
        if (p.has("Path"))
            p.removeComponentByType("Path");
        this.autopilot = false;
        return this.autopilot;
    }
    logFontLoaded() {
        console.log(this.gameFont.family, " loaded successfully.");
        this.fontIsLoaded = true;
        if (this.backgroundIsLoaded && this.spriteSheetIsLoaded)
            this.buildWorld();
    }
}
export class InputEvents {
    constructor() {
        this.handleKeypress = (e) => {
            var _a;
            if (((_a = e.target) === null || _a === void 0 ? void 0 : _a.tagName) == "INPUT")
                return;
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
        this.handleUIMouseEvent = (e) => {
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
        this.UICanvas = document.getElementById("ui");
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
        this.UICanvas.addEventListener("mousedown", (e) => this.handleUIMouseEvent(e));
        this.UICanvas.addEventListener("mouseup", (e) => this.handleUIMouseEvent(e));
        this.UICanvas.addEventListener("mousemove", (e) => this.handleUIMouseEvent(e));
        document.addEventListener("pointerdown", (e) => {
            //@ts-ignore
            e.target.setPointerCapture(e.pointerId);
        });
        document.addEventListener("pointerup", (e) => {
            //@ts-ignore
            e.target.releasePointerCapture(e.pointerId);
        });
    }
    startDrag() {
        console.log("DRAG START");
        this.dragging = true;
    }
    endDrag() {
        console.log("DRAG END");
        this.dragging = false;
    }
}
export const game = new Game();
requestAnimationFrame(game.tick.bind(game));
export default Game;
