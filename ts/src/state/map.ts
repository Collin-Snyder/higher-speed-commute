export interface MapGridInterface {
  squares: SquareInterface[];
  squareCount: number;
  width: number;
  height: number;
  playerHome: number;
  bossHome: number;
  office: number;
  lights: { [key: string]: number };
  generateTileMap: Function;
  get: Function;
  set: Function;
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

interface BordersInterface {
  up: SquareInterface | number | null;
  down: SquareInterface | number | null;
  left: SquareInterface | number | null;
  right: SquareInterface | number | null;
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
    let row = 25 * Y;
    let col = 25 * X + 1;
    let id = row * 40 + col;
    return this.get(id);
  }

  getAttributeByCoords(X: number, Y: number, attribute: string): any {
    let square = this.getSquareByCoords(X, Y);
    if (!square) {
      console.log("Invalid coordinates - no valid square at this location.");
      return null;
    }
    if (!square.hasOwnProperty(attribute)) {
      console.log(
        "Invalid attribute name. Accessible attributes are: ",
        ...Object.keys(square)
      );
      return null;
    }
   //@ts-ignore
    return square[attribute];
  }

  findPath(
    startX: number,
    startY: number,
    endX: number,
    endY: number
  ): string[] {
    //calculate best path from start to end using BFS or A-star
    //return array of XY coordinates corresponding to path (XY coords of all tiles in path)
    return [];
  }
}

export default MapGrid;
