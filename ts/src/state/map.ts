enum Direction {
  UP = "up",
  DOWN = "down",
  LEFT = "left",
  RIGHT = "right"
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
}

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

class MapGrid implements MapGridInterface {
  public squareCount: number;
  public squares: SquareInterface[];
  public playerHome: number;
  public bossHome: number;
  public office: number;
  public lights: { [key: string]: number };
  public pixelHeight: number;
  public pixelWidth: number;

  static fromMapObject(mapObj: MapObjectInterface): MapGrid {
    const {
      width,
      height,
      squares,
      playerHome,
      bossHome,
      office,
      lights,
    } = mapObj;

    const newMap = new this(width, height);

    newMap.playerHome = playerHome;
    newMap.bossHome = bossHome;
    newMap.office = office;
    newMap.lights = lights;

    for (let i = 0; i < squares.length; i++) {
      newMap.squares[i].drivable = squares[i].drivable;
      newMap.squares[i].schoolZone = squares[i].schoolZone;
    }

    return newMap;
  }

  constructor(public width: number, public height: number) {
    this.squares = [];
    this.squareCount = width * height;
    this.playerHome = 0;
    this.bossHome = 0;
    this.office = 0;
    this.lights = {};
    this.pixelWidth = this.width * 25;
    this.pixelHeight = this.height * 25;

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

    this.get = this.get.bind(this);
    this.set = this.set.bind(this);
    this.addBorders = this.addBorders.bind(this);
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
    //return the square object at the given coordinates
    X = Math.floor(X / 25) * 25;
    Y = Math.floor(Y / 25) * 25;
    // let row = 25 * Y;
    // let col = 25 * X + 1;
    let row = Y / 25;
    let col = X / 25;
    let id = row * 40 + col;
    console.log(id, row, col)
    return this.get(id);
  }

  getSurroundingSquares(x: number, y: number) {
    if (x < 0 || y < 0) {
      console.log("X and Y must be 0 or positive integers.");
      return [];
    }
    let currentSquareX = Math.floor(x / 25) * 25;
    let currentSquareY = Math.floor(y / 25) * 25;
    let boundBoxX = currentSquareX - 25;
    boundBoxX = boundBoxX < 0 ? 0 : boundBoxX;
    boundBoxX = boundBoxX > this.width ? this.width : boundBoxX;
    let boundBoxY = currentSquareY - 25;
    boundBoxY = boundBoxY < 0 ? 0 : boundBoxY;
    boundBoxX = boundBoxY > this.height ? this.height : boundBoxY;
    console.log("boundboxX: ", boundBoxX)
    console.log("boundboxY: ", boundBoxY)
    let startSquare: Square = <Square>this.getSquareByCoords(boundBoxX, boundBoxY);
    return [
      startSquare,
      this.get(startSquare.id + 1),
      this.get(startSquare.id + 2),
      this.get(startSquare.id + 40),
      this.get(startSquare.id + 42),
      this.get(startSquare.id + 80),
      this.get(startSquare.id + 81),
      this.get(startSquare.id + 82),
    ];

  }

  getSquaresInVicinity(x: number, y: number, d: number) {
    //d indicates how many squares in each direction around current square to include
    let max = Math.max;

    if (d < 1 || d > max(this.width, this.height)) {
      console.log(
        "Distance must be between 1 and the largest dimension of the map."
      );
      return [];
    }
    if (x < 0 || y < 0) {
      console.log("X and Y must be positive integers.");
      return [];
    }
    if (d === max(this.width, this.height)) return this.squares;

    let currentSquareX = Math.floor(x / 25) * 25;
    let currentSquareY = Math.floor(y / 25) * 25;
    let boundBoxX = currentSquareX - 25;
    boundBoxX = boundBoxX < 0 ? 0 : boundBoxX;
    let boundBoxY = currentSquareY - 25;
    boundBoxY = boundBoxY < 0 ? 0 : boundBoxY;
    let startSquare: Square = <Square>this.getSquareByCoords(boundBoxX, boundBoxY);
    let squares = [
      startSquare,
      this.get(startSquare.id + 1),
      this.get(startSquare.id + 2),
      this.get(startSquare.id + 40),
      this.get(startSquare.id + 42),
      this.get(startSquare.id + 80),
      this.get(startSquare.id + 81),
      this.get(startSquare.id + 82),
    ];

    //create "leftOf" = {left: "down", down: "right", right: "up", up: "left"}
    const leftOf = { left: "down", down: "right", right: "up", up: "left" };
    //create "current" = starting square
    let current = this.getSquareByCoords(x, y);
    //create "direction" variable - start at "left"
    let direction = "left";
    //create "count" variable - start at 0
    let count = 0;
    //create "layer" variable - start at 1
    let layer = 1;
    //"layer" will be current count / 8
    //create "added" variable - {[startId]: true}
    const added = {};
    // added[current.id] = true;
    //do while loop
    do {
      //check if left border has been added
      //if not, loop through borders to find a starting direction that exists
      //check if left border has been added
      //if yes:
      //current = current.borders[direction]
      //add current to array
      //add current.id to "added"
      //count++
      //check if count = 8 * layer
      //if yes, increment layer
      //if layer > d, end loop
      //if no:
      //current = current.borders[leftOf[direction]]
      //add current to array
      //add current.id to "added"
      //count++
    } while (layer <= d);
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
  ): Array[] | null {

    let startSquare: Square = <Square>this.getSquareByCoords(startX, startY);
    let endSquare: Square = <Square>this.getSquareByCoords(endX, endY);
  
    let frontier = new PathQueue();
    let cameFrom: {[key: string]: any} = {};
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
       
  
      if (currentId === endSquare.id) {
        foundTarget = true;
        break;
      }
  
      for (let direction in currentSquare.borders) {
        let next = currentSquare.borders[<Direction>direction];
        if (
          next &&
          next.drivable &&
          !cameFrom.hasOwnProperty(next.id)
        ) {
          frontier.put(next);
          cameFrom[next.id] = currentId;
        }
      }
      
    }
  
    if (!foundTarget) return null;
  
    let current = endSquare;
    //loop backwards through the path taken to reach the end and add to stack
    while (current.id !== startSquare.id) {
      let {X, Y} = current.coordinates();
      pathStack.push([X, Y]);
      // current.bossPath = true;
      current = <Square>this.get(cameFrom[current.id]);
    }
    console.log(pathStack);
    return pathStack;
  }
}

class PathQueue {
  public front: number;
  public end: number;
  public size: number;
  public storage: {[key: string]: any};
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

export default MapGrid;
