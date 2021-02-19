import { Entity } from "@fritzy/ecs";
import { Game } from "../main";
import { centerWithin } from "gameMath";
import { SandboxMap } from "./map";
import { Tool } from "../modules/designModule";
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

        let entities = game.ecs.queryEntities({ has: ["menu", "main"] });
        for (let entity of entities) {
          entity.Interactable.enabled = true;
        }
        console.log("menu loaded");
      },
      onleavemenu: function() {
        let game = <Game>(<unknown>this);
        let entities = game.ecs.queryEntities({ has: ["menu", "main"] });
        for (let entity of entities) {
          entity.Interactable.enabled = false;
        }
      },
      onstart: function(level: number) {
        let game = <Game>(<unknown>this);
        console.log("running onstart");
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
        game.mapView = false;
        game.startRace();
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
          let { x, y } = <ISprite>game.spriteMap.getSprite("wonGraphic");
          graphic = game.ecs.createEntity({
            id: "wonGraphic",
            Coordinates: {},
            Animation: { startSprite: game.spriteMap.getSprite("shine"), degStep: 1 },
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
        const mapEntity = game.ecs.getEntity("map");
        mapEntity.Renderable.visible = false;
        let entities = game.ecs.queryEntities({
          has: ["menu", "gameplay", "won"],
        });
        for (let entity of entities) {
          entity.Interactable.enabled = false;
        }
      },
      onlose: function() {
        let game = <Game>(<unknown>this);
        console.log("YOU LOSE");
      },
      onleavelost: function() {
        let game = <Game>(<unknown>this);
        const mapEntity = game.ecs.getEntity("map");
        mapEntity.Renderable.visible = false;
        let entities = game.ecs.queryEntities({
          has: ["menu", "gameplay", "lost"],
        });
        for (let entity of entities) {
          entity.Interactable.enabled = false;
        }
      },
      oncrash: function() {
        let game = <Game>(<unknown>this);
        console.log("CRASH! YOU LOSE BIG TIME");

        let graphic = game.ecs.getEntity("crashGraphic");

        if (!graphic) {
          let { x, y } = <ISprite>game.spriteMap.getSprite("crashGraphic");
          graphic = game.ecs.createEntity({
            id: "crashGraphic",
            Coordinates: {},
            Animation: { startSprite: game.spriteMap.getSprite("badShine"), degStep: 1 },
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
        const mapEntity = game.ecs.getEntity("map");
        mapEntity.Renderable.visible = false;
        let entities = game.ecs.queryEntities({
          has: ["menu", "gameplay", "crash"],
        });
        for (let entity of entities) {
          entity.Interactable.enabled = false;
        }
      },
      onpause: function() {
        let game = <Game>(<unknown>this);
        let { Renderable } = game.ecs.getEntity("map");

        let entities = game.ecs.queryEntities({
          has: ["menu", "gameplay", "paused"],
        });
        for (let entity of entities) {
          entity.Interactable.enabled = true;
        }

        Renderable.bgColor = "lightgray";
      },
      onleavepaused: function() {
        let game = <Game>(<unknown>this);
        let entities = game.ecs.queryEntities({
          has: ["menu", "gameplay", "paused"],
        });
        for (let entity of entities) {
          entity.Interactable.enabled = false;
        }
      },
      onresume: function() {
        let game = <Game>(<unknown>this);
        let { Renderable } = game.ecs.getEntity("map");

        let entities = game.ecs.queryEntities({
          has: ["menu", "gameplay", "paused"],
        });
        for (let entity of entities) {
          entity.Interactable.enabled = false;
        }
        Renderable.bgColor = "#81c76d";
        game.mapView = false;
      },
      onrestart: function() {
        let game = <Game>(<unknown>this);
        let entities = game.ecs.queryEntities({ has: ["menu", "gameplay"] });
        for (let entity of entities) {
          entity.Interactable.enabled = false;
        }
        game.publish("chooseDifficulty");
      },
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
        if (!mapEntity.has("Interactable")) {
          mapEntity.addComponent("Interactable", {
            enabled: true,
            onHover: function() {
              game.UICanvas.style.cursor = game.designModule.mapCursor;
            },
            onMouseDown: function() {
              game.designModule.editDesign();
            },
            onDrag: function() {
              game.designModule.editDesign();
            },
            onDragStart: function() {
              game.designModule.startDrawing();
            },
            onDragEnd: function() {
              game.designModule.stopDrawing();
            },
          });
        }
        let { x, y } = centerWithin(
          0,
          0,
          window.innerWidth,
          window.innerHeight,
          Renderable.renderW,
          Renderable.renderH
        );
        Coordinates.X = x;
        Coordinates.Y = y + y / 3;
        Renderable.visible = true;

        let entities = game.ecs.queryEntities({ has: ["menu", "design"] });
        for (let entity of entities) {
          entity.Interactable.enabled = true;
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
        let mapEntity = game.ecs.getEntity("map");
        if (!game.designModule.saved) {
          game.designModule.clearMap();
          game.designModule.saved = true;
        }
        let designMenuButtons = game.ecs.queryEntities({
          has: ["menu", "design"],
        });
        for (let entity of designMenuButtons) {
          entity.Interactable.enabled = false;
        }
        if (mapEntity.has("Interactable"))
          mapEntity.removeComponentByType("Interactable");
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
          entity.Interactable.enabled = false;
        }

        let mapEntity = game.ecs.getEntity("map");
        let { MapData, Renderable } = mapEntity;

        MapData.map = null;
        Renderable.visible = false;
      },
      onendOfGame: function() {
        let game = <Game>(<unknown>this);
        let { Renderable } = game.ecs.getEntity("map");
        console.log("YOU WON THE WHOLE GAME!");

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
          button.Interactable.enabled = true;
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
          entity.Interactable.enabled = false;
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
      onFocusSelector: function(selectorName: string, focusEntity: Entity) {
        let game = <Game>(<unknown>this);
        let selector = game.ecs.getEntity(`${selectorName}Selector`);
        selector.Selector.focusEntity = focusEntity;
      }
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
      {
        name: "focusSelector",
        action: function(selectorName: string, focusEntity: Entity) {
          let gmm = <GameModeMachine>(<unknown>this);
          gmm.customActions.onFocusSelector(selectorName, focusEntity);
        }
      }
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
      debugger;
    }

    return valid;
  }
}

export default GameModeMachine;
