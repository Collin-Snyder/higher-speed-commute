export interface ButtonInterface {
  name: string;
  height: number;
  width: number;
  onClick: Function;
  tags: string[];
  [key: string]: any;
}

export type DesignMenuName = "toolbar" | "admin" | "config";

export class MenuButtons {
  menus: {
    [menu: string]:
      | Array<ButtonInterface>
      | { [submenu: string]: Array<ButtonInterface> };
  };
  buttons: {
    [name: string]: ButtonInterface;
  };
  constructor(game: any) {
    this.buttons = {
      play: {
        name: "play",
        onClick: function() {
          // let id = window.prompt("Please enter a level ID to play");
          // if (id) {
          //@ts-ignore
          this.publish("leaveMenu");
          //@ts-ignore
          this.publish("start");
          //@ts-ignore
          this.loadLevel(2);
          // }
        },
        height: 75,
        width: 200,
        tags: ["menu", "main"],
      },
      resume: {
        name: "resume",
        onClick: function() {
          this.publish("resume");
        },
        height: 75,
        width: 200,
        tags: ["menu", "gameplay", "paused"],
      },
      restart: {
        name: "restart",
        onClick: function() {
          this.publish("restart");
        },
        height: 75,
        width: 200,
        tags: ["menu", "gameplay", "paused", "won", "lost"],
      },
      quit: {
        name: "quit",
        onClick: function() {
          this.publish("quit");
        },
        height: 75,
        width: 200,
        tags: ["menu", "gameplay", "paused", "won", "lost"],
      },
      nextLevel: {
        name: "nextLevel",
        onClick: function() {
          this.publish("nextLevel");
        },
        height: 75,
        width: 200,
        tags: ["menu", "gameplay", "won"],
      },
      design: {
        name: "design",
        onClick: function() {
          //@ts-ignore
          this.publish("leaveMenu");
          //@ts-ignore
          this.publish("design");
          //@ts-ignore
          this.publish("forceMouseUp");
        },
        height: 75,
        width: 200,
        tags: ["menu", "main"],
      },
      playerHome: {
        name: "playerHome",
        onClick: function() {
          this.publish("setDesignTool", "playerHome");
        },
        height: 75,
        width: 75,
        tags: ["menu", "design", "toolbar"],
      },
      bossHome: {
        name: "bossHome",
        onClick: function() {
          this.publish("setDesignTool", "bossHome");
        },
        height: 75,
        width: 75,
        tags: ["menu", "design", "toolbar"],
      },
      office: {
        name: "office",
        onClick: function() {
          this.publish("setDesignTool", "office");
        },
        height: 75,
        width: 75,
        tags: ["menu", "design", "toolbar"],
      },
      street: {
        name: "street",
        onClick: function() {
          this.publish("setDesignTool", "street");
        },
        height: 75,
        width: 75,
        tags: ["menu", "design", "toolbar"],
      },
      light: {
        name: "light",
        onClick: function() {
          this.publish("setDesignTool", "light");
        },
        height: 75,
        width: 75,
        tags: ["menu", "design", "toolbar"],
      },
      schoolZone: {
        name: "schoolZone",
        onClick: function() {
          this.publish("setDesignTool", "schoolZone");
        },
        height: 75,
        width: 75,
        tags: ["menu", "design", "toolbar"],
      },
      coffee: {
        name: "coffee",
        onClick: function() {
          this.publish("setDesignTool", "coffee");
        },
        height: 75,
        width: 75,
        tags: ["menu", "design", "toolbar"],
      },
      home: {
        name: "home",
        onClick: function() {
          this.publish("leaveDesign");
          this.publish("forceMouseUp");
        },
        height: 75,
        width: 200,
        tags: ["menu", "design", "admin"],
      },
      save: {
        name: "save",
        onClick: function() {
          this.publish("save");
        },
        height: 75,
        width: 200,
        tags: ["menu", "design", "admin"],
      },
      saveAs: {
        name: "saveAs",
        onClick: function() {
          this.publish("saveAs");
          this.publish("forceMouseUp");
          //on failure, display failure message
        },
        height: 75,
        width: 200,
        tags: ["menu", "design", "admin"],
      },
      loadSaved: {
        name: "loadSaved",
        onClick: function() {
          this.publish("loadSaved");
          this.publish("forceMouseUp");
        },
        width: 200,
        height: 75,
        tags: ["menu", "design", "admin"],
      },

      undo: {
        name: "undo",
        onClick: function() {
          this.publish("undo");
        },
        height: 75,
        width: 75,
        tags: ["menu", "design", "admin"],
      },
      redo: {
        name: "redo",
        onClick: function() {
          this.publish("redo");
        },
        height: 75,
        width: 75,
        tags: ["menu", "design", "admin"],
      },
      erase: {
        name: "eraser",
        onClick: function() {
          this.publish("setDesignTool", "eraser");
        },
        height: 75,
        width: 75,
        tags: ["menu", "design", "admin"],
      },
      reset: {
        name: "reset",
        onClick: function() {
          this.publish("resetMap");
          this.publish("forceMouseUp");
        },
        height: 75,
        width: 75,
        tags: ["menu", "design", "admin"],
      },
      issues: {
        name: "issues",
        onClick: function() {},
        height: 0,
        width: 0,
        tags: ["menu", "design", "config"],
      },
      overlays: {
        name: "overlays",
        onClick: function() {},
        height: 0,
        width: 0,
        tags: ["menu", "design", "config"],
      },
      stoplights: {
        name: "stoplights",
        onClick: function() {},
        height: 0,
        width: 0,
        tags: ["menu", "design", "config"],
      },
      test: {
        name: "test",
        onClick: function() {},
        height: 0,
        width: 0,
        tags: ["menu", "design", "config"],
      },
    };

    this.menus = {
      main: [this.buttons.play, this.buttons.design],
      gameplay: {
        paused: [this.buttons.resume, this.buttons.restart, this.buttons.quit],
        won: [this.buttons.nextLevel, this.buttons.restart, this.buttons.quit],
        lost: [this.buttons.restart, this.buttons.quit],
      },
      design: {
        toolbar: [
          this.buttons.playerHome,
          this.buttons.bossHome,
          this.buttons.office,
          this.buttons.street,
          this.buttons.light,
          this.buttons.schoolZone,
          this.buttons.coffee,
        ],
        admin: [
          this.buttons.home,
          this.buttons.save,
          this.buttons.saveAs,
          this.buttons.loadSaved,
          this.buttons.undo,
          this.buttons.redo,
          this.buttons.eraser,
          this.buttons.reset,
        ],
        config: [
          this.buttons.issues,
          this.buttons.overlays,
          this.buttons.stoplight,
          this.buttons.test,
        ],
      },
    };
    this.bindButtons(this.buttons, game);
  }

  bindButtons(buttons: any, game: any) {
    for (let button in buttons) {
      let b = buttons[button];
      b.onClick = b.onClick.bind(game);
    }
    // for (let group in buttons) {
    //   if (Array.isArray(buttons[group])) {
    //     for (let button of buttons[group].flat()) {
    //       button.onClick = button.onClick.bind(game);
    //     }
    //     continue;
    //   }
    //   if (!Array.isArray(buttons[group]) && typeof buttons[group] === "object")
    //     this.bindButtons(buttons[group], game);
    // }
  }
}
