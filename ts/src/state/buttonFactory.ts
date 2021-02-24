import { Entity } from "@fritzy/ecs";
import { Game } from "../main";
import { getLastCompletedLevel } from "./localDb";
import { small, regular } from "../modules/breakpoints";
import { noOp } from "gameHelpers";

export interface ButtonInterface {
  name: TButtonName;
  hasText: boolean;
  color?: TButtonColors;
  selectable: boolean;
  onClick: Function;
  tags: string[];
  [key: string]: any;
}

export type TDesignMenuName = "toolbar" | "admin" | "config";

const buttons: { [key: string]: ButtonInterface } = {
  playArcade: {
    name: "playArcade",
    hasText: true,
    color: "green",
    selectable: false,
    onClick: function(game: Game) {
      game.playMode = "arcade";
      if (game.lastCompletedLevel) window.toggleModal(true, "arcadeStart");
      else game.publish("start", game.firstLevel);
    },
    tags: ["menu", "main"],
  },
  playCustom: {
    name: "playCustom",
    hasText: true,
    color: "green",
    selectable: false,
    onClick: function(game: Game) {
      game.playMode = "custom";
      game.publish("loadSaved");
    },
    tags: ["menu", "main"],
  },
  nextLevel: {
    name: "nextLevel",
    hasText: true,
    color: "green",
    selectable: false,
    onClick: function(game: Game) {
      game.publish("nextLevel");
    },
    tags: ["menu", "gameplay", "won", "arcade"],
  },
  chooseMap: {
    name: "chooseMap",
    hasText: true,
    color: "green",
    selectable: false,
    onClick: function(game: Game) {
      game.publish("loadSaved");
    },
    tags: ["menu", "gameplay", "won", "lost", "crash", "custom"],
  },
  resume: {
    name: "resume",
    hasText: true,
    color: "green",
    selectable: false,
    onClick: function(game: Game) {
      game.publish("resume");
    },
    tags: ["menu", "gameplay", "paused"],
  },
  restart: {
    name: "restart",
    hasText: true,
    color: "yellow",
    selectable: false,
    onClick: function(game: Game) {
      game.publish("restart");
    },
    tags: [
      "menu",
      "gameplay",
      "paused",
      "won",
      "lost",
      "crash",
      "arcade",
      "custom",
      "testing",
    ],
  },
  quit: {
    name: "quit",
    hasText: true,
    color: "red",
    selectable: false,
    onClick: async function(game: Game) {
      try {
        let l = await getLastCompletedLevel();
        if (game.playMode === "arcade" && game.lastCompletedLevel > l) {
          window.toggleModal(true, "quitGameConfirmation");
        } else game.publish("quit");
      } catch (err) {
        console.error(err);
      }
    },
    tags: [
      "menu",
      "gameplay",
      "paused",
      "won",
      "lost",
      "crash",
      "arcade",
      "custom",
      "end",
    ],
  },
  design: {
    name: "design",
    hasText: true,
    color: "purple",
    selectable: false,
    onClick: function(game: Game) {
      game.publish("leaveMenu");
      game.publish("design");
    },
    tags: ["menu", "main"],
  },
  playerHome: {
    name: "playerHome",
    hasText: false,
    selectable: true,
    onMouseEnter: function(game: Game) {
      if (!this.has("Tooltip")) this.addComponent("Tooltip", { text: "Player Home (P)" });
    },
    onClick: function(game: Game) {
      game.publish("setDesignTool", "playerHome");
    },
    tags: ["menu", "design", "toolbar", "square"],
  },
  bossHome: {
    name: "bossHome",
    hasText: false,
    selectable: true,
    onMouseEnter: function(game: Game) {
      if (!this.has("Tooltip")) this.addComponent("Tooltip", { text: "Boss Home (B)" });
    },
    onClick: function(game: Game) {
      game.publish("setDesignTool", "bossHome");
    },
    tags: ["menu", "design", "toolbar", "square"],
  },
  office: {
    name: "office",
    hasText: false,
    selectable: true,
    onMouseEnter: function(game: Game) {
      if (!this.has("Tooltip")) this.addComponent("Tooltip", { text: "Office (O)" });
    },
    onClick: function(game: Game) {
      game.publish("setDesignTool", "office");
    },
    tags: ["menu", "design", "toolbar", "square"],
  },
  street: {
    name: "street",
    hasText: false,
    selectable: true,
    onMouseEnter: function(game: Game) {
      if (!this.has("Tooltip")) this.addComponent("Tooltip", { text: "Road (R)" });
    },
    onClick: function(game: Game) {
      game.publish("setDesignTool", "street");
    },
    tags: ["menu", "design", "toolbar", "square"],
  },
  light: {
    name: "light",
    hasText: false,
    selectable: true,
    onMouseEnter: function(game: Game) {
      if (!this.has("Tooltip")) this.addComponent("Tooltip", { text: "Stoplight (L)" });
    },
    onClick: function(game: Game) {
      game.publish("setDesignTool", "light");
    },
    tags: ["menu", "design", "toolbar", "square"],
  },
  schoolZone: {
    name: "schoolZone",
    hasText: false,
    selectable: true,
    onMouseEnter: function(game: Game) {
      if (!this.has("Tooltip")) this.addComponent("Tooltip", { text: "School Zone (Z)" });
    },
    onClick: function(game: Game) {
      game.publish("setDesignTool", "schoolZone");
    },
    tags: ["menu", "design", "toolbar", "square"],
  },
  coffee: {
    name: "coffee",
    hasText: false,
    selectable: true,
    onMouseEnter: function(game: Game) {
      if (!this.has("Tooltip")) this.addComponent("Tooltip", { text: "Coffee (C)" });
    },
    onClick: function(game: Game) {
      game.publish("setDesignTool", "coffee");
    },
    tags: ["menu", "design", "toolbar", "square"],
  },
  home: {
    name: "home",
    hasText: true,
    color: "purple",
    selectable: false,
    onClick: function(game: Game) {
      if (!game.designModule.saved) {
        window.toggleModal(true, "quitDesignConfirmation");
      } else game.publish("quit");
    },
    tags: ["menu", "design", "admin"],
  },
  loadSaved: {
    name: "loadSaved",
    hasText: true,
    color: "orange",
    selectable: false,
    onClick: function(game: Game) {
      game.publish("loadSaved");
    },
    tags: ["menu", "design", "admin"],
  },
  save: {
    name: "save",
    hasText: true,
    color: "orange",
    selectable: false,
    onClick: function(game: Game) {
      game.publish("save");
    },
    tags: ["menu", "design", "admin"],
  },
  saveAs: {
    name: "saveAs",
    hasText: true,
    color: "orange",
    selectable: false,
    onClick: function(game: Game) {
      game.publish("saveAs");
      //on failure, display failure message
    },
    tags: ["menu", "design", "admin"],
  },
  undo: {
    name: "undo",
    hasText: false,
    selectable: false,
    onMouseEnter: function(game: Game) {
      if (!this.has("Tooltip"))  this.addComponent("Tooltip", { text: "Undo\n(Ctrl + Z)" });
    },
    onClick: function(game: Game) {
      game.publish("undo");
    },
    tags: ["menu", "design", "config", "square"],
  },
  redo: {
    name: "redo",
    hasText: false,
    selectable: false,
    onMouseEnter: function(game: Game) {
      if (!this.has("Tooltip")) this.addComponent("Tooltip", { text: "Redo\n(Shift + Ctrl + Z)" });
    },
    onClick: function(game: Game) {
      game.publish("redo");
    },
    tags: ["menu", "design", "config", "square"],
  },
  erase: {
    name: "eraser",
    hasText: false,
    selectable: true,
    onMouseEnter: function(game: Game) {
      if (!this.has("Tooltip")) this.addComponent("Tooltip", { text: "Eraser (E)" });
    },
    onClick: function(game: Game) {
      game.publish("setDesignTool", "eraser");
    },
    tags: ["menu", "design", "toolbar", "square"],
  },
  reset: {
    name: "reset",
    hasText: false,
    selectable: false,
    onMouseEnter: function(game: Game) {
      if (!this.has("Tooltip")) this.addComponent("Tooltip", { text: "Reset Map" });
    },
    onClick: function(game: Game) {
      game.publish("resetMap");
    },
    tags: ["menu", "design", "config", "square"],
  },
  settings: {
    name: "settings",
    hasText: false,
    selectable: false,
    onMouseEnter: function(game: Game) {
      if (!this.has("Tooltip")) this.addComponent("Tooltip", { text: "Settings" });
    },
    onClick: function(game: Game) {
      window.toggleModal(true, "settings");
    },
    tags: ["menu", "main", "square"],
  },
  help: {
    name: "help",
    hasText: false,
    selectable: false,
    onMouseEnter: function(game: Game) {
      if (!this.has("Tooltip")) this.addComponent("Tooltip", { text: "Help" });
    },
    onClick: function(game: Game) {},
    tags: ["menu", "main", "square"],
  },
};

