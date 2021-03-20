import History from "./history";

export default class MapEditor implements IMapEditor {
  private _game: any;
  private _history: History;

  constructor(game: any) {
    this._game = game;
    this._history = new History();
  }

  get _map() {
    return this._game.ecs.getEntity("map").MapData.map;
  }

  private _makeDrivable(squareId: number) {
    this._map.setSquare(squareId, "drivable", true);
  }
  private _makeNotDrivable(squareId: number) {
    this._map.setSquare(squareId, "drivable", false);
  }
  private _makeSchoolZone(squareId: number) {
    this._map.setSquare(squareId, "schoolZone", true);
  }
  private _makeNotSchoolZone(squareId: number) {
    this._map.setSquare(squareId, "schoolZone", false);
  }
  private _addLight(squareId: number, timer: number) {
    this._map.lights[squareId] = timer;
  }
  private _removeLight(squareId: number) {
    delete this._map.lights[squareId];
  }
  private _addCoffee(squareId: number) {
    this._map.coffees[squareId] = true;
  }
  private _removeCoffee(squareId: number) {
    delete this._map.coffees[squareId];
  }
  private _makeKeySquare(keySquare: TKeySquare, squareId: number) {
    this._map[keySquare] = squareId;
  }
  private _removeKeySquare(keySquare: TKeySquare) {
    this._map[keySquare] = 0;
  }

  makeDrivable(squareId: number) {
    this._history.addAndExecute(
      this._makeDrivable.bind(this, squareId),
      this._makeNotDrivable.bind(this, squareId)
    );
  }
  makeSchoolZone(squareId: number) {
    this._history.addAndExecute(
      this._makeSchoolZone.bind(this, squareId),
      this._makeNotSchoolZone.bind(this, squareId)
    );
  }
  addLight(squareId: number, timer: number) {
    this._history.addAndExecute(
      this._addLight.bind(this, squareId, timer),
      this._removeLight.bind(this, squareId)
    );
  }
  addCoffee(squareId: number) {
    this._history.addAndExecute(
      this._addCoffee.bind(this, squareId),
      this._removeCoffee.bind(this, squareId)
    );
  }
  makeNotDrivable(squareId: number) {
    this._history.addAndExecute(
      this._makeNotDrivable.bind(this, squareId),
      this._makeDrivable.bind(this, squareId)
    );
  }
  makeNotSchoolZone(squareId: number) {
    this._history.addAndExecute(
      this._makeNotSchoolZone.bind(this, squareId),
      this._makeSchoolZone.bind(this, squareId)
    );
  }
  removeLight(squareId: number) {
    let timer = this._map.lights[squareId];
    this._history.addAndExecute(
      this._removeLight.bind(this, squareId),
      this._addLight.bind(this, squareId, timer)
    );
  }
  removeCoffee(squareId: number) {
    this._history.addAndExecute(
      this._removeCoffee.bind(this, squareId),
      this._addCoffee.bind(this, squareId)
    );
  }
  makeKeySquare(keySquare: TKeySquare, squareId: number) {
    this._history.addAndExecute(
      this._makeKeySquare.bind(this, keySquare, squareId),
      this._removeKeySquare.bind(this, keySquare)
    );
  }
  removeKeySquare(keySquare: TKeySquare) {
    let squareId = this._map[keySquare];
    this._history.addAndExecute(
      this._removeKeySquare.bind(this, keySquare),
      this._makeKeySquare.bind(this, keySquare, squareId)
    );
  }

  beginActionGroup() {
    this._history.beginGroup();
  }

  endActionGroup() {
      this._history.endGroup();
  }

  undo() {
    return this._history.undo();
  }

  redo() {
    this._history.redo();
  }

  restart() {
    this._history.restart();
  }

  usePrevGroup() {
    this._history.usePrevGroup();
  }
}
