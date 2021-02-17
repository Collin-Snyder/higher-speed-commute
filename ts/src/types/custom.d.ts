import { Entity } from "@fritzy/ecs";
import { Game } from "../main";

declare global {
  ///// TYPES /////

  type TButtonName =
    | "playArcade"
    | "playCustom"
    | "design"
    | "nextLevel"
    | "chooseMap"
    | "resume"
    | "restart"
    | "quit"
    | "playerHome"
    | "bossHome"
    | "office"
    | "street"
    | "schoolZone"
    | "light"
    | "coffee"
    | "eraser"
    | "reset"
    | "undo"
    | "redo"
    | "home"
    | "loadSaved"
    | "save"
    | "saveAs";
  type TButtonColors = "green" | "red" | "yellow" | "purple" | "orange";
  type TMenuName =
    | "main"
    | "won_arcade"
    | "won_custom"
    | "lost_arcade"
    | "lost_custom"
    | "paused"
    | "crash_arcade"
    | "crash_custom"
    | "end";
  type TDesignMenuName = "toolbar" | "admin" | "config";
  type TPlayMode = "arcade" | "custom" | "testing" | "";

  // game math //
  type TEntityArrayItem = Entity | Array<Entity>;
  type THorizontalAlignment = "left" | "right" | "center";
  type TVerticalAlignment = "top" | "bottom" | "spaceEvenly" | "spaceBetween";
  type THorizontalJustify = "left" | "right" | "spaceEvenly" | "spaceBetween";
  type TVerticalJustify = "top" | "bottom" | "center";

  ///// INTERFACES /////
  interface Window {
    toggleModal: Function;
    game: Game;
    showAll: Function;
    deleteUserMap: Function;
    makeSeedData: Function;
    recreateLocalDb: Function;
    updateLevelName: Function;
    updateLevelDescription: Function;
  }

  interface Number {
    times: (cb: (currentNum: number) => any, start: number) => void;
  }

  interface Array<T> {
    deepMap: (cb: (currentElement: any, i: number, currentArray: Array<any>) => any) => Array<any>
  }

  interface IVector {
    X: number;
    Y: number;
  }
}
