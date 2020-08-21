import { calculateSurroundingSquareCount } from "../modules/gameMath";
enum Direction {
  UP = "up",
  DOWN = "down",
  LEFT = "left",
  RIGHT = "right",
}

export interface MapGridInterface {
  squares: SquareInterface[];
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
  generateTileMap: Function;
  get: Function;
  set: Function;
  findPath: Function;
}

export interface MapObjectInterface {
  squares: SquareInterface[];
  width: number;
  height: number;
  playerHome: number;
  bossHome: number;
  office: number;
  lights: { [key: string]: number };
  coffees: { [key: string]: boolean };
}

export interface SquareInterface {
  id: number;
  row: number;
  column: number;
  borders: BordersInterface;
  drivable: boolean;
  schoolZone: boolean;
  coordinates: Function;
  [key: string]: any;
}

type BordersInterface = {
  [direction in Direction]: SquareInterface | null;
};

type BordersCompressedInterface = {
  [direction in Direction]: number | null;
};

type Tile =
  | "street"
  | "tree"
  | "house"
  | "playerHome"
  | "bossHome"
  | "office"
  | "schoolZone"
  | "";

export class Square implements SquareInterface {
  public drivable: boolean;
  public borders: BordersInterface;
  public schoolZone: boolean;
  constructor(public id: number, public row: number, public column: number) {
    this.drivable = false;
    this.schoolZone = false;
    this.borders = { up: null, down: null, left: null, right: null };
  }

  coordinates(): { X: number; Y: number } {
    return { X: (this.column - 1) * 25, Y: (this.row - 1) * 25 };
  }
}


export class MapGrid implements MapGridInterface {
  public squareCount: number;
  public squares: SquareInterface[];
  public playerHome: number;
  public bossHome: number;
  public office: number;
  public lights: { [key: string]: number };
  public coffees: { [key: string]: boolean };
  public pixelHeight: number;
  public pixelWidth: number;

  static fromMapObject(mapObj: any): MapGrid {
    const {
      board_width,
      board_height,
      squares,
      player_home,
      boss_home,
      office,
      lights,
      coffees,
    } = mapObj;

    const newMap = new this(board_width, board_height);

    newMap.playerHome = player_home;
    newMap.bossHome = boss_home;
    newMap.office = office;
    newMap.lights = lights;
    newMap.coffees = coffees;

    let updateIndividualSquaresStart = window.performance.now();
    for (let i = 0; i < squares.length; i++) {
      newMap.squares[i].drivable = squares[i].drivable;
      newMap.squares[i].schoolZone = squares[i].schoolZone;
    }
    let updateIndividualSquaresEnd = window.performance.now();
    console.log(
      `UPDATING SQUARES WITH DRIVABLE/SCHOOLZONE PROPERTIES TOOK ${
        updateIndividualSquaresEnd - updateIndividualSquaresStart
      }ms`
    );
    return newMap;
  }

  constructor(public width: number, public height: number) {
    this.squares = [];
    this.squareCount = width * height;
    this.playerHome = 0;
    this.bossHome = 0;
    this.office = 0;
    this.lights = {};
    this.coffees = {};
    this.pixelWidth = this.width * 25;
    this.pixelHeight = this.height * 25;

    this.generateSquares();

    this.get = this.get.bind(this);
    this.set = this.set.bind(this);
    this.addBorders = this.addBorders.bind(this);
  }

  generateSquares() {
    for (let s = 1; s <= this.squareCount; s++) {
      this.squares.push(
        new Square(
          s,
          Math.ceil(s / this.width),
          Math.floor(s % this.width) > 0
            ? Math.floor(s % this.width)
            : this.width
        )
      );
    }

    this.squares.forEach((square) => {
      this.addBorders(square);
    });
  }

  addBorders(square: SquareInterface) {
    const id = square.id;

    if ((id - 1) % this.width !== 0) square.borders.left = this.squares[id - 2];

    if (id % this.width !== 0) square.borders.right = this.squares[id];

    if (id - this.width > 0)
      square.borders.up = this.squares[id - this.width - 1];

    if (id + this.width <= this.squareCount)
      square.borders.down = this.squares[id + this.width - 1];

    return square;
  }

  get(s: number): Square | null {
    if (!this.squares[s - 1]) {
      console.log("Invalid square id");
      return null;
    }
    //@ts-ignore
    return this.squares[s - 1];
  }

  set(s: number, key: string, val: any) {
    if (!this.squares[s - 1]) {
      console.log("Invalid square id");
      return undefined;
    }
    this.squares[s - 1][key] = val;
    return this.squares[s - 1];
  }

  generateTileMap(): Tile[] {
    return this.squares.map((s: SquareInterface) => {
      if (s.drivable) {
        if (s.schoolZone) return "schoolZone";
        if (this.playerHome === s.id) return "playerHome";
        if (this.bossHome === s.id) return "bossHome";
        if (this.office === s.id) return "office";
        return "street";
      }

      if (Math.random() < 0.4) return "tree";

      if (Math.random() < 0.3) {
        let valid = false;
        for (let border in s.borders) {
          if (
            //@ts-ignore
            s.borders[border] &&
            //@ts-ignore
            s.borders[border].drivable
          ) {
            valid = true;
            break;
          }
        }
        if (valid) return "house";
      }
      return "";
    });
  }

