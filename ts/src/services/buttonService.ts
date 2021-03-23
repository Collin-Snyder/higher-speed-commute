import ECS from "../ecsSetup/ecs";
import { Entity } from "@fritzy/ecs";
import { openModal, noOp } from "gameHelpers";
import Game from "../main";
import { getLastCompletedLevel } from "../localDb";
import {
  smallBreakpoint,
  regularBreakpoint,
} from "../staticData/breakpointData";

type TButtonStructureProperty =
  | "_wonMenuButtonStructure"
  | "_lostMenuButtonStructure"
  | "_crashMenuButtonStructure"
  | "_designMenuButtonStructure";

type TButtonNameOrButtonNameArray = TButtonName | TButtonName[];

type TButtonStructureCollection = {
  [key in TPlayMode | TDesignMenuName]?: TButtonNameOrButtonNameArray[];
};

class ButtonService {
  private _buttonDefinitions: { [key: string]: IButton };
  private _mainMenuButtonStructure: TButtonName[][];
  private _wonMenuButtonStructure: TButtonStructureCollection;
  private _lostMenuButtonStructure: TButtonStructureCollection;
  private _crashMenuButtonStructure: TButtonStructureCollection;
  private _pausedMenuButtonStructure: TButtonName[];
  private _endMenuButtonStructure: TButtonName[];
  private _designMenuButtonStructure: TButtonStructureCollection;
  private _mainMenuButtons: Entity[][];
  private _wonMenuButtons: { [key in TPlayMode]?: Entity[] };
  private _lostMenuButtons: { [key in TPlayMode]?: Entity[] };
  private _crashMenuButtons: { [key in TPlayMode]?: Entity[] };
  private _pausedMenuButtons: Entity[];
  private _endMenuButtons: Entity[];
  private _designMenuButtons: { [key in TDesignMenuName]?: Entity[] };
  private _entitiesPopulated: boolean;
  private activeButtons: Set<Entity>;

