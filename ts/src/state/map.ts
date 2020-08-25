import {
  calculateSurroundingSquareCount,
  randomNumBtwn,
} from "../modules/gameMath";
import Commander from "../modules/commander";

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
  [key: string]: any;
}

type BordersInterface = {
  [key in Direction]: SquareInterface | null;
};

type BordersCompressedInterface = {
  [key in Direction]: number | null;
};

type Direction = "up" | "down" | "left" | "right";

type Tile =
  | "street"
  | "tree"
  | "house"
  | "playerHome"
  | "bossHome"
  | "office"
  | "schoolZone"
  | "greenLight"
  | "coffee"
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

  get(s: number): SquareInterface | null {
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

  generateTileMap(): (Tile | Tile[])[] {
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

  getSquareByCoords(X: number, Y: number): SquareInterface | null {
    X = Math.floor(X / 25) * 25;
    Y = Math.floor(Y / 25) * 25;
    let row = Y / 25;
    let col = X / 25 + 1;
    let id = row * 40 + col;
    return this.get(id);
  }

  getSurroundingSquares(x: number, y: number, layers: number) {
    let startSquare: SquareInterface = <SquareInterface>(
      this.getSquareByCoords(x < 0 ? 0 : x, y < 0 ? 0 : y)
    );
    let queue = new PathQueue();
    let visited: { [key: string]: boolean } = {};
    let toInclude: SquareInterface[] = [];
    let sqCount = calculateSurroundingSquareCount(layers);
    let count = 0;

    queue.put(startSquare);
    visited[startSquare.id] = true;
    toInclude.push(startSquare);

    while (!queue.empty() && count < sqCount) {
      let currentId = queue.get();
      let currentSquare: SquareInterface = <SquareInterface>this.get(currentId);

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
    let startSquare: SquareInterface = <SquareInterface>(
      this.getSquareByCoords(startX, startY)
    );
    let endSquare: SquareInterface = <SquareInterface>(
      this.getSquareByCoords(endX, endY)
    );

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

      let currentSquare: SquareInterface = <SquareInterface>(
        this.squares[currentId - 1]
      );

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
      current = <SquareInterface>this.get(cameFrom[current.id]);
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

  generateTileMap(): (Tile | Tile[])[] {
    return this.squares.map((s: SquareInterface) => this.determineTileValue(s.id));
  }

  tileIndex(id: number): number {
    return id - 1;
  }

  isKeySquare(id: number): boolean {
    return this.playerHome == id || this.bossHome == id || this.office == id;
  }

  determineTileValue = (id: number): Tile | Tile[] => {

    let square = <Square>this.get(id);
    if (square.drivable) {
      if (this.playerHome === square.id) return "playerHome";
      if (this.bossHome === square.id) return "bossHome";
      if (this.office === square.id) return "office";

      let tiles: Tile[] = [];

      if (square.schoolZone) tiles.push("schoolZone");
      else tiles.push("street");

      if (this.lights.hasOwnProperty(square.id)) tiles.push("greenLight");
      else if (this.coffees.hasOwnProperty(square.id)) tiles.push("coffee");

      return tiles.length > 1 ? tiles : tiles[0];
    }
    return "";
  };

  handleKeySquareAction(commander: Commander,
    square: SquareInterface,
    tool: "playerHome" | "bossHome" | "office"
  ) {
    console.log(`Adding ${tool}!`);
    commander.beginGroup();
    let id = square.id;
    let tileChanges = [];
    if (this[tool] === square.id) {
      commander.execute("makeNotDrivable", id);
      commander.execute("removeKeySquare", id, tool);
    } else {
      if (this[tool] > 0) {
        tileChanges.push(this[tool]);
        commander.execute("makeNotDrivable", this[tool]);
        commander.execute("removeKeySquare", this[tool], tool);
      }
      commander.execute("makeDrivable", id);
      commander.execute("makeKeySquare", id, tool);
    }
    commander.endGroup();
    tileChanges.push(id);
    return tileChanges;
  }

  handleStreetAction(commander: Commander, square: SquareInterface) {
    console.log("Adding street");
    let id = square.id;
    let tileChanges = [];

    commander.beginGroup();

    if (!this.isKeySquare(id)) {
      if (this.lights.hasOwnProperty(id)) {
        commander.execute("removeLight", id);
      }
      if (this.coffees.hasOwnProperty(id)) {
        commander.execute("removeCoffee", id);
      }
      if (square.drivable && square.schoolZone) {
        commander.execute("makeNotSchoolZone", id);
      } else if (square.drivable) {
        commander.execute("makeNotDrivable", id);
      } else {
        commander.execute("makeDrivable", id);
      }
    }

    commander.endGroup();
    tileChanges.push(id);
    return tileChanges;
  }

  handleSchoolZoneAction(commander: Commander, square: SquareInterface) {
    console.log("Adding school zone");
    let id = square.id;
    let tileChanges = [];

    commander.beginGroup();

    if (!this.isKeySquare(id)) {
      if (square.drivable && square.schoolZone) {
        commander.execute("makeNotSchoolZone", id);
        commander.execute("makeNotDrivable", id);
      } else if (square.drivable) {
        commander.execute("makeSchoolZone", id);
      } else {
        commander.execute("makeDrivable", id);
        commander.execute("makeSchoolZone", id);
      }
    }

    commander.endGroup();
    tileChanges.push(id);
    return tileChanges;
  }

  handleLightAction(commander: Commander, square: SquareInterface) {
    console.log("Adding light");
    let id = square.id;
    let tileChanges = [];

    commander.beginGroup();

    if (this.lights.hasOwnProperty(id)) {
      commander.execute("removeLight", id);
    } else {
      if (this.coffees.hasOwnProperty(id)) {
        commander.execute("removeCoffee", id);
      }
      if (!this.isKeySquare(id)) {
        commander.execute("addLight", id, randomNumBtwn(4, 12) * 1000);
      }
    }

    commander.endGroup();
    tileChanges.push(id);
    return tileChanges;
  }

  handleCoffeeAction(commander: Commander, square: SquareInterface) {
    console.log("Adding coffee");
    let id = square.id;
    let tileChanges = [];

    commander.beginGroup();

    if (this.coffees.hasOwnProperty(id)) {
      commander.execute("removeCoffee", id);
    } else {
      if (this.lights.hasOwnProperty(id)) {
        commander.execute("removeLight", id);
      }
      if (!this.isKeySquare(id)) {
        commander.execute("addCoffee", id);
      }
    }

    commander.endGroup();
    tileChanges.push(id);;
    return tileChanges;
  }

  handleEraserAction(commander: Commander, square: SquareInterface) {
    let id = square.id;
    let tileChanges = [];

    commander.beginGroup();

    if (this.playerHome === id) commander.execute("removeKeySquare", id, "playerHome");
    else if (this.bossHome === id) commander.execute("removeKeySquare", id, "bossHome");
    else if (this.office === id) commander.execute("removeKeySquare", id, "office");

    if (square.schoolZone) commander.execute("makeNotSchoolZone", id);
    if (square.drivable) commander.execute("makeNotDrivable", id);

    if (this.lights.hasOwnProperty(id)) commander.execute("removeLight", id);
    if (this.coffees.hasOwnProperty(id)) commander.execute("removeCoffee", id);

    commander.endGroup();
    tileChanges.push(id);
    return tileChanges;
  }

  compressSquares() {
      let compressed = this.squares.map(square => {
        square = {...square};
        square.borders = {...square.borders};
        for (let direction in square.borders) {
          let dir = <Direction>direction;
          if (square.borders[dir] !== null) {
            //@ts-ignore
            let borderId = square.borders[dir].id;
            //@ts-ignore
            square.borders[dir] = borderId;
          }
        }
        return square;
      });
    
      return JSON.stringify(compressed);
    
  }

  exportForSave() {
    const save = {
      board_height: this.height,
      board_width: this.width,
      player_home: this.playerHome,
      boss_home: this.bossHome,
      office: this.office,
      squares: this.compressSquares(),
      lights: JSON.stringify(this.lights),
      coffees: JSON.stringify(this.coffees)
    };
    return save;
  }
}

// export default MapGrid;
