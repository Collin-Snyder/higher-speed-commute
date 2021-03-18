import Game from "../main";
import { SandboxMap } from "../state/map";
import { validateBaseEventTransition, openModal } from "gameHelpers";
import { centerWithin } from "gameMath";

export const baseEvents: IBaseEvent[] = [
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
      from: ["paused", "won", "lost", "crash", "designing", "end"],
      to: "menu",
    },
    { name: "design", from: "menu", to: "designing" },
    { name: "test", from: "designing", to: "starting" },
    { name: "endOfGame", from: ["playing", "won"], to: "end" },
  ];  

export const baseEventHandlers: { [name: string]: Function } = {
  validate: function(game: Game, eventName: string, from: TMode | TMode[]) {
    return validateBaseEventTransition(from, game.mode, eventName);
  },
  onmenu: function(game: Game) {
    if (game.mode !== "menu") return;
    game.playMode = "";

    let entities = game.ecs.queryEntities({ has: ["menu", "main"] });
    for (let entity of entities) {
      entity.Interactable.enabled = true;
    }
  },
  onleavemenu: function(game: Game) {
    let entities = game.ecs.queryEntities({ has: ["menu", "main"] });
    for (let entity of entities) {
      entity.Interactable.enabled = false;
    }
  },
  onstart: function(game: Game, level: number) {
    game.loadLevel(level);
  },
  onchooseDifficulty: function(game: Game) {
    let { Renderable } = game.ecs.getEntity("map");
    Renderable.visible = false;
    openModal("levelStart");
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
    // console.log("YOU WIN!");

    let currentLevel = game.currentLevel.number || 0;
    if (game.playMode === "arcade" && game.lastCompletedLevel < currentLevel)
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
    // console.log("CRASH! YOU LOSE BIG TIME");

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
    if (!game.difficulty || game.playMode === "custom")
      game.publish("chooseDifficulty");
    else game.publish("startingAnimation");
  },
  ondesign: function(game: Game) {
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
  },
  ondesigning: function(game: Game) {
    game.playMode = "";
  },
  onbeforeleaveDesign: function(game: Game) {
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
  onquit: function(game: Game) {
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
    // console.log("YOU WON THE WHOLE GAME!");

    Renderable.visible = false;

    let currentLevel = game.currentLevel.number || 0;
    if (game.playMode === "arcade" && game.lastCompletedLevel < currentLevel)
      game.lastCompletedLevel = currentLevel;
  },
};

