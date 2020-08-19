interface ButtonInterface {
  name: string;
  height: number;
  width: number;
  onClick: Function;
  [key: string]: any;
}

export class MenuButtons {
  buttons: { [menu: string]: ButtonInterface[] };
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
      paused: [],
      design: [],
    };

    for (let menu in this.buttons) {
      for (let button of this.buttons[menu]) {
        button.onClick = button.onClick.bind(game);
      }
    }
  }
}
