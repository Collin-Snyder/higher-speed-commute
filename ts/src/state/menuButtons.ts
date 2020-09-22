export interface ButtonInterface {
  name: string;
  height: number;
  width: number;
  onClick: Function;
  [key: string]: any;
}

export type DesignMenuName = "toolbar" | "admin" | "config";

export class MenuButtons {
  buttons: {
    [menu: string]:
      | Array<ButtonInterface>
      | { [submenu: string]: Array<ButtonInterface> };
  };
  constructor(game: any) {
    this.buttons = {
      main: [
        {
          name: "play",
          onClick: function () {
            let id = window.prompt("Please enter a level ID to play");
            if (id) {
              //@ts-ignore
              this.publish("leaveMenu");
              //@ts-ignore
              this.publish("start");
              //@ts-ignore
              this.publish("forceMouseUp");
              //@ts-ignore
              this.loadMap(id);
            }
          },
          height: 75,
          width: 200,
        },
        // {
        //   name: "design",
        //   onClick: function () {
        //     //@ts-ignore
        //     this.publish("leaveMenu");
        //     //@ts-ignore
        //     this.publish("design");
        //     //@ts-ignore
        //     this.publish("forceMouseUp");
        //   },
        //   height: 75,
        //   width: 200,
        // },
      ],
      paused: [
        {
          name: "resume",
          onClick: function () {
            //@ts-ignore
            this.publish("resume");
          },
          height: 0,
          width: 0,
        },
        { name: "restart", onClick: function () {}, height: 0, width: 0 },
        {
          name: "quit",
          onClick: function () {
            //@ts-ignore
            this.publish("quit");
          },
          height: 0,
          width: 0,
        },
      ],
      design: {
        toolbar: [
          {
            name: "playerHome",
            onClick: function () {
              this.publish("setDesignTool", "playerHome");
            },
            height: 75,
            width: 75,
          },
          {
            name: "bossHome",
            onClick: function () {
              this.publish("setDesignTool", "bossHome");
            },
            height: 75,
            width: 75,
          },
          {
            name: "office",
            onClick: function () {
              this.publish("setDesignTool", "office");
            },
            height: 75,
            width: 75,
          },
          {
            name: "street",
            onClick: function () {
              this.publish("setDesignTool", "street");
            },
            height: 75,
            width: 75,
          },
          {
            name: "light",
            onClick: function () {
              this.publish("setDesignTool", "light");
            },
            height: 75,
            width: 75,
          },
          {
            name: "schoolZone",
            onClick: function () {
              this.publish("setDesignTool", "schoolZone");
            },
            height: 75,
            width: 75,
          },
          {
            name: "coffee",
            onClick: function () {
              this.publish("setDesignTool", "coffee");
            },
            height: 75,
            width: 75,
          },
        ],
        admin: [
          {
            name: "home",
            onClick: function () {
              this.publish("leaveDesign");
              this.publish("forceMouseUp");
            },
            height: 75,
            width: 200,
          },
          {
            name: "save",
            onClick: function () {
              this.publish("save");
            },
            height: 75,
            width: 200,
          },
          {
            name: "saveAs",
            onClick: function () {
              this.publish("saveAs");
              this.publish("forceMouseUp");
              //on failure, display failure message
            },
            height: 75,
            width: 200,
          },
          {
            name: "loadSaved",
            onClick: function () {
              this.publish("loadSaved");
              this.publish("forceMouseUp");
            },
            width: 200,
            height: 75,
          },

          {
            name: "undo",
            onClick: function () {
              this.publish("undo");
            },
            height: 75,
            width: 75,
          },
          {
            name: "redo",
            onClick: function () {
              this.publish("redo");
            },
            height: 75,
            width: 75,
          },
          {
            name: "eraser",
            onClick: function () {
              this.publish("setDesignTool", "eraser");
            },
            height: 75,
            width: 75,
          },
          {
            name: "reset",
            onClick: function () {
              this.publish("resetMap");
              this.publish("forceMouseUp");
            },
            height: 75,
            width: 75,
          },
        ],
        config: [
          { name: "issues", onClick: function () {}, height: 0, width: 0 },
          { name: "overlays", onClick: function () {}, height: 0, width: 0 },
          { name: "stoplights", onClick: function () {}, height: 0, width: 0 },
          { name: "test", onClick: function () {}, height: 0, width: 0 },
        ],
      },
    };
    this.bindButtons(this.buttons, game);
  }

  bindButtons(buttons: any, game: any) {
    for (let group in buttons) {
      if (Array.isArray(buttons[group])) {
        for (let button of buttons[group].flat()) {
          button.onClick = button.onClick.bind(game);
        }
        continue;
      }
      if (!Array.isArray(buttons[group]) && typeof buttons[group] === "object")
        this.bindButtons(buttons[group], game);
    }
  }
}
