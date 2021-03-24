export default class History {
  private _group: boolean;
  private _history: any[][];
  private _current: number;
  private _currentActionGroup() {
    return this._history[this._current];
  }

  constructor() {
    this._history = [];
    this._current = 0;
    this._group = false;
  }

  beginGroup() {
    if (this._group) {
      return false;
    }
    this._group = true;
    return true;
  }

  addAndExecute(execute: Function, undo: Function) {
    execute();
    if (this._history[this._current] === undefined) {
      this._history[this._current] = [];
    }
    this._history[this._current].push({ execute, undo });
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

  private canUndo() {
    return this._current > 0;
  }

  private canRedo() {
    return this._current < this._history.length;
  }

  undo() {
    if (!this.canUndo()) return false;
    this._current--;

    let group = this._currentActionGroup();
    for (let i = group.length - 1; i >= 0; i--) {
      let { undo } = group[i];
      undo();
    }

    return true;
  }

  redo() {
    if (!this.canRedo()) return false;

    for (let action of this._currentActionGroup()) {
      let { execute } = action;
      execute();
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