// export const menuButtons: { [key in TMenuName]: TButtonName[] } = {
export const menuButtons = {
  main: [
    ["playArcade", "playCustom", "design"],
    ["settings", "help"],
  ],
  won_arcade: ["nextLevel", "restart", "quit"],
  won_custom: ["chooseMap", "restart", "quit"],
  lost_arcade: ["restart", "quit"],
  lost_custom: ["chooseMap", "restart", "quit"],
  paused: ["resume", "restart", "quit"],
  crash_arcade: ["restart", "quit"],
  crash_custom: ["chooseMap", "restart", "quit"],
  end: ["quit"],
};

export const designMenuButtons = {
  admin: ["home", "loadSaved", "save", "saveAs"],
  toolbar: [
    "playerHome",
    "bossHome",
    "office",
    "street",
    "schoolZone",
    "light",
    "coffee",
    "eraser",
  ],
  config: [["undo", "redo"], "reset"],
};

function makeButtonEntities(game: Game) {
  for (let name in buttons) {
    let button = buttons[name];
    let sprite = game.spriteMap.getSprite(
      `${button.color ?? button.name}Button`
    );
    let textSprite;

    if (button.hasText) {
      textSprite = game.spriteMap.getSprite(`${button.name}ButtonText`);
    }

    let square = false;

    if (!sprite) return;
    if (button.tags.includes("square")) square = true;

    let entity = game.ecs.createEntity({
      id: `${button.name}Button`,
      tags: [...button.tags],
      Button: { name: button.name },
      Interactable: { enabled: false },
      Coordinates: {},
      Renderable: {
        spriteX: sprite.x,
        spriteY: sprite.y,
        spriteW: sprite.w,
        spriteH: sprite.h,
      },
      Breakpoint: [
        {
          name: "small",
          width: square ? small.buttonHeight : small.buttonWidth,
          height: small.buttonHeight,
        },
        {
          name: "regular",
          width: square ? regular.buttonHeight : regular.buttonWidth,
          height: regular.buttonHeight,
        },
      ],
    });

    entity.Interactable.onHover = function(game: Game) {
      game.UICanvas.style.cursor = "pointer";
    }.bind(entity, game);
    entity.Interactable.onMouseEnter =
      button.onMouseEnter?.bind(entity, game) ?? noOp;
    entity.Interactable.onMouseLeave = function(btnEntity: Entity) {
      if (btnEntity.has("Tooltip")) {
        btnEntity.Tooltip.fadeOut = true;
      }
    }.bind(entity, entity);
    entity.Interactable.onMouseDown = function(btnEntity: Entity) {
      btnEntity.Button.depressed = true;
    }.bind(entity, entity);
    entity.Interactable.onMouseUp = function(btnEntity: Entity) {
      btnEntity.Button.depressed = false;
    }.bind(entity, entity);
    entity.Interactable.onClick = function(game: Game) {
      button.onClick(game);
    }.bind(entity, game);

    if (textSprite) {
      let { x, y, w, h } = textSprite;
      entity.addComponent("Text", {
        textSpriteW: w,
        textSpriteH: h,
        textSpriteX: x,
        textSpriteY: y,
      });
    }
  }
  game.ecs.createEntity({
    id: "buttonSelector",
    Renderable: {},
    Coordinates: {},
    Selector: { gap: 15 },
  });
}

export default makeButtonEntities;
