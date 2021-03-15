import { centerWithin } from "gameMath";
import { SandboxMap } from "./map";
import { updateLastCompletedLevel } from "./localDb";
class PubSub {
    constructor(initial) {
        this.current = initial;
        //all event handlers are this-bound to the game instance in main.ts
        this.baseEventHandlers = {
            validate: function (game, eventName, from) {
                return PubSub.validateTransition(from, game.mode, eventName);
            },
            onmenu: function (game) {
                if (game.mode !== "menu")
                    return;
                game.playMode = "";
                let entities = game.ecs.queryEntities({ has: ["menu", "main"] });
                for (let entity of entities) {
                    entity.Interactable.enabled = true;
                }
                console.log("menu loaded");
            },
            onleavemenu: function (game) {
                let entities = game.ecs.queryEntities({ has: ["menu", "main"] });
                for (let entity of entities) {
                    entity.Interactable.enabled = false;
                }
            },
            onstart: function (game, level) {
                console.log("running onstart");
                game.loadLevel(level);
            },
            onchooseDifficulty: function (game) {
                console.log("running onchooseDifficulty");
                let { Renderable } = game.ecs.getEntity("map");
                Renderable.visible = false;
                window.toggleModal(true, "levelStart");
            },
            onstartingAnimation: function (game) {
                const { Renderable } = game.ecs.getEntity("map");
                game.ecs.runSystemGroup("map");
                game.currentZoom = 1;
                Renderable.bgColor = "#81c76d";
                Renderable.alpha = 0;
                Renderable.visible = true;
            },
            onplay: function (game) {
                game.mapView = false;
                game.startRace();
            },
            onwin: function (game) {
                console.log("YOU WIN!");
                let currentLevel = game.currentLevel.number || 0;
                if (game.playMode === "arcade" &&
                    game.lastCompletedLevel < currentLevel)
                    game.lastCompletedLevel = currentLevel;
                let graphic = game.ecs.getEntity("wonGraphic");
                if (!graphic) {
                    let { x, y } = game.spriteMap.getSprite("wonGraphic");
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
                }
                else {
                    graphic.Renderable.visible = true;
                }
            },
            onleavewon: function (game) {
                const wonGraphic = game.ecs.getEntity("wonGraphic");
                if (wonGraphic)
                    wonGraphic.Renderable.visible = false;
                const mapEntity = game.ecs.getEntity("map");
                mapEntity.Renderable.visible = false;
                let entities = game.ecs.queryEntities({
                    has: ["menu", "gameplay", "won"],
                });
                for (let entity of entities) {
                    entity.Interactable.enabled = false;
                }
            },
            onlose: function (game) {
                console.log("YOU LOSE");
            },
            onleavelost: function (game) {
                const mapEntity = game.ecs.getEntity("map");
                mapEntity.Renderable.visible = false;
                let entities = game.ecs.queryEntities({
                    has: ["menu", "gameplay", "lost"],
                });
                for (let entity of entities) {
                    entity.Interactable.enabled = false;
                }
            },
            oncrash: function (game) {
                console.log("CRASH! YOU LOSE BIG TIME");
                let graphic = game.ecs.getEntity("crashGraphic");
                if (!graphic) {
                    let { x, y } = game.spriteMap.getSprite("crashGraphic");
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
                }
                else {
                    graphic.Renderable.visible = true;
                }
            },
            onleavecrash: function (game) {
                const crashGraphic = game.ecs.getEntity("crashGraphic");
                if (crashGraphic)
                    crashGraphic.Renderable.visible = false;
                const mapEntity = game.ecs.getEntity("map");
                mapEntity.Renderable.visible = false;
                let entities = game.ecs.queryEntities({
                    has: ["menu", "gameplay", "crash"],
                });
                for (let entity of entities) {
                    entity.Interactable.enabled = false;
                }
            },
            onpause: function (game) {
                let { Renderable } = game.ecs.getEntity("map");
                let entities = game.ecs.queryEntities({
                    has: ["menu", "gameplay", "paused"],
                });
                for (let entity of entities) {
                    entity.Interactable.enabled = true;
                }
                Renderable.bgColor = "lightgray";
            },
            onleavepaused: function (game) {
                let entities = game.ecs.queryEntities({
                    has: ["menu", "gameplay", "paused"],
                });
                for (let entity of entities) {
                    entity.Interactable.enabled = false;
                }
            },
            onresume: function (game) {
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
            onrestart: function (game) {
                let entities = game.ecs.queryEntities({ has: ["menu", "gameplay"] });
                for (let entity of entities) {
                    entity.Interactable.enabled = false;
                }
                game.publish("chooseDifficulty");
            },
            ondesign: function (game) {
                let UICanvas = document.getElementById("ui");
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
                        onHover: function () {
                            game.designModule.setMapCursor();
                            game.UICanvas.style.cursor = game.designModule.mapCursor;
                        },
                        onMouseDown: function () {
                            game.designModule.editDesign();
                        },
                        onDrag: function () {
                            game.designModule.editDesign();
                        },
                        onDragStart: function () {
                            game.designModule.startDrawing();
                        },
                        onDragEnd: function () {
                            game.designModule.stopDrawing();
                        },
                    });
                }
                let { x, y } = centerWithin(0, 0, window.innerWidth, window.innerHeight, Renderable.renderW, Renderable.renderH);
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
            ondesigning: function (game) {
                game.playMode = "";
            },
            onbeforeleaveDesign: function (game) {
                //if design state is unsaved, prompt to save
                if (!game.designModule.saved) {
                    game.designModule.confirmUnsaved();
                }
            },
            onleavedesigning: function (game) {
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
            onbeforetest: function (game) {
                //check for map issues - i.e. no valid path for boss or player
                //if map issue present, prompt user to confirm
            },
            ontest: function (game) {
                //load current state of map into game as ArcadeMap
                //do not save automatically
                game.testCurrentSandboxMap();
            },
            onbeforequit: function (game) {
                //if state is currently playing/paused, prompt "Are you sure you want to quit?"
            },
            onquit: function (game) {
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
            onendOfGame: function (game) {
                let { Renderable } = game.ecs.getEntity("map");
                console.log("YOU WON THE WHOLE GAME!");
                Renderable.visible = false;
            },
        };
        this.nonBaseEventHandlers = {
            onRaceFinished: function (game, outcome) {
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
                if (game.recordRaceData)
                    game.saveRaceData(outcome);
                //fire outcome-specific event
                if (outcome === "won")
                    game.publish("win");
                if (outcome === "lost")
                    game.publish("lose");
                if (outcome === "crash")
                    game.publish("crash");
            },
            onNextLevel: function (game) {
                let next = game.currentLevel.number ? game.currentLevel.number + 1 : 1;
                let entities = game.ecs.queryEntities({ has: ["menu", "gameplay"] });
                for (let entity of entities) {
                    entity.Interactable.enabled = false;
                }
                if (next > game.arcadeLevels)
                    game.publish("endOfGame");
                else
                    game.publish("start", next);
            },
            onSaveProgress: function (game) {
                updateLastCompletedLevel(game.lastCompletedLevel).catch((err) => console.error(err));
            },
            onSetDesignTool: function (game, tool) {
                game.designModule.setDesignTool(tool);
            },
            onSave: function (game) {
                game.designModule.save();
            },
            onSaveAs: function (game) {
                game.designModule.openSaveAsModal();
            },
            onLoadSaved: function (game) {
                game.designModule.openLoadSavedModal();
            },
            onUndo: function (game) {
                game.designModule.undo();
            },
            onRedo: function (game) {
                game.designModule.redo();
            },
            onResetMap: function (game) {
                game.designModule.openResetModal();
            },
            onCaffeinate: function (game, driver, coffee) {
                var _a;
                coffee.removeComponentByType("Renderable");
                coffee.removeComponentByType("Collision");
                driver.addComponent("CaffeineBoost", coffee.Caffeine);
                if (driver.id === "player") {
                    let coffeeId = coffee.id.match(/\d+/g);
                    if (coffeeId && coffeeId[0])
                        (_a = game.currentRace) === null || _a === void 0 ? void 0 : _a.logCoffee(Number(coffeeId[0]));
                }
            },
            onRedLight: function (game, driver, light) {
                var _a;
                if (driver.id === "player") {
                    (_a = game.currentRace) === null || _a === void 0 ? void 0 : _a.logRedLight(light);
                }
            },
            onFocusSelector: function (game, selectorName, focusEntity) {
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
                action: function (outcome) {
                    let pubsub = this;
                    pubsub.nonBaseEventHandlers.onRaceFinished(outcome);
                },
            },
            {
                name: "nextLevel",
                action: function () {
                    let pubsub = this;
                    pubsub.nonBaseEventHandlers.onNextLevel();
                },
            },
            {
                name: "saveProgress",
                action: function () {
                    let pubsub = this;
                    pubsub.nonBaseEventHandlers.onSaveProgress();
                },
            },
            {
                name: "redLight",
                action: function (driver, light) {
                    let pubsub = this;
                    pubsub.nonBaseEventHandlers.onRedLight(driver, light);
                },
            },
            {
                name: "caffeinate",
                action: function (driver, coffee) {
                    let pubsub = this;
                    pubsub.nonBaseEventHandlers.onCaffeinate(driver, coffee);
                },
            },
            {
                name: "setDesignTool",
                action: function (tool) {
                    let pubsub = this;
                    pubsub.nonBaseEventHandlers.onSetDesignTool(tool);
                },
            },
            {
                name: "save",
                action: function () {
                    let pubsub = this;
                    pubsub.nonBaseEventHandlers.onSave();
                },
            },
            {
                name: "saveAs",
                action: function () {
                    let pubsub = this;
                    pubsub.nonBaseEventHandlers.onSaveAs();
                },
            },
            {
                name: "loadSaved",
                action: function () {
                    let pubsub = this;
                    pubsub.nonBaseEventHandlers.onLoadSaved();
                },
            },
            {
                name: "undo",
                action: function () {
                    let pubsub = this;
                    pubsub.nonBaseEventHandlers.onUndo();
                },
            },
            {
                name: "redo",
                action: function () {
                    let pubsub = this;
                    pubsub.nonBaseEventHandlers.onRedo();
                },
            },
            {
                name: "resetMap",
                action: function () {
                    let pubsub = this;
                    pubsub.nonBaseEventHandlers.onResetMap();
                },
            },
            {
                name: "focusSelector",
                action: function (selectorName, focusEntity) {
                    let pubsub = this;
                    pubsub.nonBaseEventHandlers.onFocusSelector(selectorName, focusEntity);
                },
            },
        ];
        for (let event of this.nonBaseEvents) {
            event.action = event.action.bind(this);
        }
    }
    static validateTransition(from, current, event) {
        let valid = true;
        if (Array.isArray(from)) {
            if (!from.includes(current))
                valid = false;
        }
        else if (current !== from)
            valid = false;
        if (!valid) {
            console.log(`Attempted invalid state transition - ${event} event must transition from mode "${from}", but mode is currently "${current}"`);
            debugger;
        }
        return valid;
    }
}
export default PubSub;
