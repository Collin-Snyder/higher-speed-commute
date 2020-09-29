import {Game} from "../main";

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
  static createEntities(game: any) {
    const buttons = {
      play: {
        name: "play",
        onClick: function() {
          game.publish("leaveMenu");
          game.publish("start");
        },
        height: 75,
        width: 200,
        tags: ["menu", "main"],
      },
      resume: {
        name: "resume",
        onClick: function() {
          game.publish("resume");
        },
        height: 75,
        width: 200,
        tags: ["menu", "gameplay", "paused"],
      },
      restart: {
        name: "restart",
        onClick: function() {
          game.publish("restart");
        },
        height: 75,
        width: 200,
        tags: ["menu", "gameplay", "paused", "won", "lost"],
      },
      quit: {
        name: "quit",
        onClick: function() {
          game.publish("quit");
        },
        height: 75,
        width: 200,
        tags: ["menu", "gameplay", "paused", "won", "lost"],
      },
      nextLevel: {
        name: "nextLevel",
        onClick: function() {
          game.publish("nextLevel");
        },
        height: 75,
        width: 200,
        tags: ["menu", "gameplay", "won"],
      },
      design: {
        name: "design",
        onClick: function() {
          game.publish("leaveMenu");
          game.publish("design");
          game.publish("forceMouseUp");
        },
        height: 75,
        width: 200,
        tags: ["menu", "main"],
      },
      playerHome: {
        name: "playerHome",
        onClick: function() {
          game.publish("setDesignTool", "playerHome");
        },
        height: 75,
        width: 75,
        tags: ["menu", "design", "toolbar"],
      },
      bossHome: {
        name: "bossHome",
        onClick: function() {
          game.publish("setDesignTool", "bossHome");
        },
        height: 75,
        width: 75,
        tags: ["menu", "design", "toolbar"],
      },
      office: {
        name: "office",
        onClick: function() {
          game.publish("setDesignTool", "office");
        },
        height: 75,
        width: 75,
        tags: ["menu", "design", "toolbar"],
      },
      street: {
        name: "street",
        onClick: function() {
          game.publish("setDesignTool", "street");
        },
        height: 75,
        width: 75,
        tags: ["menu", "design", "toolbar"],
      },
      light: {
        name: "light",
        onClick: function() {
          game.publish("setDesignTool", "light");
        },
        height: 75,
        width: 75,
        tags: ["menu", "design", "toolbar"],
      },
      schoolZone: {
        name: "schoolZone",
        onClick: function() {
          game.publish("setDesignTool", "schoolZone");
        },
        height: 75,
        width: 75,
        tags: ["menu", "design", "toolbar"],
      },
      coffee: {
        name: "coffee",
        onClick: function() {
          game.publish("setDesignTool", "coffee");
        },
        height: 75,
        width: 75,
        tags: ["menu", "design", "toolbar"],
      },
      home: {
        name: "home",
        onClick: function() {
          game.publish("leaveDesign");
          game.publish("forceMouseUp");
        },
        height: 75,
        width: 200,
        tags: ["menu", "design", "admin"],
      },
      save: {
        name: "save",
        onClick: function() {
          game.publish("save");
        },
        height: 75,
        width: 200,
        tags: ["menu", "design", "admin"],
      },
      saveAs: {
        name: "saveAs",
        onClick: function() {
          game.publish("saveAs");
          game.publish("forceMouseUp");
          //on failure, display failure message
        },
        height: 75,
        width: 200,
        tags: ["menu", "design", "admin"],
      },
      loadSaved: {
        name: "loadSaved",
        onClick: function() {
          game.publish("loadSaved");
          game.publish("forceMouseUp");
        },
        width: 200,
        height: 75,
        tags: ["menu", "design", "admin"],
      },

      undo: {
        name: "undo",
        onClick: function() {
          game.publish("undo");
        },
        height: 75,
        width: 75,
        tags: ["menu", "design", "admin"],
      },
      redo: {
        name: "redo",
        onClick: function() {
          game.publish("redo");
        },
        height: 75,
        width: 75,
        tags: ["menu", "design", "admin"],
      },
      erase: {
        name: "eraser",
        onClick: function() {
          game.publish("setDesignTool", "eraser");
        },
        height: 75,
        width: 75,
        tags: ["menu", "design", "admin"],
      },
      reset: {
        name: "reset",
        onClick: function() {
          game.publish("resetMap");
          game.publish("forceMouseUp");
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

    // MenuButtons.bindButtons(buttons, game);
    MenuButtons.createButtonEntities(buttons, game);
  }

  private static bindButtons(buttons: any, game: Game) {
    for (let button in buttons) {
      let b = buttons[button];
      b.onClick = b.onClick.bind(game);
    }
  }

  private static createButtonEntities(buttons: {[key: string]: ButtonInterface}, game: Game) {
    for (let name in buttons) {
      let button = buttons[name];
      let coords = game.ecs.getEntity("global").Global.spriteMap[
        `${button.name}Button`
      ];
  
      if (!coords) return;
  
      let entity = game.ecs.createEntity({
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
      });
  
      for (let tag of button.tags) {
        entity.addTag(tag);
      }
  
      entity.addTag("noninteractive");
    }
  }
}
