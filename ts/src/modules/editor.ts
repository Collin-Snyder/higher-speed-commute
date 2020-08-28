import { Game } from "../main";

interface CommandInterface {
  execute: Function;
  undo: Function;
}

interface HistoryInterface {
  name: string;
  args: any[];
}

class Editor {
  private _game: any;
  private _group: boolean;
  private _commands: { [key: string]: CommandInterface };
  private _history: HistoryInterface[][];
  private _current: number;
  private _currentActionGroup() {
    return this._history[this._current];
  }

  constructor(game: any) {
    this._game = game;
    this._commands = {};
    this._history = [];
    this._current = 0;
    this._group = false;
  }

  addCommand(name: string, command: CommandInterface) {
    command.execute = command.execute.bind(this._game);
    command.undo = command.undo.bind(this._game);
    this._commands[name] = command;
  }

  beginGroup() {
    //console.log("BEGINNING GROUP");
    if (this._group) {
      //console.log(
      //   "Cannot begin an action group because there is already an active group. End group with 'endGroup()' and try again."
      // );
      return false;
    }
    this._group = true;
    return true;
  }

  execute(name: string, ...args: any[]) {
    //console.log(`Executing command '${name}'`);
    const cmd = this._commands[name];
    cmd.execute(...args);
    if (this._history[this._current] === undefined) {
      this._history[this._current] = [];
    }
    this._history[this._current].push({ name, args });
  }

  endGroup() {
    //console.log("ENDING GROUP");
    if (!this._group) {
      //console.log(
      //   "Cannot end action group because there is no current active group. Did you forget to start an action group with 'beginGroup()'?"
      // );
      return false;
    }
    this._group = false;
    this._current++;
    this._history = this._history.slice(0, this._current);
    return true;
  }

  canUndo() {
    return this._current > 0;
  }

  canRedo() {
    return this._current < this._history.length;
  }

  undo() {
    if (!this.canUndo()) return false;
    this._current--;

    let group = this._currentActionGroup();
    for (let i = group.length - 1; i >= 0; i--) {
      let { name, args } = group[i];
      //console.log(`Undoing '${name}'`);
      this._commands[name].undo(...args);
    }

    return true;
  }

  redo() {
    if (!this.canRedo()) return false;

    for (let action of this._currentActionGroup()) {
      let { name, args } = action;
      //console.log(`Redoing '${name}'`);
      this._commands[name].execute(...args);
    }

    this._current++;
    return true;
  }

  restart() {
    this._history = [];
    this._current = 0;
  }

  usePrevGroup() {
    this._current--;
  }
}

const actions = {
  getMap: function () {
    let game = <Game>(<unknown>this);
    return game.ecs.getEntity("global").Global.map.Map.map;
  },
  makeDrivable: function (squareId: number) {
    let game = <Game>(<unknown>this);
    let map = game.ecs.getEntity("global").Global.map.Map.map;
    map.set(squareId, "drivable", true);
  },
  makeSchoolZone: function (squareId: number) {
    let game = <Game>(<unknown>this);
    let map = game.ecs.getEntity("global").Global.map.Map.map;
    map.set(squareId, "schoolZone", true);
  },
  addLight: function (squareId: number, timer: number) {
    let game = <Game>(<unknown>this);
    let map = game.ecs.getEntity("global").Global.map.Map.map;
    map.lights[squareId] = timer;
  },
  addCoffee: function (squareId: number) {
    let game = <Game>(<unknown>this);
    let map = game.ecs.getEntity("global").Global.map.Map.map;
    map.coffees[squareId] = true;
  },
  makeNotDrivable: function (squareId: number) {
    let game = <Game>(<unknown>this);
    let map = game.ecs.getEntity("global").Global.map.Map.map;
    map.set(squareId, "drivable", false);
  },
  makeNotSchoolZone: function (squareId: number) {
    let game = <Game>(<unknown>this);
    let map = game.ecs.getEntity("global").Global.map.Map.map;
    map.set(squareId, "schoolZone", false);
  },
  removeLight: function (squareId: number) {
    let game = <Game>(<unknown>this);
    let map = game.ecs.getEntity("global").Global.map.Map.map;
    delete map.lights[squareId];
  },
  removeCoffee: function (squareId: number) {
    let game = <Game>(<unknown>this);
    let map = game.ecs.getEntity("global").Global.map.Map.map;
    delete map.coffees[squareId];
  },
  makeKeySquare: function (squareId: number, keySquare: string) {
    //console.log(`Adding key square ${keySquare} to square ${squareId}`);
    let game = <Game>(<unknown>this);
    let map = game.ecs.getEntity("global").Global.map.Map.map;
    map[keySquare] = squareId;
  },
  removeKeySquare: function (squareId: number, keySquare: string) {
    //console.log(`Removing key square ${keySquare} from square ${squareId}`);
    let game = <Game>(<unknown>this);
    let map = game.ecs.getEntity("global").Global.map.Map.map;
    map[keySquare] = 0;
  },
};

export const commands: { [name: string]: CommandInterface } = {
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

export default Editor;
