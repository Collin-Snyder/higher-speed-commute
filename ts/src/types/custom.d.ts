import { Entity } from "@fritzy/ecs";
import { Game } from "../main";

declare global {

  ///// TYPES /////
  type TEntityArrayItem = Entity | Array<Entity>;
  type THorizontalAlignment = "left" | "right" | "center";
  type TVerticalAlignment =
    | "top"
    | "bottom"
    | "spaceEvenly"
    | "spaceBetween";
  type THorizontalJustify =
    | "left"
    | "right"
    | "spaceEvenly"
    | "spaceBetween";
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

  interface IVector {
    X: number;
    Y: number;
  }
}