  constructor() {
    this._buttonDefinitions = {
      playArcade: {
        name: "playArcade",
        hasText: true,
        color: "green",
        selectable: false,
        onClick: function(game: Game) {
          game.playMode = "arcade";
          if (game.lastCompletedLevel || game.hasCompletedGame)
            openModal("arcadeStart");
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
              openModal("quitGameConfirmation");
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
          "completed",
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
          if (!this.has("Tooltip"))
            this.addComponent("Tooltip", { text: "Player Home (P)" });
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
          if (!this.has("Tooltip"))
            this.addComponent("Tooltip", { text: "Boss Home (B)" });
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
          if (!this.has("Tooltip"))
            this.addComponent("Tooltip", { text: "Office (O)" });
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
          if (!this.has("Tooltip"))
            this.addComponent("Tooltip", { text: "Road (R)" });
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
          if (!this.has("Tooltip"))
            this.addComponent("Tooltip", { text: "Stoplight (L)" });
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
          if (!this.has("Tooltip"))
            this.addComponent("Tooltip", { text: "School Zone (Z)" });
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
          if (!this.has("Tooltip"))
            this.addComponent("Tooltip", { text: "Coffee (C)" });
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
            openModal("quitDesignConfirmation");
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
          if (!this.has("Tooltip"))
            this.addComponent("Tooltip", { text: "Undo\n(Ctrl + Z)" });
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
          if (!this.has("Tooltip"))
            this.addComponent("Tooltip", { text: "Redo\n(Shift + Ctrl + Z)" });
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
          if (!this.has("Tooltip"))
            this.addComponent("Tooltip", { text: "Eraser (E)" });
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
          if (!this.has("Tooltip"))
            this.addComponent("Tooltip", { text: "Reset Map" });
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
          if (!this.has("Tooltip"))
            this.addComponent("Tooltip", { text: "Settings" });
        },
        onClick: function(game: Game) {
          openModal("settings");
        },
        tags: ["menu", "main", "square"],
      },
      help: {
        name: "help",
        hasText: false,
        selectable: false,
        onMouseEnter: function(game: Game) {
          if (!this.has("Tooltip"))
            this.addComponent("Tooltip", { text: "Help" });
        },
        onClick: function(game: Game) {
          openModal("rulesHelp");
        },
        tags: ["menu", "main", "square"],
      },
    };
    this._entitiesPopulated = false;
    this._mainMenuButtonStructure = [
      ["playArcade", "playCustom", "design"],
      ["settings", "help"],
    ];
    this._wonMenuButtonStructure = {
      arcade: ["nextLevel", "restart", "quit"],
      custom: ["chooseMap", "restart", "quit"],
      completed: ["chooseMap", "restart", "quit"],
    };
    this._lostMenuButtonStructure = {
      arcade: ["restart", "quit"],
      custom: ["chooseMap", "restart", "quit"],
      completed: ["chooseMap", "restart", "quit"],
    };
    this._crashMenuButtonStructure = {
      arcade: ["restart", "quit"],
      custom: ["chooseMap", "restart", "quit"],
      completed: ["chooseMap", "restart", "quit"],
    };
    this._pausedMenuButtonStructure = ["resume", "restart", "quit"];
    this._endMenuButtonStructure = ["quit"];
    this._designMenuButtonStructure = {
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

    this._mainMenuButtons = [];
    this._wonMenuButtons = {};
    this._lostMenuButtons = {};
    this._crashMenuButtons = {};
    this._pausedMenuButtons = [];
    this._endMenuButtons = [];
    this._designMenuButtons = {};

    this.activeButtons = new Set();
  }

  get _activeButtons() {
    return this.activeButtons;
  }

  set _activeButtons(val: Set<Entity>) {
    console.log("Setting active buttons to ", val);
    this.activeButtons = val;
  }

  private getButtonEntity(buttonName: TButtonName): Entity {
    let e = ECS.getEntity(`${buttonName}Button`);
    return e;
  }

  private mapButtonNamesToEntities() {
    this._mainMenuButtons = this._mainMenuButtonStructure.deepMap(
      this.getButtonEntity
    );
    this._wonMenuButtons = this.mapButtonNameCollectionToEntities("won");
    this._lostMenuButtons = this.mapButtonNameCollectionToEntities("lost");
    this._crashMenuButtons = this.mapButtonNameCollectionToEntities("crash");
    this._pausedMenuButtons = this._pausedMenuButtonStructure.deepMap(
      this.getButtonEntity
    );
    this._endMenuButtons = this._endMenuButtonStructure.deepMap(
      this.getButtonEntity
    );
    this._designMenuButtons = this.mapButtonNameCollectionToEntities("design");
    this._entitiesPopulated = true;
  }

  private mapButtonNameCollectionToEntities(
    collectionName: "won" | "lost" | "crash" | "design"
  ) {
    let entities: { [key in TPlayMode | TDesignMenuName]?: Entity[] } = {};
    let collectionPropertyName = `_${collectionName}MenuButtonStructure` as TButtonStructureProperty;
    let collection = this[collectionPropertyName] as TButtonStructureCollection;
    for (let key in collection) {
      let subCollectionName = key as TPlayMode | TDesignMenuName;
      let buttonNames = collection[subCollectionName] as TButtonName[];
      entities[subCollectionName] = buttonNames.deepMap(this.getButtonEntity);
    }
    return entities;
  }

  private enableButton = (b: Entity) => {
    b.Interactable.enabled = true;
    this._activeButtons.add(b);
  };

  getMainMenuButtons() {
    if (!this._entitiesPopulated) {
      console.error(new Error("Main menu button entities are not populated"));
      return [];
    }
    this._mainMenuButtons.deepEach(this.enableButton);
    return this._mainMenuButtons;
  }

  getWonMenuButtons(playMode: TPlayMode) {
    if (!this._entitiesPopulated) {
      console.error(new Error("Won menu button entities are not populated"));
      return [];
    }
    this._wonMenuButtons[playMode]?.forEach(this.enableButton);
    return this._wonMenuButtons[playMode];
  }

  getLostMenuButtons(playMode: TPlayMode) {
    if (!this._entitiesPopulated) {
      console.error(new Error("Lost menu button entities are not populated"));
      return [];
    }
    this._lostMenuButtons[playMode]?.forEach(this.enableButton);
    return this._lostMenuButtons[playMode];
  }

  getCrashMenuButtons(playMode: TPlayMode) {
    if (!this._entitiesPopulated) {
      console.error(new Error("Crash menu button entities are not populated"));
      return [];
    }
    this._crashMenuButtons[playMode]?.forEach(this.enableButton);
    return this._crashMenuButtons[playMode];
  }

  getPausedMenuButtons() {
    if (!this._entitiesPopulated) {
      console.error(new Error("Paused menu button entities are not populated"));
      return [];
    }
    this._pausedMenuButtons.forEach(this.enableButton);
    return this._pausedMenuButtons;
  }

  getEndMenuButtons() {
    if (!this._entitiesPopulated) {
      console.error(new Error("End menu button entities are not populated"));
      return [];
    }
    this._endMenuButtons.forEach(this.enableButton);
    return this._endMenuButtons;
  }

  getDesignMenuButtons(subMenu: TDesignMenuName) {
    if (!this._entitiesPopulated) {
      console.error(new Error("Design menu button entities are not populated"));
      return [];
    }
    this._designMenuButtons[subMenu]?.deepEach(this.enableButton);
    return this._designMenuButtons[subMenu];
  }

  disableActiveButtons() {
    this._activeButtons.forEach((b) => (b.Interactable.enabled = false));
    this._activeButtons.clear();
  }

  disableButton(b: Entity) {
    b.Interactable.enabled = false;
    this._activeButtons.delete(b);
  }

  createButtonEntities(game: Game) {
    for (let name in this._buttonDefinitions) {
      let button = this._buttonDefinitions[name];
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
            name: "smallBreakpoint",
            width: square
              ? smallBreakpoint.buttonHeight
              : smallBreakpoint.buttonWidth,
            height: smallBreakpoint.buttonHeight,
          },
          {
            name: "regularBreakpoint",
            width: square
              ? regularBreakpoint.buttonHeight
              : regularBreakpoint.buttonWidth,
            height: regularBreakpoint.buttonHeight,
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

    this.mapButtonNamesToEntities();
  }
}

export default new ButtonService();
