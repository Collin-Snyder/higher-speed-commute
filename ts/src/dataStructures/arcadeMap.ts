import { calculateSurroundingSquareCount } from "gameMath";
import {
  SquareIdError,
  MapSquareAttributeError,
  PathError,
  CoordinatesError,
} from "customErrors";
import Square from "./mapSquare";
import PathQueue from "./pathQueue";
const { random, floor, ceil, round } = Math;

export default class ArcadeMap implements IArcadeMap {
  public squareCount: number;
  public squares: ISquare[];
  public _playerHome: number;
  public _bossHome: number;
  public _office: number;
  public lights: { [key: string]: number };
  public coffees: { [key: string]: boolean };
  public name: string;
  public id: number;

  static fromMapObject(mapObj: IMapObject): ArcadeMap {
    const {
      id,
      name,
      boardWidth,
      boardHeight,
      squares,
      playerHome,
      bossHome,
      office,
      lights,
      coffees,
    } = mapObj;

    const newMap = new this(boardWidth, boardHeight);

    newMap.id = id;
    newMap.name = name;
    newMap.playerHome = playerHome;
    newMap.bossHome = bossHome;
    newMap.office = office;
    newMap.lights = lights;
    newMap.coffees = coffees;

    for (let i = 0; i < squares.length; i++) {
      newMap.squares[i].drivable = squares[i].drivable;
      newMap.squares[i].schoolZone = squares[i].schoolZone;
    }
    return newMap;
  }

  static fromMiniMapObject(miniMapObj: IMiniMapObject): ArcadeMap {
    let { h, w, p, b, o, l, c, s } = miniMapObj;
    let coffees = <{ [key: string]: boolean }>{};
    c.forEach((id) => (coffees[id] = true));

    const newMap = new this(w, h);

    newMap.playerHome = p;
    newMap.bossHome = b;
    newMap.office = o;
    newMap.lights = l;
    newMap.coffees = coffees;

    s.forEach((s: any) => {
      let { i, d, z } = s;
      let id = Number(i);
      newMap.setSquare(id, "drivable", !!d);
      newMap.setSquare(id, "schoolZone", !!z);
    });

    return newMap;
  }

  constructor(public boardWidth: number, public boardHeight: number) {
    this.squares = [];
    this.squareCount = boardWidth * boardHeight;
    this._playerHome = 0;
    this._bossHome = 0;
    this._office = 0;
    this.lights = {};
    this.coffees = {};
    this.name = "";
    this.id = 0;

    this.generateSquares();

    this.getSquare = this.getSquare.bind(this);
    this.setSquare = this.setSquare.bind(this);
    this.addBorders = this.addBorders.bind(this);
  }

  get width() {
    return this.boardWidth;
  }

  get height() {
    return this.boardHeight;
  }

  get pixelWidth() {
    return this.width * 25;
  }

  get pixelHeight() {
    return this.height * 25;
  }

  get playerHome() {
    return this._playerHome;
  }

  set playerHome(val: number) {
    this._playerHome = val;
  }

  get bossHome() {
    return this._bossHome;
  }

  set bossHome(val: number) {
    this._bossHome = val;
  }

  get office() {
    return this._office;
  }

  set office(val: number) {
    this._office = val;
  }

  generateSquares() {
    for (let s = 1; s <= this.squareCount; s++) {
      this.squares.push(
        new Square(
          s,
          ceil(s / this.width),
          floor(s % this.width) > 0
            ? floor(s % this.width)
            : this.width
        )
      );
    }

    this.squares.forEach((square) => {
      this.addBorders(square);
    });
  }

  addBorders(square: ISquare) {
    const id = square.id;

    if ((id - 1) % this.width !== 0) square.borders.left = this.squares[id - 2];

    if (id % this.width !== 0) square.borders.right = this.squares[id];

    if (id - this.width > 0)
      square.borders.up = this.squares[id - this.width - 1];

    if (id + this.width <= this.squareCount)
      square.borders.down = this.squares[id + this.width - 1];

    return square;
  }

  getSquare(s: number): ISquare | null {
    if (!this.squares[s - 1]) {
      console.error(new SquareIdError(s));
      return null;
    }
    //@ts-ignore
    return this.squares[s - 1];
  }

  setSquare(s: number, key: string, val: any) {
    if (!this.squares[s - 1]) {
      console.error(new SquareIdError(s));
      return undefined;
    }
    this.squares[s - 1][key] = val;
    return this.squares[s - 1];
  }

