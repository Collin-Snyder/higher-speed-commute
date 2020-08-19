interface ButtonInterface {
  name: string;
  height: number;
  width: number;
  onClick: Function;
  [key: string]: any;
}

export class MenuButtons {
  buttons: {
    [menu: string]:
      | ButtonInterface[]
      | { [submenu: string]: ButtonInterface[] };
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
              this.loadMap(id);
            }
          },
          height: 75,
          width: 200,
        },
        {
          name: "design",
          onClick: function () {
            //@ts-ignore
            this.publish("leaveMenu");
            //@ts-ignore
            this.publish("design");
          },
          height: 75,
          width: 200,
        },
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
              console.log("You clicked player home")
              //set selectedTool to "playerHome"
              //set draggable to false
            },
            height: 75,
            width: 75,
          },
          {
            name: "bossHome",
            onClick: function () {
              console.log("You clicked boss home")
              //set selectedTool to "bossHome"
              //set draggable to false
            },
            height: 75,
            width: 75,
          },
          {
            name: "office",
            onClick: function () {
              console.log("You clicked office")
              //set selectedTool to "office"
              //set draggable to false
            },
            height: 75,
            width: 75,
          },
          {
            name: "street",
            onClick: function () {
              console.log("You clicked street")
              //set selectedTool to "street"
              //set draggable to true
            },
            height: 75,
            width: 75,
          },
          {
            name: "light",
            onClick: function () {
              console.log("You clicked stoplight")
              //set selectedTool to "light"
              //set draggable to false
            },
            height: 75,
            width: 75,
          },
          {
            name: "schoolZone",
            onClick: function () {
              console.log("You clicked school zone")
              //set selectedTool to "schoolZone"
              //set draggable to true
            },
            height: 75,
            width: 75,
          },
          {
            name: "coffee",
            onClick: function () {
              console.log("You clicked coffee")
              //set selectedTool to "coffee"
              //set draggable to false
            },
            height: 75,
            width: 75,
          },
        ],
        admin: [
          {
            name: "home",
            onClick: function () {
              //publish a leaveDesign event
              //handle any saving that needs to happen
              //publish a quit event
            },
            height: 0,
            width: 0,
          },
          {
            name: "save",
            onClick: function () {
              //send ping to the server updating the level with new info by id
              //on success, change saved to true
              //on failure, display failure message
            },
            height: 0,
            width: 0,
          },
          {
            name: "saveAs",
            onClick: function () {
              //send ping to the server to create new level with current info
              //on success, change saved to true
              //on failure, display failure message
            },
            height: 0,
            width: 0,
          },
          {
            name: "erase",
            onClick: function () {
              //set selectedTool to "eraser"
              //set draggable to true
            },
            height: 0,
            width: 0,
          },
          {
            name: "undo",
            onClick: function () {
              //DESIGN MODE NEEDS A HISTORY STACK
              //set desired length of undo history (number of recent history items stored)
              //every action, calculate diff and store in stack
              //if stack is too big, chop the earliest entry off the bottom of stack
              //on undo, pop the most recent action off history stack and apply reversed diffs to state
            },
            height: 0,
            width: 0,
          },
          {
            name: "reset",
            onClick: function () {
              //confirm "Are you sure?"
              //restore default design state
            },
            height: 0,
            width: 0,
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
        for (let button of buttons[group]) {
          button.onClick = button.onClick.bind(game);
        }
        continue;
      }
      if (!Array.isArray(buttons[group]) && typeof buttons[group] === "object")
        this.bindButtons(buttons[group], game);
    }
  }
}
