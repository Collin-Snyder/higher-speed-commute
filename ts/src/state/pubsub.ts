import { Entity } from "@fritzy/ecs";
import { Game } from "../main";
import Race from "../modules/raceData";
import { findCenteredElementSpread, randomNumBtwn } from "../modules/gameMath";
import { MapGrid, DesignMapGrid } from "./map";
import { Tool } from "../modules/designModule";
import { DisabledButtons } from "../buttonModifiers";
export type Mode =
  | "init"
  | "menu"
  | "starting"
  | "playing"
  | "paused"
  | "won"
  | "lost"
  | "designing"
  | "end";

interface StateInterface {
  on: { [action: string]: string };
  [prop: string]: any;
}

interface EventInterface {
  name: string;
  from: Mode | Mode[];
  to: Mode | Mode[];
  [key: string]: any;
}

class GameModeMachine {
  private states: { [state: string]: StateInterface };
  public defaultActions: { [name: string]: Function };
  public customActions: { [name: string]: Function };
  public events: EventInterface[];
  public customEvents: { name: string; action: Function }[];
  public current: Mode;

  constructor(initial: Mode) {
    this.current = initial;
    this.states = {
      init: {
        on: {
          LOAD: "menu",
        },
      },
      menu: {
        on: {
          PLAY: "playing",
          DESIGN: "design",
        },
      },
      playing: {
        on: {
          PAUSE: "paused",
          QUIT: "menu",
          WIN: "gameOver",
          LOSE: "gameOver",
        },
      },
      paused: {
        on: {
          RESUME: "playing",
          QUIT: "menu",
        },
      },
      gameOver: {
        on: {
          QUIT: "menu",
          REPLAY: "playing",
        },
      },
      design: {
        on: {
          TEST: "playing",
          QUIT: "menu",
        },
      },
    };
    //all actions are this-bound to the game instance in main.ts
    this.defaultActions = {
      validate: function() {
        let game = <Game>(<unknown>this);
        let [event, from] = [...arguments].slice(0, 2);
        let current = game.mode;

        return GameModeMachine.validateTransition(from, current, event);
      },
      onready: function() {
        let game = <Game>(<unknown>this);
        game.mode = "menu";
      },
      onmenu: function() {
        let game = <Game>(<unknown>this);
        if (game.mode !== "menu") return;
        let entities = game.ecs.queryEntities({ has: ["menu", "main"] });
        for (let entity of entities) {
          entity.removeTag("noninteractive");
        }
        console.log("menu loaded");
      },
      onleaveMenu: function() {
        let game = <Game>(<unknown>this);
        let entities = game.ecs.queryEntities({ has: ["menu", "main"] });
        for (let entity of entities) {
          entity.addTag("noninteractive");
        }
      },
      onstart: function() {
        //play starting animations
        let game = <Game>(<unknown>this);
        game.mode = "starting";
      },
      onplay: function() {
        let game = <Game>(<unknown>this);
        // let mapEntity = game.ecs.getEntity("global").Global.map;
        let mapEntity = game.ecs.getEntity("map");
        

        mapEntity.Coordinates.X = findCenteredElementSpread(
          window.innerWidth,
          mapEntity.Map.map.pixelWidth,
          1,
          "spaceEvenly"
        ).start;
        mapEntity.Coordinates.Y = findCenteredElementSpread(
          window.innerHeight,
          mapEntity.Map.map.pixelHeight,
          1,
          "spaceEvenly"
        ).start;

        game.startRace();
        game.mode = "playing";
      },
      onwin: function() {
        let game = <Game>(<unknown>this);
        console.log("YOU WIN!");
        let entities = game.ecs.queryEntities({
          has: ["menu", "gameplay", "won"],
        });
        for (let entity of entities) {
          entity.removeTag("noninteractive");
        }
        game.saveRaceData("win");
        game.mode = "won";
        // game.globalEntity.Global.mode = to;
        //stop game music/animations
        //render win animation and gameover options
      },
      onlose: function() {
        let game = <Game>(<unknown>this);

        console.log("YOU LOSE");
        let entities = game.ecs.queryEntities({
          has: ["menu", "gameplay", "lost"],
        });
        for (let entity of entities) {
          entity.removeTag("noninteractive");
        }
        game.saveRaceData("loss")
        game.mode = "lost";
        //stop game music/animations
        //render lose animation and game over options
      },
      oncrash: function() {
        let game = <Game>(<unknown>this);

        console.log("CRASH! YOU LOSE BIG TIME");
        let entities = game.ecs.queryEntities({
          has: ["menu", "gameplay", "lost"],
        });
        for (let entity of entities) {
          entity.removeTag("noninteractive");
        }
        game.saveRaceData("crash")
        game.mode = "lost";
      },
      onpause: function() {
        //show paused menu
        let game = <Game>(<unknown>this);

        let entities = game.ecs.queryEntities({
          has: ["menu", "gameplay", "paused"],
        });
        for (let entity of entities) {
          entity.removeTag("noninteractive");
        }
        game.mode = "paused";
      },
      onresume: function() {
        //hide paused menu
        let game = <Game>(<unknown>this);

        let entities = game.ecs.queryEntities({
          has: ["menu", "gameplay", "paused"],
        });
        for (let entity of entities) {
          entity.addTag("noninteractive");
        }
        game.mode = "playing";
      },
      onrestart: function() {
        let game = <Game>(<unknown>this);
        
        let entities = game.ecs.queryEntities({ has: ["menu", "gameplay"] });
        for (let entity of entities) {
          if (!entity.has("noninteractive")) entity.addTag("noninteractive");
        }
        game.ecs.runSystemGroup("map");
        game.startRace();
        game.mode = "playing";
      },
      onnextLevel: function() {
        let game = <Game>(<unknown>this);
        let next = game.currentLevel.number ? game.currentLevel.number + 1 : 1;
        game.publish("start");
        game.loadLevel(next);
      },
      ondesign: function() {
        let game = <Game>(<unknown>this);
        let UICanvas = <HTMLCanvasElement>document.getElementById("ui");

        //create design entities
        let mapEntity = game.ecs.getEntity("map");
        let designMap = new DesignMapGrid(40, 25);

        mapEntity.Map.map = designMap;
        mapEntity.TileMap.tiles = designMap.generateTileMap();
        mapEntity.addComponent("Clickable", {
          onClick: function() {
            game.designModule.editDesign();
          },
        });
        mapEntity.Coordinates.X = findCenteredElementSpread(
          window.innerWidth,
          mapEntity.Map.map.pixelWidth,
          1,
          "spaceEvenly"
        ).start;
        mapEntity.Coordinates.Y = findCenteredElementSpread(
          window.innerHeight,
          mapEntity.Map.map.pixelHeight,
          1,
          "spaceEvenly"
        ).start;

        game.designModule.createDesignMenus();

        game.mode = "designing";
        //(eventually) if first time, play walk-through
      },
      onbeforeleaveDesign: function() {
        //if design state is unsaved, prompt to save
        let game = <Game>(<unknown>this);
        if (!game.designModule.saved) {
          game.designModule.confirmUnsaved();
        }
      },
      onleaveDesign: function() {
        let game = <Game>(<unknown>this);
        let mapEntity = game.globalEntity.Global.map;
        if (game.designModule.saved) {
          //delete all design button entities
          let designButtons = game.ecs.queryEntities({
            has: ["menu", "design"],
          });
          for (let button of designButtons) {
            button.destroy();
          }

          //reset map entity
          mapEntity.Map.map = null;
          mapEntity.TileMap.tiles = [];
          mapEntity.Coordinates.X = 0;
          mapEntity.Coordinates.Y = 0;
          mapEntity.removeComponentByType("Clickable");

          //change mode
          game.mode = "menu";
        }
      },
      onbeforetest: function() {
        //check for map issues - i.e. no valid path for boss or player
        //if map issue present, prompt user to confirm
      },
      ontest: function() {
        //load current state of map into game as Map
        //do not save automatically
      },
      onbeforequit: function() {
        //if state is currently playing/paused, prompt "Are you sure you want to quit?"
      },
      onquit: function() {
        //hide game canvas
        let game = <Game>(<unknown>this);
        let entities = game.ecs.queryEntities({ has: ["menu", "gameplay"] });
        for (let entity of entities) {
          if (!entity.has("noninteractive")) entity.addTag("noninteractive");
        }
        let mapEntity = game.ecs.getEntity("map");
        mapEntity.mapId = null;
        mapEntity.map = null;
        game.mode = "menu";
      },
      onendOfGame: function() {
        let game = <Game>(<unknown>this);
        console.log("YOU WON THE WHOLE GAME!");

        let entities = game.ecs.queryEntities({
          has: ["menu", "gameplay", "won"],
        });
        for (let entity of entities) {
          entity.addTag("noninteractive");
        }

        game.mode = "end";
      },
    };
    this.customActions = {
      onSetDesignTool: function(tool: Tool) {
        let game = <Game>(<unknown>this);
        game.designModule.setDesignTool(tool);
      },
      onSave: function() {
        let game = <Game>(<unknown>this);
        game.designModule.save();
      },
      onSaveAs: function() {
        let game = <Game>(<unknown>this);
        game.designModule.saveAs();
      },
      onLoadSaved: function() {
        let game = <Game>(<unknown>this);
        game.designModule.loadSaved();
      },
      onUndo: function() {
        let game = <Game>(<unknown>this);
        game.designModule.undo();
      },
      onRedo: function() {
        let game = <Game>(<unknown>this);
        game.designModule.redo();
      },
      onForceMouseUp: function() {
        let game = <Game>(<unknown>this);
        // game.ecs.getEntity("global").Global.inputs.setMouseUp();
        game.inputs.setMouseUp();
      },
      onResetMap: function() {
        let game = <Game>(<unknown>this);
        game.designModule.resetMap();
      },
      onCaffeinate: function(driver: Entity, coffee: Entity) {
        let game = <Game>(<unknown>this);
        coffee.removeComponentByType("Renderable");
        driver.addComponent("CaffeineBoost", coffee.Caffeine);
        
        if (driver.id === "player") {
          let coffeeId = coffee.id.match(/\d+/g);
          if (coffeeId && coffeeId[0]) game.currentRace?.logCoffee(Number(coffeeId[0]));
        }
      },
      onRedLight: function(driver: Entity, light: Entity) {
        let game = <Game>(<unknown>this);
        if (driver.id === "player") {
          game.currentRace?.logRedLight(light);
        }
      }
    };
    this.events = [
      { name: "ready", from: "init", to: "menu" },
      { name: "start", from: ["menu", "won", "lost"], to: "starting" },
      { name: "play", from: "starting", to: "playing" },
      { name: "pause", from: ["playing", "starting"], to: "paused" },
      { name: "resume", from: "paused", to: "playing" },
      { name: "restart", from: ["paused", "won", "lost"], to: "playing" },
      { name: "win", from: "playing", to: "won" },
      { name: "lose", from: "playing", to: "lost" },
      { name: "crash", from: "playing", to: "lost" },
      { name: "quit", from: ["paused", "won", "lost"], to: "menu" },
      { name: "nextLevel", from: "won", to: "playing" },
      { name: "design", from: "menu", to: "designing" },
      { name: "test", from: "designing", to: "starting" },
      { name: "leaveDesign", from: "designing", to: "menu" },
      { name: "leaveMenu", from: "menu", to: ["starting", "designing"] },
      { name: "endOfGame", from: ["won", "starting"], to: "end" },
    ];
    this.customEvents = [
      { name: "crash", action: function() {} },
      { name: "redLight", action: function(driver: Entity, light: Entity) {
        let gmm = <GameModeMachine>(<unknown>this);
          gmm.customActions.onRedLight(driver, light);
      }},
      {
        name: "caffeinate",
        action: function(driver: Entity, coffee: Entity) {
          let gmm = <GameModeMachine>(<unknown>this);
          gmm.customActions.onCaffeinate(driver, coffee);
        },
      },
      {
        name: "setDesignTool",
        action: function(tool: Tool) {
          let gmm = <GameModeMachine>(<unknown>this);
          gmm.customActions.onSetDesignTool(tool);
        },
      },
      {
        name: "save",
        action: function() {
          let gmm = <GameModeMachine>(<unknown>this);
          gmm.customActions.onSave();
        },
      },
      {
        name: "saveAs",
        action: function() {
          let gmm = <GameModeMachine>(<unknown>this);
          gmm.customActions.onSaveAs();
        },
      },
      {
        name: "loadSaved",
        action: function() {
          let gmm = <GameModeMachine>(<unknown>this);
          gmm.customActions.onLoadSaved();
        },
      },
      {
        name: "undo",
        action: function() {
          let gmm = <GameModeMachine>(<unknown>this);
          gmm.customActions.onUndo();
        },
      },
      {
        name: "redo",
        action: function() {
          let gmm = <GameModeMachine>(<unknown>this);
          gmm.customActions.onRedo();
        },
      },
      {
        name: "forceMouseUp",
        action: function() {
          let gmm = <GameModeMachine>(<unknown>this);
          gmm.customActions.onForceMouseUp();
        },
      },
      {
        name: "resetMap",
        action: function() {
          let gmm = <GameModeMachine>(<unknown>this);
          gmm.customActions.onResetMap();
        },
      },
    ];
    for (let event of this.customEvents) {
      event.action = event.action.bind(this);
    }
  }

  static validateTransition(from: string, current: string, event: string) {
    let valid = true;
    if (Array.isArray(from)) {
      if (!from.includes(current)) valid = false;
    } else if (current !== from) valid = false;

    if (!valid) {
      console.log(
        `Attempted invalid state transition - ${event} event must transition from mode "${from}", but mode is currently "${current}"`
      );
    }

    return valid;
  }
}

export enum EVENT {
  CRASH,
  CAFFEINATE,
  SETDESIGNTOOL,
}

class PubSub {
  static enable(target: any) {
    target.subscribe = function(event: any, callback: Function) {
      this.subscribers = this.subscribers || {};
      this.subscribers[event] = this.subscribers[event] || [];
      this.subscribers[event].push(callback);
    };

    target.publish = function(event: any) {
      if (this.subscribers && this.subscribers[event]) {
        const subs = this.subscribers[event];
        const args = [].slice.call(arguments, 1);
        for (let n = 0; n < subs.length; n++) {
          subs[n].apply(target, args);
        }
      }
    };
  }
}

export default GameModeMachine;
