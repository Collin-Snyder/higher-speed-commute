"use strict";
// import { Game } from "../main";
// import { toggleModal } from "../react/modalContainer";
// import { getLastCompletedLevel } from "./localDb";
// import { small, regular } from "../modules/breakpoints";
// export interface ButtonInterface {
//   name: string;
//   height: number;
//   width: number;
//   onClick: Function;
//   tags: string[];
//   [key: string]: any;
// }
// export type DesignMenuName = "toolbar" | "admin" | "config";
// export class MenuButtons {
//   static createEntities(game: any) {
//     const buttons = {
//       play: {
//         name: "playArcade",
//         onClick: function() {
//           // game.publish("leaveMenu");
//           game.playMode = "arcade";
//           if (game.lastCompletedLevel) window.toggleModal(true, "arcadeStart");
//           else game.publish("start", game.firstLevel);
//         },
//         height: 75,
//         width: 200,
//         tags: ["menu", "main"],
//       },
//       playCustom: {
//         name: "playCustom",
//         onClick: function() {
//           game.playMode = "custom";
//           game.publish("loadSaved");
//         },
//         height: 75,
//         width: 200,
//         tags: ["menu", "main"],
//       },
//       nextLevel: {
//         name: "nextLevel",
//         onClick: function() {
//           game.publish("nextLevel");
//         },
//         height: 75,
//         width: 200,
//         tags: ["menu", "gameplay", "won", "arcade"],
//       },
//       chooseMap: {
//         name: "chooseMap",
//         onClick: function() {
//           game.publish("loadSaved");
//         },
//         height: 75,
//         width: 200,
//         tags: ["menu", "gameplay", "won", "lost", "crash", "custom"],
//       },
//       resume: {
//         name: "resume",
//         onClick: function() {
//           game.publish("resume");
//         },
//         height: 75,
//         width: 200,
//         tags: ["menu", "gameplay", "paused"],
//       },
//       restart: {
//         name: "restart",
//         onClick: function() {
//           game.publish("restart");
//         },
//         height: 75,
//         width: 200,
//         tags: [
//           "menu",
//           "gameplay",
//           "paused",
//           "won",
//           "lost",
//           "crash",
//           "arcade",
//           "custom",
//           "testing",
//         ],
//       },
//       quit: {
//         name: "quit",
//         onClick: async function() {
//           try {
//             let l = await getLastCompletedLevel();
//             if (game.playMode === "arcade" && game.lastCompletedLevel > l) {
//               window.toggleModal(true, "quitGameConfirmation");
//             } else game.publish("quit");
//           } catch (err) {
//             console.error(err);
//           }
//         },
//         height: 75,
//         width: 200,
//         tags: [
//           "menu",
//           "gameplay",
//           "paused",
//           "won",
//           "lost",
//           "crash",
//           "arcade",
//           "custom",
//           "end",
//         ],
//       },
//       // backToDesign: {
//       //   name: "backToDesign",
//       //   onClick: function() {},
//       //   height: 75,
//       //   width: 200,
//       //   tags: ["menu", "gameplay", "paused", "won", "lost", "crash", "arcade", "custom"]
//       // },
//       design: {
//         name: "design",
//         onClick: function() {
//           game.publish("leaveMenu");
//           game.publish("design");
//         },
//         height: 75,
//         width: 200,
//         tags: ["menu", "main"],
//       },
//       playerHome: {
//         name: "playerHome",
//         onClick: function() {
//           game.publish("setDesignTool", "playerHome");
//         },
//         height: 75,
//         width: 75,
//         tags: ["menu", "design", "toolbar", "square"],
//       },
//       bossHome: {
//         name: "bossHome",
//         onClick: function() {
//           game.publish("setDesignTool", "bossHome");
//         },
//         height: 75,
//         width: 75,
//         tags: ["menu", "design", "toolbar", "square"],
//       },
//       office: {
//         name: "office",
//         onClick: function() {
//           game.publish("setDesignTool", "office");
//         },
//         height: 75,
//         width: 75,
//         tags: ["menu", "design", "toolbar", "square"],
//       },
//       street: {
//         name: "street",
//         onClick: function() {
//           game.publish("setDesignTool", "street");
//         },
//         height: 75,
//         width: 75,
//         tags: ["menu", "design", "toolbar", "square"],
//       },
//       light: {
//         name: "light",
//         onClick: function() {
//           game.publish("setDesignTool", "light");
//         },
//         height: 75,
//         width: 75,
//         tags: ["menu", "design", "toolbar", "square"],
//       },
//       schoolZone: {
//         name: "schoolZone",
//         onClick: function() {
//           game.publish("setDesignTool", "schoolZone");
//         },
//         height: 75,
//         width: 75,
//         tags: ["menu", "design", "toolbar", "square"],
//       },
//       coffee: {
//         name: "coffee",
//         onClick: function() {
//           game.publish("setDesignTool", "coffee");
//         },
//         height: 75,
//         width: 75,
//         tags: ["menu", "design", "toolbar", "square"],
//       },
//       home: {
//         name: "home",
//         onClick: function() {
//           if (!game.designModule.saved) {
//             window.toggleModal(true, "quitDesignConfirmation");
//           } else game.publish("quit");
//         },
//         height: 75,
//         width: 200,
//         tags: ["menu", "design", "admin"],
//       },
//       loadSaved: {
//         name: "loadSaved",
//         onClick: function() {
//           console.log("clicking loadSaved!");
//           game.publish("loadSaved");
//         },
//         width: 200,
//         height: 75,
//         tags: ["menu", "design", "admin"],
//       },
//       save: {
//         name: "save",
//         onClick: function() {
//           console.log("clicking save!");
//           game.publish("save");
//         },
//         height: 75,
//         width: 200,
//         tags: ["menu", "design", "admin"],
//       },
//       saveAs: {
//         name: "saveAs",
//         onClick: function() {
//           console.log("clicking saveAs!");
//           game.publish("saveAs");
//           //on failure, display failure message
//         },
//         height: 75,
//         width: 200,
//         tags: ["menu", "design", "admin"],
//       },
//       // test: {
//       //   name: "test",
//       //   onClick: function() {
//       //     console.log("you clicked test!");
//       //     game.playMode = "test";
//       //     game.publish("test");
//       //   },
//       //   height: 75,
//       //   width: 200,
//       //   tags: ["menu", "design", "admin"]
//       // },
//       // export: {
//       //   name: "export",
//       //   onClick: function() {
//       //     console.log("you clicked export!");
//       //   },
//       //   height: 75,
//       //   width: 200,
//       //   tags: ["menu", "design", "admin"]
//       // },
//       undo: {
//         name: "undo",
//         onClick: function() {
//           game.publish("undo");
//         },
//         height: 75,
//         width: 75,
//         tags: ["menu", "design", "config", "square"],
//       },
//       redo: {
//         name: "redo",
//         onClick: function() {
//           game.publish("redo");
//         },
//         height: 75,
//         width: 75,
//         tags: ["menu", "design", "config", "square"],
//       },
//       erase: {
//         name: "eraser",
//         onClick: function() {
//           game.publish("setDesignTool", "eraser");
//         },
//         height: 75,
//         width: 75,
//         tags: ["menu", "design", "config", "square"],
//       },
//       reset: {
//         name: "reset",
//         onClick: function() {
//           game.publish("resetMap");
//         },
//         height: 75,
//         width: 75,
//         tags: ["menu", "design", "config", "square"],
//       },
//       issues: {
//         name: "issues",
//         onClick: function() {},
//         height: 0,
//         width: 0,
//         tags: ["menu", "design", "config"],
//       },
//       overlays: {
//         name: "overlays",
//         onClick: function() {},
//         height: 0,
//         width: 0,
//         tags: ["menu", "design", "config"],
//       },
//       stoplights: {
//         name: "stoplights",
//         onClick: function() {},
//         height: 0,
//         width: 0,
//         tags: ["menu", "design", "config"],
//       },
//     };
//     // MenuButtons.bindButtons(buttons, game);
//     MenuButtons.createButtonEntities(buttons, game);
//   }
//   private static createButtonEntities(
//     buttons: { [key: string]: ButtonInterface },
//     game: Game
//   ) {
//     for (let name in buttons) {
//       let button = buttons[name];
//       let coords = game.spriteMap[
//         `${button.name}Button`
//       ];
//       let square = false;
//       if (!coords) return;
//       if (button.tags.includes("square")) square = true;
//       game.ecs.createEntity({
//         id: `${button.name}Button`,
//         tags: [...button.tags],
//         Button: { name: button.name },
//         Clickable: { onClick: button.onClick },
//         Coordinates: {},
//         Renderable: {
//           spriteX: coords.x,
//           spriteY: coords.y,
//           spriteW: button.width,
//           spriteH: button.height,
//           renderW: button.width,
//           renderH: button.height,
//         },
//         Breakpoint: [
//           {
//             name: "small",
//             width: square ? small.buttonHeight : small.buttonWidth,
//             height: small.buttonHeight,
//           },
//           {
//             name: "regular",
//             width: square ? regular.buttonHeight : regular.buttonWidth,
//             height: regular.buttonHeight,
//           },
//         ],
//       });
//     }
//   }
// }