  getSquareByCoords(X: number, Y: number): Square | null {
    X = Math.floor(X / 25) * 25;
    Y = Math.floor(Y / 25) * 25;
    let row = Y / 25;
    let col = X / 25 + 1;
    let id = row * 40 + col;
    return this.get(id);
  }

  getSurroundingSquares(x: number, y: number, layers: number) {
    let startSquare: Square = <Square>(
      this.getSquareByCoords(x < 0 ? 0 : x, y < 0 ? 0 : y)
    );
    let queue = new PathQueue();
    let visited: { [key: string]: boolean } = {};
    let toInclude: Square[] = [];
    let sqCount = calculateSurroundingSquareCount(layers);
    let count = 0;

    queue.put(startSquare);
    visited[startSquare.id] = true;
    toInclude.push(startSquare);

    while (!queue.empty() && count < sqCount) {
      let currentId = queue.get();
      let currentSquare: Square = <Square>this.get(currentId);

      toInclude.push(currentSquare);

      for (let direction in currentSquare.borders) {
        let next = currentSquare.borders[<Direction>direction];
        if (next && !visited.hasOwnProperty(next.id)) {
          queue.put(next);
          visited[next.id] = true;
        }
      }
      count++;
    }
    // console.log(toInclude);
    return toInclude;
  }

  getAttributesByCoords(X: number, Y: number, attributes: string[]): any {
    let square = this.getSquareByCoords(X, Y);
    let attrVals: object = {};
    if (!square) {
      console.log("Invalid coordinates - no valid square at this location.");
      return null;
    }
    for (let attribute of attributes) {
      if (!square.hasOwnProperty(attribute)) {
        console.log(
          "Invalid attribute name. Accessible attributes are: ",
          ...Object.keys(square)
        );
        continue;
      }
      //@ts-ignore
      attrVals[attribute] = square[attribute];
    }
    if (Object.keys(attrVals).length === 0) return null;
    //@ts-ignore
    return square[attribute];
  }

  findPath(
    startX: number,
    startY: number,
    endX: number,
    endY: number
  ): Array<number>[] | null {
    let startSquare: Square = <Square>this.getSquareByCoords(startX, startY);
    let endSquare: Square = <Square>this.getSquareByCoords(endX, endY);

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

      let currentSquare: Square = <Square>this.squares[currentId - 1];

      if (currentId == endSquare.id) {
        foundTarget = true;
        break;
      }

      for (let direction in currentSquare.borders) {
        let next = currentSquare.borders[<Direction>direction];
        if (next && next.drivable && !cameFrom.hasOwnProperty(next.id)) {
          frontier.put(next);
          cameFrom[next.id] = currentId;
        }
      }
    }

    if (!foundTarget) {
      console.log(
        `No valid path from square ${startSquare.id} to square ${endSquare.id}`
      );
      return [[0, 0]];
    }

    let current = endSquare;
    //loop backwards through the path taken to reach the end and add to stack
    while (current.id !== startSquare.id) {
      let { X, Y } = current.coordinates();
      pathStack.push([X, Y]);
      // current.bossPath = true;
      current = <Square>this.get(cameFrom[current.id]);
    }
    pathStack.push([startX, startY]);
    return pathStack;
  }
}

class PathQueue {
  public front: number;
  public end: number;
  public size: number;
  public storage: { [key: string]: any };
  constructor() {
    this.front = 0;
    this.end = -1;
    this.storage = {};
    this.size = 0;
  }

  put(square: SquareInterface) {
    this.end++;
    this.size++;
    this.storage[this.end] = square.id;
  }

  get() {
    if (this.empty()) return null;

    let oldFront = this.front;
    let output = this.storage[oldFront];

    this.front++;
    delete this.storage[oldFront];
    this.size--;

    return output;
  }

  empty() {
    return this.front > this.end;
  }
}

export class DesignMapGrid extends MapGrid {
  constructor(width: number, height: number) {
    super(width, height);
  }

  generateTileMap() {
    return this.squares.map((s: SquareInterface) => {
      if (s.drivable) {
        if (s.schoolZone) return "schoolZone";
        if (this.playerHome === s.id) return "playerHome";
        if (this.bossHome === s.id) return "bossHome";
        if (this.office === s.id) return "office";
        return "street";
      }
      return "";
    });
  }

  handlePlayerHomeAction() {
    console.log("Adding player home");
  }
  handleBossHomeAction() {
    console.log("Adding boss home");
  }
  handleOfficeAction() {
    console.log("Adding office");
  }
  handleStreetAction() {
    console.log("Adding street");
  }
  handleSchoolZoneAction() {
    console.log("Adding school zone");
  }
  handleLightAction() {
    console.log("Adding light");
  }
  handleCoffeeAction() {
    console.log("Adding coffee");
  }
}

// export default MapGrid;
