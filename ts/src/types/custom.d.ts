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
    | "saveAs"
    | "settings"
    | "help";
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
  type TBorders = {
    [key in TDirection]: ISquare | null;
  };
  type TBordersCompressed = {
    [key in TDirection]: number | null;
  };
  type TDirection = "up" | "down" | "left" | "right";
  type TTile =
    | "street"
    | "tree"
    | "house"
    | "playerHome"
    | "bossHome"
    | "office"
    | "schoolZone"
    | "greenLight"
    | "coffee"
    | "background1"
    | "background2"
    | "smallObj1"
    | "smallObj2"
    | "smallObj3"
    | "smallObj4"
    | "medObj1"
    | "medObj2"
    | "tree1"
    | "tree2"
    | "tree3"
    | "";
  type TTerrainStyle = "default" | "desert" | "snow" | "underwater";
  type TBreakpoint = "small" | "regular";
  type TLightColor = "green" | "yellow" | "red";
  type TMode =
    | "init"
    | "menu"
    | "starting"
    | "loadLevel"
    | "chooseDifficulty"
    | "levelStartAnimation"
    | "playing"
    | "paused"
    | "won"
    | "lost"
    | "crash"
    | "designing"
    | "end";

  // game math //
  type TEntityArrayItem = Entity | Array<Entity>;
  type THorizontalAlignment = "left" | "right" | "center";
  type TVerticalAlignment = "top" | "bottom" | "spaceEvenly" | "spaceBetween";
  type THorizontalJustify = "left" | "right" | "spaceEvenly" | "spaceBetween";
  type TVerticalJustify = "top" | "bottom" | "center";
  type TCarColor =
    | "blue"
    | "green"
    | "yellow"
    | "orange"
    | "pink"
    | "white"
    | "purple"
    | "aqua"
    | "tan";

  ///// INTERFACES /////
  interface Window {
    toggleModal: Function;
    // recreateLocalDb: Function;
    // deleteUserMap: Function;
    // makeSeedData: Function;
    // updateLevelName: Function;
    // updateLevelDescription: Function;
    // getPlayerSpeedConstant: Function;
    // setStartingLevel: Function;
  }

  interface Number {
    times: (cb: (currentNum: number) => any, start: number) => void;
    between: (min: number, max: number, inclusive?: boolean) => boolean;
  }

  interface Array<T> {
    deepMap: (
      cb: (currentElement: any, i: number, currentArray: Array<any>) => any
    ) => Array<any>;
  }

  interface IVector {
    X: number;
    Y: number;
  }

  export interface IArcadeMap {
    squares: ISquare[];
    squareCount: number;
    width: number;
    height: number;
    playerHome: number;
    bossHome: number;
    office: number;
    lights: { [key: string]: number };
    coffees: { [key: string]: boolean };
    pixelWidth: number;
    pixelHeight: number;
    name?: string;
    id?: number;
    generateTileMap: Function;
    getSquare: Function;
    setSquare: Function;
    findPath: Function;
  }

  interface IMapObject {
    squares: ISquare[];
    boardWidth: number;
    boardHeight: number;
    playerHome: number;
    bossHome: number;
    office: number;
    lights: { [key: string]: number };
    coffees: { [key: string]: boolean };
    id: number;
    name: string;
  }

  interface IMiniMapObject {
    i: number;
    n: string;
    h: number;
    w: number;
    p: number;
    b: number;
    o: number;
    l: { [key: string]: number };
    c: number[];
    s: any[];
  }

  interface ISquare {
    id: number;
    row: number;
    column: number;
    borders: TBorders | TBordersCompressed;
    drivable: boolean;
    schoolZone: boolean;
    [key: string]: any;
  }

  interface ITile {
    type: TTile | TTile[];
    a: number;
    w: number;
    h: number;
    deg: number;
    display: boolean;
    [key: string]: any;
  }

  interface ISprite {
    x: number;
    y: number;
    w: number;
    h: number;
  }

  interface ILightStateInterface {
    on: { [action: string]: string };
    [prop: string]: any;
  }
}
