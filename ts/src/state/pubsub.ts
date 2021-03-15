import { Entity } from "@fritzy/ecs";
import { Game } from "../main";
import { centerWithin } from "gameMath";
import { SandboxMap } from "./map";
import { Tool } from "../modules/designModule";
import { updateLastCompletedLevel } from "./localDb";

interface EventInterface {
  name: string;
  from: TMode | TMode[];
  to: TMode;
  [key: string]: any;
}

class PubSub {
  public baseEventHandlers: { [name: string]: Function };
  public nonBaseEventHandlers: { [name: string]: Function };
  public baseEvents: EventInterface[];
  public nonBaseEvents: { name: string; action: Function }[];
  public current: TMode;

  constructor(initial: TMode) {
    this.current = initial;
    //all event handlers are this-bound to the game instance in main.ts
    this.baseEventHandlers = {
      validate: function(game: Game, eventName: string, from: TMode) {
        return PubSub.validateTransition(from, game.mode, eventName);
      },
      onmenu: function(game: Game) {
        if (game.mode !== "menu") return;
        game.playMode = "";

        let entities = game.ecs.queryEntities({ has: ["menu", "main"] });
        for (let entity of entities) {
          entity.Interactable.enabled = true;
        }
        console.log("menu loaded");
      },
      onleavemenu: function(game: Game) {
        let entities = game.ecs.queryEntities({ has: ["menu", "main"] });
        for (let entity of entities) {
          entity.Interactable.enabled = false;
        }
      },
      onstart: function(game: Game, level: number) {
        console.log("running onstart");
        game.loadLevel(level);
      },
      onchooseDifficulty: function(game: Game) {
        console.log("running onchooseDifficulty");
        let { Renderable } = game.ecs.getEntity("map");
        Renderable.visible = false;
        window.toggleModal(true, "levelStart");
      },
      onstartingAnimation: function(game: Game) {
        const { Renderable } = game.ecs.getEntity("map");
        game.ecs.runSystemGroup("map");
        game.currentZoom = 1;
        Renderable.bgColor = "#81c76d";
        Renderable.alpha = 0;
        Renderable.visible = true;
      },
      onplay: function(game: Game) {
        game.mapView = false;
        game.startRace();
      },
      onwin: function(game: Game) {
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
            Animation: {
              startSprite: game.spriteMap.getSprite("shine"),
              degStep: 1,
            },
            Renderable: {
              spriteX: x,
              spriteY: y,
            },
          });
        } else {
          graphic.Renderable.visible = true;
        }
      },
      onleavewon: function(game: Game) {
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
      onlose: function(game: Game) {
        console.log("YOU LOSE");
      },
      onleavelost: function(game: Game) {
        const mapEntity = game.ecs.getEntity("map");
        mapEntity.Renderable.visible = false;
        let entities = game.ecs.queryEntities({
          has: ["menu", "gameplay", "lost"],
        });
        for (let entity of entities) {
          entity.Interactable.enabled = false;
        }
      },
      oncrash: function(game: Game) {
        console.log("CRASH! YOU LOSE BIG TIME");

        let graphic = game.ecs.getEntity("crashGraphic");

        if (!graphic) {
          let { x, y } = <ISprite>game.spriteMap.getSprite("crashGraphic");
          graphic = game.ecs.createEntity({
            id: "crashGraphic",
            Coordinates: {},
            Animation: {
              startSprite: game.spriteMap.getSprite("badShine"),
              degStep: 1,
            },
            Renderable: {
              spriteX: x,
              spriteY: y,
            },
          });
        } else {
          graphic.Renderable.visible = true;
        }
      },
      onleavecrash: function(game: Game) {
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
      onpause: function(game: Game) {
        let { Renderable } = game.ecs.getEntity("map");

        let entities = game.ecs.queryEntities({
          has: ["menu", "gameplay", "paused"],
        });
        for (let entity of entities) {
          entity.Interactable.enabled = true;
        }

        Renderable.bgColor = "lightgray";
      },
      onleavepaused: function(game: Game) {
        let entities = game.ecs.queryEntities({
          has: ["menu", "gameplay", "paused"],
        });
        for (let entity of entities) {
          entity.Interactable.enabled = false;
        }
      },
      onresume: function(game: Game) {
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
      onrestart: function(game: Game) {
        let entities = game.ecs.queryEntities({ has: ["menu", "gameplay"] });
        for (let entity of entities) {
          entity.Interactable.enabled = false;
        }
        game.publish("chooseDifficulty");
      },
      ondesign: function(game: Game) {
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
              game.designModule.setMapCursor();
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
      ondesigning: function(game: Game) {
        game.playMode = "";
      },
      onbeforeleaveDesign: function(game: Game) {
        //if design state is unsaved, prompt to save

        if (!game.designModule.saved) {
          game.designModule.confirmUnsaved();
        }
      },
      onleavedesigning: function(game: Game) {
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
      onbeforetest: function(game: Game) {
        //check for map issues - i.e. no valid path for boss or player
        //if map issue present, prompt user to confirm
      },
      ontest: function(game: Game) {
        //load current state of map into game as ArcadeMap
        //do not save automatically

        game.testCurrentSandboxMap();
      },
      onbeforequit: function(game: Game) {
        //if state is currently playing/paused, prompt "Are you sure you want to quit?"
      },
      onquit: function(game: Game) {
        //hide game canvas

        game.playMode = "";
        game.difficulty = "";

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
      onendOfGame: function(game: Game) {
        let { Renderable } = game.ecs.getEntity("map");
        console.log("YOU WON THE WHOLE GAME!");

        Renderable.visible = false;
      },
    };
    this.nonBaseEventHandlers = {
      onRaceFinished: function(game: Game, outcome: "won" | "lost" | "crash") {
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
      onNextLevel: function(game: Game) {
        let next = game.currentLevel.number ? game.currentLevel.number + 1 : 1;

        let entities = game.ecs.queryEntities({ has: ["menu", "gameplay"] });
        for (let entity of entities) {
          entity.Interactable.enabled = false;
        }

        if (next > game.arcadeLevels) game.publish("endOfGame");
        else game.publish("start", next);
      },
      onSaveProgress: function(game: Game) {
        updateLastCompletedLevel(game.lastCompletedLevel).catch((err) =>
          console.error(err)
        );
      },
      onSetDesignTool: function(game: Game, tool: Tool) {
        game.designModule.setDesignTool(tool);
      },
      onSave: function(game: Game) {
        game.designModule.save();
      },
      onSaveAs: function(game: Game) {
        game.designModule.openSaveAsModal();
      },
      onLoadSaved: function(game: Game) {
        game.designModule.openLoadSavedModal();
      },
      onUndo: function(game: Game) {
        game.designModule.undo();
      },
      onRedo: function(game: Game) {
        game.designModule.redo();
      },
      onResetMap: function(game: Game) {
        game.designModule.openResetModal();
      },
      onCaffeinate: function(game: Game, driver: Entity, coffee: Entity) {
        coffee.removeComponentByType("Renderable");
        coffee.removeComponentByType("Collision");
        driver.addComponent("CaffeineBoost", coffee.Caffeine);

        if (driver.id === "player") {
          let coffeeId = coffee.id.match(/\d+/g);
          if (coffeeId && coffeeId[0])
            game.currentRace?.logCoffee(Number(coffeeId[0]));
        }
      },
      onRedLight: function(game: Game, driver: Entity, light: Entity) {
        if (driver.id === "player") {
          game.currentRace?.logRedLight(light);
        }
      },
      onFocusSelector: function(
        game: Game,
        selectorName: string,
        focusEntity: Entity
      ) {
        let selector = game.ecs.getEntity(`${selectorName}Selector`);
        selector.Selector.focusEntity = focusEntity;
      },
    };
    this.baseEvents = [
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
        from: ["chooseDifficulty", "loadLevel"],
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
    this.nonBaseEvents = [
      {
        name: "raceFinished",
        action: function(outcome: "won" | "lost" | "crash") {
          let pubsub = <PubSub>(<unknown>this);
          pubsub.nonBaseEventHandlers.onRaceFinished(outcome);
        },
      },
      {
        name: "nextLevel",
        action: function() {
          let pubsub = <PubSub>(<unknown>this);
          pubsub.nonBaseEventHandlers.onNextLevel();
        },
      },
      {
        name: "saveProgress",
        action: function() {
          let pubsub = <PubSub>(<unknown>this);
          pubsub.nonBaseEventHandlers.onSaveProgress();
        },
      },
      {
        name: "redLight",
        action: function(driver: Entity, light: Entity) {
          let pubsub = <PubSub>(<unknown>this);
          pubsub.nonBaseEventHandlers.onRedLight(driver, light);
        },
      },
      {
        name: "caffeinate",
        action: function(driver: Entity, coffee: Entity) {
          let pubsub = <PubSub>(<unknown>this);
          pubsub.nonBaseEventHandlers.onCaffeinate(driver, coffee);
        },
      },
      {
        name: "setDesignTool",
        action: function(tool: Tool) {
          let pubsub = <PubSub>(<unknown>this);
          pubsub.nonBaseEventHandlers.onSetDesignTool(tool);
        },
      },
      {
        name: "save",
        action: function() {
          let pubsub = <PubSub>(<unknown>this);
          pubsub.nonBaseEventHandlers.onSave();
        },
      },
      {
        name: "saveAs",
        action: function() {
          let pubsub = <PubSub>(<unknown>this);
          pubsub.nonBaseEventHandlers.onSaveAs();
        },
      },
      {
        name: "loadSaved",
        action: function() {
          let pubsub = <PubSub>(<unknown>this);
          pubsub.nonBaseEventHandlers.onLoadSaved();
        },
      },
      {
        name: "undo",
        action: function() {
          let pubsub = <PubSub>(<unknown>this);
          pubsub.nonBaseEventHandlers.onUndo();
        },
      },
      {
        name: "redo",
        action: function() {
          let pubsub = <PubSub>(<unknown>this);
          pubsub.nonBaseEventHandlers.onRedo();
        },
      },
      {
        name: "resetMap",
        action: function() {
          let pubsub = <PubSub>(<unknown>this);
          pubsub.nonBaseEventHandlers.onResetMap();
        },
      },
      {
        name: "focusSelector",
        action: function(selectorName: string, focusEntity: Entity) {
          let pubsub = <PubSub>(<unknown>this);
          pubsub.nonBaseEventHandlers.onFocusSelector(
            selectorName,
            focusEntity
          );
        },
      },
    ];
    for (let event of this.nonBaseEvents) {
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

export default PubSub;