  generateTileMap(isRefMap: boolean = false): ITile[] {
    return this.squares.map((s: ISquare) => {
      let type = <TTile>"";

      if (s.drivable) {
        if (s.schoolZone && !isRefMap) type = "schoolZone";
        else if (this.playerHome === s.id) type = "playerHome";
        else if (this.bossHome === s.id) type = "bossHome";
        else if (this.office === s.id) type = "office";
        else type = "street";
      } else if (!isRefMap) {
        if (random() < 0.4) {
          // @ts-ignore
          if (random() <= 0.07) type = "tree1";
          // @ts-ignore
          else type = "tree" + round(random() + 2);
        } else if (
          random() < 0.3 &&
          typeof s.borders.down != "number" &&
          s.borders.down?.drivable
        ) {
          type = "house";
        } else if (random() < 0.7) {
          if (random() < 0.8)
            //@ts-ignore
            type = "smallObj" + round(random() * 3 + 1);
          //@ts-ignore
          else type = "medObj" + round(random() + 1);
        }
      }

      return {
        id: s.id,
        type,
        a: 1,
        h: 25,
        w: 25,
        row: s.row,
        col: s.column,
        deg: 0,
        display: true,
      };
    });
  }

  generateReferenceTileMap(): TTile[] {
    return this.squares.map((s: ISquare) => {
      if (this.playerHome === s.id) return "playerHome";
      if (this.bossHome === s.id) return "bossHome";
      if (this.office === s.id) return "office";
      if (s.drivable) return "street";
      return "";
    });
  }

  getSquareByCoords(
    X: number,
    Y: number,
    squareSize: number = 25
  ): ISquare | null {
    X = floor(X / squareSize) * squareSize;
    Y = floor(Y / squareSize) * squareSize;
    let row = Y / squareSize;
    let col = X / squareSize + 1;
    let id = row * 40 + col;
    if (row > 25 || col > 40) return null;
    return this.getSquare(id);
  }

  getSurroundingSquares(x: number, y: number, layers: number) {
    let startSquare: ISquare = <ISquare>(
      this.getSquareByCoords(x < 0 ? 0 : x, y < 0 ? 0 : y)
    );
    let queue = new PathQueue();
    let visited: { [key: string]: boolean } = {};
    let toInclude: ISquare[] = [];
    let sqCount = calculateSurroundingSquareCount(layers);
    let count = 0;

    queue.put(startSquare);
    visited[startSquare.id] = true;
    toInclude.push(startSquare);

    while (!queue.empty() && count < sqCount) {
      let currentId = queue.get();
      let currentSquare: ISquare = <ISquare>this.getSquare(currentId);

      toInclude.push(currentSquare);

      for (let direction in currentSquare.borders) {
        let next = <ISquare>currentSquare.borders[<TDirection>direction];
        if (next && !visited.hasOwnProperty(next.id)) {
          queue.put(next);
          visited[next.id] = true;
        }
      }
      count++;
    }
    return toInclude;
  }

  getAttributesByCoords(X: number, Y: number, attributes: string[]): any {
    let square = this.getSquareByCoords(X, Y);
    let attrVals: object = {};
    if (!square) {
      console.error(new CoordinatesError(X, Y));
      return null;
    }
    for (let attribute of attributes) {
      if (!square.hasOwnProperty(attribute)) {
        console.error(new MapSquareAttributeError(attribute));
        continue;
      }
      //@ts-ignore
      attrVals[attribute] = square[attribute];
    }
    if (Object.keys(attrVals).length === 0) return null;
    //@ts-ignore
    return square[attribute];
  }

  getKeySquare(k: "playerHome" | "bossHome" | "office") {
    return this.getSquare(this[k]);
  }

  hasAllKeySquares() {
    return this.playerHome && this.bossHome && this.office;
  }

  findPath(
    startX: number,
    startY: number,
    endX: number,
    endY: number
  ): Array<number>[] | null {
    let startSquare = <ISquare>this.getSquareByCoords(startX, startY);
    let endSquare = <ISquare>this.getSquareByCoords(endX, endY);

    let frontier = new PathQueue();
    let cameFrom: { [key: string]: any } = {};
    let pathStack = [];
    let foundTarget = false;

    //start the queue with the starting square (start)
    frontier.put(startSquare);
    //assign start's "cameFrom" property to null
    cameFrom[startSquare.id] = null;

    //run a loop to expand the frontier in every direction on each iteration and break if end is reached
    while (frontier.empty() === false) {
      let currentId = frontier.get();

      let currentSquare = <ISquare>this.squares[currentId - 1];

      if (currentId == endSquare.id) {
        foundTarget = true;
        break;
      }

      for (let direction in currentSquare.borders) {
        let next = <ISquare>currentSquare.borders[<TDirection>direction];
        if (next && next.drivable && !cameFrom.hasOwnProperty(next.id)) {
          frontier.put(next);
          cameFrom[next.id] = currentId;
        }
      }
    }

    if (!foundTarget) {
      console.error(new PathError(startSquare.id, endSquare.id));
      return [[0, 0]];
    }

    let current = endSquare;
    //loop backwards through the path taken to reach the end and add to stack
    while (current.id !== startSquare.id) {
      let { X, Y } = current.coordinates;
      pathStack.push([X, Y]);
      // current.bossPath = true;
      current = <ISquare>this.getSquare(cameFrom[current.id]);
    }
    pathStack.push([startX, startY]);
    return pathStack;
  }
}
