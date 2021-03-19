export default class MapEditorService {
  private _game: any;
  private _group: boolean;
  private _commands: { [key: string]: ICommand };
  private _history: IHistory[][];
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

  addCommand(name: string, command: ICommand) {
    command.execute = command.execute.bind(this._game, this._game);
    command.undo = command.undo.bind(this._game, this._game);
    this._commands[name] = command;
  }

  beginGroup() {
    if (this._group) {
      return false;
    }
    this._group = true;
    return true;
  }

  execute(name: string, ...args: any[]) {
    const cmd = this._commands[name];
    cmd.execute(...args);
    if (this._history[this._current] === undefined) {
      this._history[this._current] = [];
    }
    this._history[this._current].push({ name, args });
  }

  endGroup() {
    if (!this._group) {
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
      this._commands[name].undo(...args);
    }

    return true;
  }

  redo() {
    if (!this.canRedo()) return false;

    for (let action of this._currentActionGroup()) {
      let { name, args } = action;
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