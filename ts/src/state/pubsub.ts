import { Entity } from "@fritzy/ecs";
import { Game } from "../main";
import Race from "../modules/raceData";
import { findCenteredElementSpread, getCenterPoint } from "../modules/gameMath";
import { ArcadeMap, SandboxMap } from "./map";
import { Tool } from "../modules/designModule";
import { DisabledButtons } from "../buttonModifiers";
import { updateLastCompletedLevel } from "./localDb";
export type Mode =
  | "init"
  | "menu"
  | "starting"
  | "loadLevel"
  | "chooseDifficulty"
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
  to: Mode;
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
      onmenu: function() {
        let game = <Game>(<unknown>this);
        if (game.mode !== "menu") return;
        game.playMode = "";
        //make map non-interactible and non-clickable

        let entities = game.ecs.queryEntities({ has: ["menu", "main"] });
        for (let entity of entities) {
          entity.removeTag("NI");
        }
        console.log("menu loaded");
      },
      onleavemenu: function() {
        let game = <Game>(<unknown>this);
        let entities = game.ecs.queryEntities({ has: ["menu", "main"] });
        for (let entity of entities) {
          entity.addTag("NI");
        }
      },
      onstart: function(level: number) {
        //play starting animations
        let game = <Game>(<unknown>this);
        console.log("running onstart");
        game.loadLevel(level);
      },
      onloadLevel: function(level: number) {
        let game = <Game>(<unknown>this);
        console.log("running onloadLevel");
        //render loading graphic
        game.loadLevel(level);
      },
      onchooseDifficulty: function() {
        let game = <Game>(<unknown>this);
        console.log("running onchooseDifficulty");
        window.toggleModal(true, "levelStart");
      },
      onstartingAnimation: function() {
        const game = <Game>(<unknown>this);
        console.log("running onstartingAnimation");
        const { Renderable } = game.ecs.getEntity("map");
        game.ecs.runSystemGroup("map");
        game.currentZoom = 1;
        Renderable.bgColor = "#81c76d";
        Renderable.alpha = 0;
        Renderable.visible = true;
      },
      onplay: function() {
        let game = <Game>(<unknown>this);
        game.startRace();
        game.mapView = false;
      },
      onwin: function() {
        let game = <Game>(<unknown>this);
        console.log("YOU WIN!");

        let currentLevel = game.currentLevel.number || 0;
        if (
          game.playMode === "arcade" &&
          game.lastCompletedLevel < currentLevel
        )
          game.lastCompletedLevel = currentLevel;

        let graphic = game.ecs.getEntity("wonGraphic");

        if (!graphic) {
          let { x, y } = game.spriteMap.wonGraphic;
          graphic = game.ecs.createEntity({
            id: "wonGraphic",
            Coordinates: {},
            Animation: { startSprite: game.spriteMap.shine, degStep: 1 },
            Renderable: {
              spriteX: x,
              spriteY: y,
            },
          });
        } else {
          graphic.Renderable.visible = true;
        }
      },
      onleavewon: function() {
        let game = <Game>(<unknown>this);
        const wonGraphic = game.ecs.getEntity("wonGraphic");
        if (wonGraphic) wonGraphic.Renderable.visible = false;
      },
      onlose: function() {
        let game = <Game>(<unknown>this);
        console.log("YOU LOSE");
      },
      oncrash: function() {
        let game = <Game>(<unknown>this);
        console.log("CRASH! YOU LOSE BIG TIME");

        let graphic = game.ecs.getEntity("crashGraphic");

        if (!graphic) {
          let { x, y } = game.spriteMap.crashGraphic;
          graphic = game.ecs.createEntity({
            id: "crashGraphic",
            Coordinates: {},
            Animation: { startSprite: game.spriteMap.badShine, degStep: 1 },
            Renderable: {
              spriteX: x,
              spriteY: y,
            },
          });
        } else {
          graphic.Renderable.visible = true;
        }
      },
      onleavecrash: function() {
        let game = <Game>(<unknown>this);
        const crashGraphic = game.ecs.getEntity("crashGraphic");
        if (crashGraphic) crashGraphic.Renderable.visible = false;
      },
      onpause: function() {
        let game = <Game>(<unknown>this);
        let { Renderable } = game.ecs.getEntity("map");

        let entities = game.ecs.queryEntities({
          has: ["menu", "gameplay", "paused"],
        });
        for (let entity of entities) {
          entity.removeTag("NI");
        }

        Renderable.bgColor = "lightgray";
      },
      onresume: function() {
        let game = <Game>(<unknown>this);
        let { Renderable } = game.ecs.getEntity("map");

        let entities = game.ecs.queryEntities({
          has: ["menu", "gameplay", "paused"],
        });
        for (let entity of entities) {
          if (!entity.has("NI")) entity.addTag("NI");
        }
        Renderable.bgColor = "#81c76d";
        game.mapView = false;
      },
      onrestart: function() {
        let game = <Game>(<unknown>this);
        let entities = game.ecs.queryEntities({ has: ["menu", "gameplay"] });
        for (let entity of entities) {
          if (!entity.has("NI")) entity.addTag("NI");
        }
        // game.ecs.runSystemGroup("map");
        game.publish("chooseDifficulty");
      },
      // onnextLevel: function() {
      //   let game = <Game>(<unknown>this);
      //   let next = game.currentLevel.number ? game.currentLevel.number + 1 : 1;

      //   let entities = game.ecs.queryEntities({ has: ["menu", "gameplay"] });
      //   for (let entity of entities) {
      //     entity.addTag("NI");
      //   }

      //   if (next > game.arcadeLevels) game.publish("endOfGame");
      //   else game.publish("start", next);
      // },
      ondesign: function() {
        let game = <Game>(<unknown>this);
        let UICanvas = <HTMLCanvasElement>document.getElementById("ui");

        //create design entities
        let mapEntity = game.ecs.getEntity("map");
        let { MapData, TileData, Coordinates, Renderable } = mapEntity;
        let designMap = new SandboxMap(40, 25);

        MapData.map = designMap;
        TileData.tiles = designMap.generateDesignTileMap();
        Renderable.bgColor = "lightgray";
        if (!mapEntity.has("Clickable")) {
          mapEntity.addComponent("Clickable", {
            onClick: function() {
              game.designModule.editDesign();
            },
          });
        }
        Coordinates.X = findCenteredElementSpread(
          window.innerWidth,
          Renderable.renderW,
          1,
          "spaceEvenly"
        ).start;
        Coordinates.Y = findCenteredElementSpread(
          window.innerHeight,
          Renderable.renderH,
          1,
          "spaceEvenly"
        ).start;
        Renderable.visible = true;
        if (mapEntity.has("NI")) mapEntity.removeTag("NI");

        let entities = game.ecs.queryEntities({ has: ["menu", "design"] });
        for (let entity of entities) {
          if (entity.has("NI")) entity.removeTag("NI");
        }

        game.designModule.setDesignTool("street");

        //(eventually) if first time, play walk-through
      },
      ondesigning: function() {
        let game = <Game>(<unknown>this);
        game.playMode = "";
      },
      onbeforeleaveDesign: function() {
        //if design state is unsaved, prompt to save
        let game = <Game>(<unknown>this);
        if (!game.designModule.saved) {
          game.designModule.confirmUnsaved();
        }
      },
      onleavedesigning: function() {
        let game = <Game>(<unknown>this);
        if (!game.designModule.saved) {
          game.designModule.clearMap();
          game.designModule.saved = true;
        }
        let designMenuButtons = game.ecs.queryEntities({
          has: ["menu", "design"],
        });
        for (let entity of designMenuButtons) {
          if (!entity.has("NI")) entity.addTag("NI");
        }
      },
      onbeforetest: function() {
        //check for map issues - i.e. no valid path for boss or player
        //if map issue present, prompt user to confirm
      },
      ontest: function() {
        //load current state of map into game as ArcadeMap
        //do not save automatically
        let game = <Game>(<unknown>this);
        game.testCurrentSandboxMap();
      },
      onbeforequit: function() {
        //if state is currently playing/paused, prompt "Are you sure you want to quit?"
      },
      onquit: function() {
        //hide game canvas
        let game = <Game>(<unknown>this);

        game.playMode = "";

        let gameplayMenuButtons = game.ecs.queryEntities({
          has: ["menu", "gameplay"],
        });
        for (let entity of gameplayMenuButtons) {
          if (!entity.has("NI")) entity.addTag("NI");
        }

        let mapEntity = game.ecs.getEntity("map");
        let { MapData, Renderable } = mapEntity;

        MapData.map = null;
        Renderable.visible = false;
        if (!mapEntity.has("NI")) mapEntity.addTag("NI");
      },
      onendOfGame: function() {
        let game = <Game>(<unknown>this);
        let { Renderable } = game.ecs.getEntity("map");
        console.log("YOU WON THE WHOLE GAME!");

        let entities = game.ecs.queryEntities({
          has: ["menu", "gameplay", "won"],
        });
        for (let entity of entities) {
          entity.addTag("NI");
        }

        Renderable.visible = false;
      },
    };
    this.customActions = {
      onRaceFinished: function(outcome: "won" | "lost" | "crash") {
        let game = <Game>(<unknown>this);

        //decaffeinate everybody
        let caffeinated = game.ecs.queryEntities({
          has: ["Car", "CaffeineBoost"],
        });
        if (caffeinated.size) {
          for (let driver of caffeinated) {
            driver.removeComponentByType("CaffeineBoost");
          }
        }

        //make all upcoming menu buttons interactible
        let buttons = game.ecs.queryEntities({
          has: ["menu", "gameplay", outcome],
        });
        for (let button of buttons) {
          button.removeTag("NI");
        }

        //reset the zoom and focus
        game.currentZoom = 1;
        game.focusView = "player";
        game.mapView = false;

        //save race data if applicable
        if (game.recordRaceData) game.saveRaceData(outcome);

        //fire outcome-specific event
        if (outcome === "won") game.publish("win");
        if (outcome === "lost") game.publish("lose");
        if (outcome === "crash") game.publish("crash");
      },
      onNextLevel: function() {
        let game = <Game>(<unknown>this);
        let next = game.currentLevel.number ? game.currentLevel.number + 1 : 1;

        let entities = game.ecs.queryEntities({ has: ["menu", "gameplay"] });
        for (let entity of entities) {
          entity.addTag("NI");
        }

        if (next > game.arcadeLevels) game.publish("endOfGame");
        else game.publish("start", next);
      },
      onSaveProgress: function() {
        let game = <Game>(<unknown>this);
        updateLastCompletedLevel(game.lastCompletedLevel).catch((err) =>
          console.error(err)
        );
      },
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
      {
        name: "start",
        from: ["menu", "won", "lost", "crash"],
        to: "loadLevel",
      },
      {
        name: "chooseDifficulty",
        from: ["loadLevel", "paused", "won", "lost", "crash", "designing"],
        to: "chooseDifficulty",
      },
      {
        name: "startingAnimation",
        from: "chooseDifficulty",
        to: "levelStartAnimation",
      },
      {
        name: "play",
        from: "levelStartAnimation",
        to: "playing",
      },
      { name: "pause", from: "playing", to: "paused" },
      { name: "resume", from: "paused", to: "playing" },
      {
        name: "restart",
        from: ["paused", "won", "lost", "crash"],
        to: "chooseDifficulty",
      },
      { name: "win", from: "playing", to: "won" },
      { name: "lose", from: "playing", to: "lost" },
      { name: "crash", from: "playing", to: "crash" },
      {
        name: "quit",
        from: ["paused", "won", "lost", "crash", "designing"],
        to: "menu",
      },
      // { name: "nextLevel", from: "won", to: "playing" },
      { name: "design", from: "menu", to: "designing" },
      { name: "test", from: "designing", to: "starting" },
      // { name: "leaveDesign", from: "designing", to: "menu" },
      // { name: "leaveMenu", from: "menu", to: ["starting", "designing"] },
      { name: "endOfGame", from: "won", to: "end" },
    ];
    this.customEvents = [
      {
        name: "raceFinished",
        action: function(outcome: "won" | "lost" | "crash") {
          let gmm = <GameModeMachine>(<unknown>this);
          gmm.customActions.onRaceFinished(outcome);
        },
      },
      {
        name: "nextLevel",
        action: function() {
          let gmm = <GameModeMachine>(<unknown>this);
          gmm.customActions.onNextLevel();
        },
      },
      {
        name: "saveProgress",
        action: function() {
          let gmm = <GameModeMachine>(<unknown>this);
          gmm.customActions.onSaveProgress();
        },
      },
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
