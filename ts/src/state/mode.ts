import { Entity } from "@fritzy/ecs";
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
  public actions: { [name: string]: Function };
  public events: EventInterface[];
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
    this.actions = {
      onready: function () {
        console.log("running onready");
        //@ts-ignore
        this.global.Global.mode = "menu";
      },
      onmenu: function () {
        //load menu
        let y = 125;
        //@ts-ignore
        for (let button of this.menuButtons.main) {
          //@ts-ignore
          let coords = this.ecs.getEntity("global").Global.spriteMap[
            `${button.name}Button`
          ];
          //@ts-ignore
          this.ecs.createEntity({
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
          });
          y += 125;
        }
        console.log("menu loaded");
      },
      onstart: function () {
        //load game canvas
        let gameCanvas = <HTMLCanvasElement>document.getElementById("game");
        if (gameCanvas) {
          gameCanvas.height = 625;
          gameCanvas.width = 1000;
        } else {
          console.log(`Error: no such canvas with id "game"`);
        }
        //play starting animations
      },
      onplay: function () {
        //@ts-ignore
        this.global.Global.mode = "playing";
      },
      onwin: function () {
        let [from, to] = [...arguments].slice(0, 2);
        // @ts-ignore
        let currentMode = this.global.Global.mode;
        if (currentMode !== from) {
          console.log(
            `Invalid state transition. "Win" event must transition from mode "playing", but mode is currently "${currentMode}"`
          );
          return;
        }
        console.log("YOU WIN!");
        this.current = to;
        //@ts-ignore
        this.global.Global.mode = to;
        //stop game music/animations
        //render win animation and gameover options

      },
      onlose: function () {
        let [from, to] = [...arguments].slice(0, 2);
        // @ts-ignore
        let currentMode = this.global.Global.mode;
        if (currentMode !== from) {
          console.log(
            `Invalid state transition. "Lose" event must transition from mode "playing", but mode is currently "${currentMode}"`
          );
          return;
        }
        console.log("YOU LOSE");
        this.current = to;
        //@ts-ignore
        this.global.Global.mode = to;
        //stop game music/animations
        //render lose animation and game over options
      },
      onpause: function () {
        //show paused menu
        //@ts-ignore
        this.global.Global.mode = "paused";
      },
      onresume: function () {
        //hide paused menu
      },
      ondesign: function () {
        //load design canvas
        //load design tools/ui
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
  }

  //   transition(action: Action) {
  //     this.current = <Mode>this.states[this.current].on[action];
  //   }
}

export enum EVENT {
  CRASH,
  CAFFEINATE,
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
