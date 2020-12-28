import { Entity } from "@fritzy/ecs";
import { Game } from "../main";
import Race from "../modules/raceData";
import { findCenteredElementSpread, getCenterPoint } from "../modules/gameMath";
import { MapGrid, DesignMapGrid } from "./map";
import { Tool } from "../modules/designModule";
import { DisabledButtons } from "../buttonModifiers";
export type Mode =
  | "init"
  | "menu"
  | "starting"
  | "levelStartAnimation"
  | "playing"
  | "paused"
  | "won"
  | "lost"
  | "crash"
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
      onstart: function(level: number) {
        //play starting animations
        let game = <Game>(<unknown>this);
        const mapEntity = game.ecs.getEntity("map");
        const wonGraphic = game.ecs.getEntity("wonGraphic");
        const crashGraphic = game.ecs.getEntity("crashGraphic");
        mapEntity.Renderable.alpha = 0;
        if (wonGraphic) wonGraphic.Renderable.visible = false;
        if (crashGraphic) crashGraphic.Renderable.visible = false;
        game.currentZoom = 1;
        game.mode = "starting";
        window.toggleModal(true, "levelStart", level);
        game.loadLevel(level);
      },
      onstartingAnimation: function() {
        const game = <Game>(<unknown>this);
        const mapEntity = game.ecs.getEntity("map");
        mapEntity.Renderable.bgColor = "#81c76d";
        mapEntity.Renderable.visible = true;
        game.mode = "levelStartAnimation";
      },
      onplay: function() {
        let game = <Game>(<unknown>this);
        game.startRace();
        game.mapView = false;
        game.mode = "playing";
      },
      onwin: function() {
        let game = <Game>(<unknown>this);
        console.log("YOU WIN!");

        let caffeinated = game.ecs.queryEntities({
          has: ["Car", "CaffeineBoost"],
        });

        if (caffeinated.size) {
          for (let driver of caffeinated) {
            driver.removeComponentByType("CaffeineBoost");
          }
        }

        let buttons = game.ecs.queryEntities({
          has: ["menu", "gameplay", "won"],
        });
        for (let button of buttons) {
          button.removeTag("noninteractive");
        }

        let graphic = game.ecs.getEntity("wonGraphic");

        if (!graphic) {
          let { X, Y } = game.spriteMap.wonGraphic;
          graphic = game.ecs.createEntity({
            id: "wonGraphic",
            Coordinates: {},
            Animation: { startSprite: game.spriteMap.shiny, degStep: 1 },
            Renderable: {
              spriteX: X,
              spriteY: Y,
            },
          });
        } else {
          graphic.Renderable.visible = true;
        }

        if (game.recordRaceData) game.saveRaceData("win");
        game.currentZoom = 1;
        game.focusView = "player";
        game.mode = "won";
      },
      onlose: function() {
        let game = <Game>(<unknown>this);
        let mapEntity = game.ecs.getEntity("map");

        console.log("YOU LOSE");

        let caffeinated = game.ecs.queryEntities({
          has: ["Car", "CaffeineBoost"],
        });

        if (caffeinated.size) {
          for (let driver of caffeinated) {
            driver.removeComponentByType("CaffeineBoost");
          }
        }

        let buttons = game.ecs.queryEntities({
          has: ["menu", "gameplay", "lost"],
        });
        for (let button of buttons) {
          button.removeTag("noninteractive");
        }
        
        if (game.recordRaceData) game.saveRaceData("loss");
        game.currentZoom = 1;
        game.focusView = "player";
        game.mode = "lost";
      },
      oncrash: function() {
        let game = <Game>(<unknown>this);
        let mapEntity = game.ecs.getEntity("map");

        console.log("CRASH! YOU LOSE BIG TIME");

        let caffeinated = game.ecs.queryEntities({
          has: ["Car", "CaffeineBoost"],
        });

        if (caffeinated.size) {
          for (let driver of caffeinated) {
            driver.removeComponentByType("CaffeineBoost");
          }
        }

        let buttons = game.ecs.queryEntities({
          has: ["menu", "gameplay", "lost"],
        });
        for (let button of buttons) {
          button.removeTag("noninteractive");
        }
        let graphic = game.ecs.getEntity("crashGraphic");

        if (!graphic) {
          let { X, Y } = game.spriteMap.crashGraphic;
          graphic = game.ecs.createEntity({
            id: "crashGraphic",
            Coordinates: {},
            Animation: { startSprite: game.spriteMap.badShiny, degStep: 1 },
            Renderable: {
              spriteX: X,
              spriteY: Y,
            },
          });
        } else {
          graphic.Renderable.visible = true;
        }
        if (game.recordRaceData) game.saveRaceData("crash");
        game.currentZoom = 1;
        game.focusView = "player";
        game.mode = "crash";
      },
      onpause: function() {
        let game = <Game>(<unknown>this);
        let mapEntity = game.ecs.getEntity("map");

        let entities = game.ecs.queryEntities({
          has: ["menu", "gameplay", "paused"],
        });
        for (let entity of entities) {
          entity.removeTag("noninteractive");
        }

        mapEntity.Renderable.bgColor = "lightgray";
        game.mode = "paused";
      },
      onresume: function() {
        let game = <Game>(<unknown>this);
        let mapEntity = game.ecs.getEntity("map");

        let entities = game.ecs.queryEntities({
          has: ["menu", "gameplay", "paused"],
        });
        for (let entity of entities) {
          if (!entity.has("noninteractive")) entity.addTag("noninteractive");
        }
        mapEntity.Renderable.bgColor = "#81c76d";
        game.mapView = false;
        game.mode = "playing";
      },
      onrestart: function() {
        let game = <Game>(<unknown>this);
        const mapEntity = game.ecs.getEntity("map");
        let entities = game.ecs.queryEntities({ has: ["menu", "gameplay"] });
        for (let entity of entities) {
          if (!entity.has("noninteractive")) entity.addTag("noninteractive");
        }
        mapEntity.Renderable.alpha = 0;
        game.currentZoom = 1;
        game.mode = "starting";
        game.ecs.runSystemGroup("map");
        game.publish("startingAnimation");
      },
      onnextLevel: function() {
        let game = <Game>(<unknown>this);
        let next = game.currentLevel.number ? game.currentLevel.number + 1 : 1;

        let entities = game.ecs.queryEntities({ has: ["menu", "gameplay"] });
        for (let entity of entities) {
          entity.addTag("noninteractive");
        }

        game.publish("start", next);
      },
      ondesign: function() {
        let game = <Game>(<unknown>this);
        let UICanvas = <HTMLCanvasElement>document.getElementById("ui");

        //create design entities
        let mapEntity = game.ecs.getEntity("map");
        let designMap = new DesignMapGrid(40, 25);

        mapEntity.Map.map = designMap;
        mapEntity.TileMap.tiles = designMap.generateDesignTileMap();
        mapEntity.Renderable.bgColor = "lightgray";
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
        mapEntity.Renderable.visible = true;

        let entities = game.ecs.queryEntities({ has: ["menu", "design"] });
        for (let entity of entities) {
          entity.removeTag("noninteractive");
        }

        // game.designModule.createDesignMenus();

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
        mapEntity.Renderable.visible = false;
        game.mode = "menu";
      },
      onendOfGame: function() {
        let game = <Game>(<unknown>this);
        let mapEntity = game.globalEntity.Global.map;
        console.log("YOU WON THE WHOLE GAME!");

        let entities = game.ecs.queryEntities({
          has: ["menu", "gameplay", "won"],
        });
        for (let entity of entities) {
          entity.addTag("noninteractive");
        }
        mapEntity.Renderable.visible = false;

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
        game.designModule.openSaveAsModal();
      },
      onLoadSaved: function() {
        let game = <Game>(<unknown>this);
        game.designModule.openLoadSavedModal();
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
        game.designModule.openResetModal();
      },
      onCaffeinate: function(driver: Entity, coffee: Entity) {
        let game = <Game>(<unknown>this);
        coffee.removeComponentByType("Renderable");
        coffee.removeComponentByType("Collision");
        driver.addComponent("CaffeineBoost", coffee.Caffeine);

        if (driver.id === "player") {
          let coffeeId = coffee.id.match(/\d+/g);
          if (coffeeId && coffeeId[0])
            game.currentRace?.logCoffee(Number(coffeeId[0]));
        }
      },
      onRedLight: function(driver: Entity, light: Entity) {
        let game = <Game>(<unknown>this);
        if (driver.id === "player") {
          game.currentRace?.logRedLight(light);
        }
      },
    };
    this.events = [
      { name: "ready", from: "init", to: "menu" },
      { name: "start", from: ["menu", "won", "lost"], to: "starting" },
      {
        name: "startingAnimation",
        from: "starting",
        to: "levelStartAnimation",
      },
      {
        name: "play",
        from: ["starting", "levelStartAnimation"],
        to: "playing",
      },
      { name: "pause", from: ["playing", "starting"], to: "paused" },
      { name: "resume", from: "paused", to: "playing" },
      { name: "restart", from: ["paused", "won", "lost", "crash"], to: "playing" },
      { name: "win", from: "playing", to: "won" },
      { name: "lose", from: "playing", to: "lost" },
      { name: "crash", from: "playing", to: "crash" },
      { name: "quit", from: ["paused", "won", "lost", "crash"], to: "menu" },
      { name: "nextLevel", from: "won", to: "playing" },
      { name: "design", from: "menu", to: "designing" },
      { name: "test", from: "designing", to: "starting" },
      { name: "leaveDesign", from: "designing", to: "menu" },
      { name: "leaveMenu", from: "menu", to: ["starting", "designing"] },
      { name: "endOfGame", from: ["won", "starting"], to: "end" },
    ];
    this.customEvents = [
      {
        name: "redLight",
        action: function(driver: Entity, light: Entity) {
          let gmm = <GameModeMachine>(<unknown>this);
          gmm.customActions.onRedLight(driver, light);
        },
      },
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

export default GameModeMachine;
