import Game from "../main";

const actions = {
  makeDrivable: function(game: Game, squareId: number) {
    let { map } = game.ecs.getEntity("map").MapData;
    map.setSquare(squareId, "drivable", true);
  },
  makeSchoolZone: function(game: Game, squareId: number) {
    let { map } = game.ecs.getEntity("map").MapData;
    map.setSquare(squareId, "schoolZone", true);
  },
  addLight: function(game: Game, squareId: number, timer: number) {
    let { map } = game.ecs.getEntity("map").MapData;
    map.lights[squareId] = timer;
  },
  addCoffee: function(game: Game, squareId: number) {
    let { map } = game.ecs.getEntity("map").MapData;
    map.coffees[squareId] = true;
  },
  makeNotDrivable: function(game: Game, squareId: number) {
    let { map } = game.ecs.getEntity("map").MapData;
    map.setSquare(squareId, "drivable", false);
  },
  makeNotSchoolZone: function(game: Game, squareId: number) {
    let { map } = game.ecs.getEntity("map").MapData;
    map.setSquare(squareId, "schoolZone", false);
  },
  removeLight: function(game: Game, squareId: number) {
    let { map } = game.ecs.getEntity("map").MapData;
    delete map.lights[squareId];
  },
  removeCoffee: function(game: Game, squareId: number) {
    let { map } = game.ecs.getEntity("map").MapData;
    delete map.coffees[squareId];
  },
  makeKeySquare: function(game: Game, keySquare: string, squareId: number) {
    let { map } = game.ecs.getEntity("map").MapData;
    map[keySquare] = squareId;
  },
  removeKeySquare: function(game: Game, keySquare: string, squareId: number) {
    let { map } = game.ecs.getEntity("map").MapData;
    map[keySquare] = 0;
  },
};

const commands: { [name: string]: IEditorCommand } = {
  makeDrivable: {
    execute: actions.makeDrivable,
    undo: actions.makeNotDrivable,
  },
  makeSchoolZone: {
    execute: actions.makeSchoolZone,
    undo: actions.makeNotSchoolZone,
  },
  addLight: {
    execute: actions.addLight,
    undo: actions.removeLight,
  },
  addCoffee: {
    execute: actions.addCoffee,
    undo: actions.removeCoffee,
  },
  makeNotDrivable: {
    execute: actions.makeNotDrivable,
    undo: actions.makeDrivable,
  },
  makeNotSchoolZone: {
    execute: actions.makeNotSchoolZone,
    undo: actions.makeSchoolZone,
  },
  removeLight: {
    execute: actions.removeLight,
    undo: actions.addLight,
  },
  removeCoffee: {
    execute: actions.removeCoffee,
    undo: actions.addCoffee,
  },
  makeKeySquare: {
    execute: actions.makeKeySquare,
    undo: actions.removeKeySquare,
  },
  removeKeySquare: {
    execute: actions.removeKeySquare,
    undo: actions.makeKeySquare,
  },
};

export default commands;
