var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { getLastCompletedLevel } from "./localDb";
import { small, regular } from "../modules/breakpoints";
const buttons = {
    play: {
        name: "playArcade",
        hasText: true,
        color: "green",
        selectable: false,
        onClick: function () {
            const game = this;
            game.playMode = "arcade";
            if (game.lastCompletedLevel)
                window.toggleModal(true, "arcadeStart");
            else
                game.publish("start", game.firstLevel);
        },
        tags: ["menu", "main"],
    },
    playCustom: {
        name: "playCustom",
        hasText: true,
        color: "green",
        selectable: false,
        onClick: function () {
            const game = this;
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
        onClick: function () {
            const game = this;
            game.publish("nextLevel");
        },
        tags: ["menu", "gameplay", "won", "arcade"],
    },
    chooseMap: {
        name: "chooseMap",
        hasText: true,
        color: "green",
        selectable: false,
        onClick: function () {
            const game = this;
            game.publish("loadSaved");
        },
        tags: ["menu", "gameplay", "won", "lost", "crash", "custom"],
    },
    resume: {
        name: "resume",
        hasText: true,
        color: "green",
        selectable: false,
        onClick: function () {
            const game = this;
            game.publish("resume");
        },
        tags: ["menu", "gameplay", "paused"],
    },
    restart: {
        name: "restart",
        hasText: true,
        color: "yellow",
        selectable: false,
        onClick: function () {
            const game = this;
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
        onClick: function () {
            return __awaiter(this, void 0, void 0, function* () {
                const game = this;
                try {
                    let l = yield getLastCompletedLevel();
                    if (game.playMode === "arcade" && game.lastCompletedLevel > l) {
                        window.toggleModal(true, "quitGameConfirmation");
                    }
                    else
                        game.publish("quit");
                }
                catch (err) {
                    console.error(err);
                }
            });
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
        onClick: function () {
            const game = this;
            game.publish("leaveMenu");
            game.publish("design");
        },
        tags: ["menu", "main"],
    },
    playerHome: {
        name: "playerHome",
        hasText: false,
        selectable: true,
        onClick: function () {
            const game = this;
            game.publish("setDesignTool", "playerHome");
        },
        tags: ["menu", "design", "toolbar", "square"],
    },
    bossHome: {
        name: "bossHome",
        hasText: false,
        selectable: true,
        onClick: function () {
            const game = this;
            game.publish("setDesignTool", "bossHome");
        },
        tags: ["menu", "design", "toolbar", "square"],
    },
    office: {
        name: "office",
        hasText: false,
        selectable: true,
        onClick: function () {
            const game = this;
            game.publish("setDesignTool", "office");
        },
        tags: ["menu", "design", "toolbar", "square"],
    },
    street: {
        name: "street",
        hasText: false,
        selectable: true,
        onClick: function () {
            const game = this;
            game.publish("setDesignTool", "street");
        },
        tags: ["menu", "design", "toolbar", "square"],
    },
    light: {
        name: "light",
        hasText: false,
        selectable: true,
        onClick: function () {
            const game = this;
            game.publish("setDesignTool", "light");
        },
        tags: ["menu", "design", "toolbar", "square"],
    },
    schoolZone: {
        name: "schoolZone",
        hasText: false,
        selectable: true,
        onClick: function () {
            const game = this;
            game.publish("setDesignTool", "schoolZone");
        },
        tags: ["menu", "design", "toolbar", "square"],
    },
    coffee: {
        name: "coffee",
        hasText: false,
        selectable: true,
        onClick: function () {
            const game = this;
            game.publish("setDesignTool", "coffee");
        },
        tags: ["menu", "design", "toolbar", "square"],
    },
    home: {
        name: "home",
        hasText: true,
        color: "purple",
        selectable: false,
        onClick: function () {
            const game = this;
            if (!game.designModule.saved) {
                window.toggleModal(true, "quitDesignConfirmation");
            }
            else
                game.publish("quit");
        },
        tags: ["menu", "design", "admin"],
    },
    loadSaved: {
        name: "loadSaved",
        hasText: true,
        color: "orange",
        selectable: false,
        onClick: function () {
            const game = this;
            game.publish("loadSaved");
        },
        tags: ["menu", "design", "admin"],
    },
    save: {
        name: "save",
        hasText: true,
        color: "orange",
        selectable: false,
        onClick: function () {
            const game = this;
            game.publish("save");
        },
        tags: ["menu", "design", "admin"],
    },
    saveAs: {
        name: "saveAs",
        hasText: true,
        color: "orange",
        selectable: false,
        onClick: function () {
            const game = this;
            game.publish("saveAs");
            //on failure, display failure message
        },
        tags: ["menu", "design", "admin"],
    },
    undo: {
        name: "undo",
        hasText: false,
        selectable: false,
        onClick: function () {
            const game = this;
            game.publish("undo");
        },
        tags: ["menu", "design", "config", "square"],
    },
    redo: {
        name: "redo",
        hasText: false,
        selectable: false,
        onClick: function () {
            const game = this;
            game.publish("redo");
        },
        tags: ["menu", "design", "config", "square"],
    },
    erase: {
        name: "eraser",
        hasText: false,
        selectable: true,
        onClick: function () {
            const game = this;
            game.publish("setDesignTool", "eraser");
        },
        tags: ["menu", "design", "config", "square"],
    },
    reset: {
        name: "reset",
        hasText: false,
        selectable: false,
        onClick: function () {
            const game = this;
            game.publish("resetMap");
        },
        tags: ["menu", "design", "config", "square"],
    },
};
export function makeButtonEntities(game) {
    var _a;
    for (let name in buttons) {
        let button = buttons[name];
        let sprite = game.spriteMap[`${(_a = button.color) !== null && _a !== void 0 ? _a : button.name}Button`];
        let textSprite;
        if (button.hasText) {
            textSprite = game.spriteMap[`${button.name}ButtonText`];
        }
        // let coords = game.ecs.getEntity("global").Global.spriteMap[
        //   `${button.name}Button`
        // ];
        let square = false;
        if (!sprite)
            return;
        if (button.tags.includes("square"))
            square = true;
        let entity = game.ecs.createEntity({
            id: `${button.name}Button`,
            tags: [...button.tags, "NI"],
            Button: { name: button.name },
            Clickable: { onClick: button.onClick.bind(game) },
            Coordinates: {},
            Renderable: {
                spriteX: sprite.X,
                spriteY: sprite.Y,
                spriteWidth: sprite.width,
                spriteHeight: sprite.height,
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
        if (textSprite) {
            let { X, Y, width, height } = textSprite;
            entity.addComponent("Text", {
                textSpriteW: width,
                textSpriteH: height,
                textSpriteX: X,
                textSpriteY: Y,
            });
        }
    }
}
