import { Entity } from "@fritzy/ecs";
import { Game } from "../main";
import { findCenteredElementSpread } from "../modules/gameMath";
import { MapGrid, DesignMapGrid } from "./map";
import { Tool } from "../modules/designModule";
type Mode =
  | "init"
  | "menu"
  | "starting"
  | "playing"
  | "paused"
  | "won"
  | "lost"
  | "designing";

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
      onready: function () {
        let game = <Game>(<unknown>this);
        game.globalEntity.Global.mode = "menu";
      },
      onmenu: function () {
        let game = <Game>(<unknown>this);
        //load menu
        let y = 125;
        let buttons = [];
        //@ts-ignore
        for (let button of game.menuButtons.main) {
          //@ts-ignore
          let coords = game.ecs.getEntity("global").Global.spriteMap[
            `${button.name}Button`
          ];
          buttons.push(
            //@ts-ignore
            game.ecs.createEntity({
              id: `${button.name}Button`,
              Button: { name: button.name },
              Clickable: { onClick: button.onClick },
              Coordinates: {
                X: 500,
                Y: y,
              },
              Renderable: {
                spriteX: coords.X,
                spriteY: coords.Y,
                spriteWidth: button.width,
                spriteHeight: button.height,
                renderWidth: button.width,
                renderHeight: button.height,
              },
            })
          );
          y += 125;
        }
        for (let btn of buttons) {
          btn.addTag("menu");
          btn.addTag("main");
        }
        console.log("menu loaded");
      },
      onleaveMenu: function () {
        let game = <Game>(<unknown>this);
        let menuButtons = game.ecs.queryEntities({ has: ["menu", "main"] });
        for (let button of menuButtons) {
          button.destroy();
        }
      },
      onstart: function () {
        //load game canvas
        // let gameCanvas = <HTMLCanvasElement>document.getElementById("game");
        // if (gameCanvas) {
        //   gameCanvas.height = 0;
        //   gameCanvas.width = 0;
        // } else {
        //   console.log(`Error: no such canvas with id "game"`);
        // }
        //play starting animations
      },
      onplay: function () {
        let game = <Game>(<unknown>this);
        game.globalEntity.Global.mode = "playing";
      },
      onwin: function () {
        let game = <Game>(<unknown>this);
        let [from, to] = [...arguments].slice(0, 2);
        let currentMode = game.globalEntity.Global.mode;

        if (currentMode !== from) {
          console.log(
            `Invalid state transition. "Win" event must transition from mode "playing", but mode is currently "${currentMode}"`
          );
          return;
        }
        console.log("YOU WIN!");

        game.modeMachine.current = to;
        game.globalEntity.Global.mode = to;
        //stop game music/animations
        //render win animation and gameover options
      },
      onlose: function () {
        let game = <Game>(<unknown>this);
        let [from, to] = [...arguments].slice(0, 2);
        let currentMode = game.globalEntity.Global.mode;

        if (currentMode !== from) {
          console.log(
            `Invalid state transition. "Lose" event must transition from mode "playing", but mode is currently "${currentMode}"`
          );
          return;
        }
        console.log("YOU LOSE");

        game.modeMachine.current = to;
        game.globalEntity.Global.mode = to;
        //stop game music/animations
        //render lose animation and game over options
      },
      onpause: function () {
        //show paused menu
        let game = <Game>(<unknown>this);
        game.globalEntity.Global.mode = "paused";
      },
      onresume: function () {
        //hide paused menu
      },
      ondesign: function () {
        //load design canvas
        let game = <Game>(<unknown>this);
        // let gameCanvas = <HTMLCanvasElement>document.getElementById("game");
        let UICanvas = <HTMLCanvasElement>document.getElementById("ui");
        // if (gameCanvas) {
        //   gameCanvas.height = 625;
        //   gameCanvas.width = 1000;
        //   gameCanvas.style.cursor = "cell";
        //   console.log("canvas loaded");
        // } else {
        //   console.log(`Error: no such canvas with id "game"`);
        // }

        //create design entities
        let mapEntity = game.ecs.getEntity("map");
        let designMap = new DesignMapGrid(40, 25);

        mapEntity.Map.map = designMap;
        mapEntity.TileMap.tiles = designMap.generateTileMap();
        mapEntity.addComponent("Clickable", {
          onClick: function () {
            game.designModule.editDesign();
          },
        });

        //load toolbar buttons
        let buttons = [];

        for (let button of game.menuButtons.design.toolbar) {
          let coords = game.ecs.getEntity("global").Global.spriteMap[
            `${button.name}Button`
          ];
          buttons.push(
            game.ecs.createEntity({
              id: `${button.name}Button`,
              Button: { name: button.name },
              Clickable: { onClick: button.onClick },
              Coordinates: {},
              Renderable: {
                spriteX: coords.X,
                spriteY: coords.Y,
                spriteWidth: button.width,
                spriteHeight: button.height,
                renderWidth: button.width,
                renderHeight: button.height,
              },
            })
          );
        }
        let centeredX = findCenteredElementSpread(
          UICanvas.width,
          buttons[0].Renderable.renderWidth,
          buttons.length,
          "spaceEvenly",
          1000
        );
        let centeredY = findCenteredElementSpread(
          (UICanvas.height - designMap.pixelHeight) / 2,
          buttons[0].Renderable.renderHeight,
          1,
          "spaceEvenly"
        );
        let x = centeredX.start;
        for (let btn of buttons) {
          btn.Coordinates.Y = centeredY.start;
          btn.Coordinates.X = x;
          x += centeredX.step;
          btn.addTag("menu");
          btn.addTag("design");
          btn.addTag("toolbar");
        }
        console.log("toolbar loaded");

        //load admin menu buttons
        console.log("admin menu loaded");
        //load config menu buttons
        console.log("config menu loaded");

        game.globalEntity.Global.mode = "designing";
        //(eventually) if first time, play walk-through
      },
      onbeforeleaveDesign: function () {
        //if design state is unsaved, prompt to save
      },
      onbeforetest: function () {
        //check for map issues - i.e. no valid path for boss or player
        //if map issue present, prompt user to confirm
      },
      ontest: function () {
        //load current state of map into game as Map
        //do not save automatically
      },
      onbeforequit: function () {
        //if state is currently playing/paused, prompt "Are you sure you want to quit?"
      },
      onquit: function () {
        //hide game canvas
      },
    };
    this.customActions = {
      onSetDesignTool: function (tool: Tool) {
        console.log("TOOL: ", tool);
        let game = <Game>(<unknown>this);
        game.designModule.selectedTool = tool;
      },
    };
    this.events = [
      { name: "ready", from: "init", to: "menu" },
      { name: "start", from: ["menu", "won", "lost"], to: "starting" },
      { name: "play", from: "starting", to: "playing" },
      { name: "pause", from: ["playing", "starting"], to: "paused" },
      { name: "resume", from: "paused", to: "playing" },
      { name: "win", from: "playing", to: "won" },
      { name: "lose", from: "playing", to: "lost" },
      { name: "quit", from: ["playing", "paused", "won", "lost"], to: "menu" },
      { name: "design", from: "menu", to: "designing" },
      { name: "test", from: "designing", to: "starting" },
      { name: "leaveDesign", from: "designing", to: "menu" },
      { name: "leaveMenu", from: "menu", to: ["starting", "designing"] },
    ];
    this.customEvents = [
      { name: "crash", action: function () {} },
      { name: "caffeinate", action: function () {} },
      {
        name: "setDesignTool",
        action: function (tool: Tool) {
          let gmm = <GameModeMachine>(<unknown>this);
          gmm.customActions.onSetDesignTool(tool);
        },
      },
    ];
    for (let event of this.customEvents) {
      event.action = event.action.bind(this);
    }
  }
}

export enum EVENT {
  CRASH,
  CAFFEINATE,
  SETDESIGNTOOL,
}

class PubSub {
  static enable(target: any) {
    target.subscribe = function (event: any, callback: Function) {
      this.subscribers = this.subscribers || {};
      this.subscribers[event] = this.subscribers[event] || [];
      this.subscribers[event].push(callback);
    };

    target.publish = function (event: any) {
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